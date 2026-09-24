---
status: accepted
---

# Replace evaluated_position with a best_moves cache

## Context

`evaluated_position` (Postgres, `chess_eval_v2`) backs the `watch-analyze` cache (`positionService.findCompleteAnalysis`, used by `POST /v1/watch/analyze`). It has 340k rows but only 211k distinct positions — every "better evaluation found" write is a plain `INSERT`, never an `UPDATE`, so 38% of the table is superseded rows nobody reads. It is fed from two disconnected sources with no way to compare them: live single-engine watch-analyze searches, and a TCEC/CCRL PGN import pipeline (`imported_games` staging table, 115 MB of raw per-game JSON sitting in production Postgres, then `parseController.ts` replaying moves and calling `positionService.add()`).

A teammate proposed a redesigned `best_moves` table: one row per position (`position_key` as primary key), compact numeric encodings instead of strings, raw data kept out of production Postgres, and — most importantly — a rule that an imported position is only stored when multiple independent engines agree on the best move, rather than trusting whichever single search ran longest.

## Decision

Replace `evaluated_position` with `best_moves`, one row per `position_key` (primary key, so duplication is structurally impossible instead of policy-dependent).

- **`position_key` reuses the existing `decodeFenHash`** (Polyglot 64-bit Zobrist hash, already used by `Move.fenHash`, `EvaluatedPosition.fenHash`, and the opening-book `.bin` lookup) rather than introducing a new 128-bit hash. It does not disambiguate on halfmove clock; that's an explicit, accepted gap for v1 (see Considered Options).
- **`pv` is a fixed 8-ply array of 16-bit encoded moves**, not a single `move` column. `pv[0]` is the best move. This preserves the existing `watch-analyze` response contract (`mapWorkerEvaluation` returns up to 8 plies of continuation) that a single-move column would have silently broken. WDL is not carried — `evaluated_position` never stored it either, so this isn't a regression.
- **Two write modes, same table:**
  - *Batch import* (TCEC/CCRL): a row is only written when multiple independent engines agree on the move for a position. Disagreement means the position is skipped entirely — the table is meant to hold positions we have good reason to trust, not every position seen.
  - *Live watch-analyze search*: always writes with `confirmations = 1` and a dedicated `source` value (no other engine to reach consensus with at insert time).
- **On conflict, `confirmations` outranks `compute_score`.** A write replaces an existing row only if it matches or exceeds the existing row's `confirmations` *and* has a higher `compute_score`. A single live search can never silently overwrite a multi-engine-confirmed import row. Enforcing this costs one extra `WHERE` clause on the `ON CONFLICT ... DO UPDATE`, so it's kept even though the collision case (a live search landing on a position that also has an import-confirmed row) is rare.
- **`engine` and `source` are lookup tables (`engines`, `sources`) with `SMALLINT` ids on `best_moves`**, not hardcoded TypeScript enums. New TCEC seasons and engine versions get an `INSERT` at import time, not a code deploy.
- **No `flags` column.** Nothing in the current design needs one; add it later with a documented meaning if a real need appears.
- **The import pipeline does not stage raw games in Postgres.** `imported_games` is retired. The existing `ParsePgn.parsePgnWithJson()` parser (already built for TCEC's `{d=,n=,tl=,pv=,wv=,fen=}` comment format — confirmed against the real `games/evaluation/superfinal15.pgn`) is reused as-is. Filtering, deduplication, and consensus-checking happen in an in-memory or on-disk intermediate; only rows that pass consensus are written to production Postgres.

## Considered Options

- **128-bit hash (MD5 or similar) for `position_key`, including halfmove clock in the canonical position.** Rejected for v1: the project has one canonical position hash everywhere else (`decodeFenHash`), and reusing it costs nothing. Halfmove-clock disambiguation only matters for 50-move-rule edge cases in endgames, which the existing `piecesCount > 7` filter already excludes from being cached at all. Revisit if a concrete endgame case shows this matters.
- **`compute_score` always wins on overwrite, no `confirmations` check.** Rejected: `compute_score` measures search effort, not correctness — a single engine can have a persistent blind spot regardless of depth, while independent engines agreeing on a move is stronger evidence of correctness. The safeguard is nearly free to implement, so it was kept despite the low collision probability.
- **Hardcoded `Engine`/`Source` TypeScript enums as originally proposed.** Rejected: TCEC/CCRL release new seasons and engine versions on their own schedule; a hardcoded enum would force a code deploy for every one. Lookup tables solve this without adding a join to the hot read path (engine/source are id columns on `best_moves` itself).
- **Streaming-parser-to-Parquet import pipeline.** Rejected: no existing Parquet dependency in this Node/TS stack, and a working parser for this exact PGN format already exists. Reusing it with a simpler in-memory/on-disk intermediate achieves the same "keep raw data out of production Postgres" goal without new infrastructure.

## Follow-up: `minConfirmations` is configurable per import

Dry-running the import pipeline against the real `games/evaluation/superfinal15.pgn` (see `pgnBestMovesImporter.ts`) surfaced a real gap: a TCEC superfinal is a head-to-head match between exactly two engines, so two independent engines landing on the identical position (not just a similar one — `position_key` requires an exact match) essentially never happens across a 100-game set. Requiring `confirmations >= 2` against this file wrote zero positions, even though 7,663 observations cleared the node/eval filter.

`buildConsensus()` and `importPgnContent()` now take an optional `minConfirmations` (default `MINIMUM_CONFIRMATIONS = 2`), exposed as a query param on `POST /v1/evaluation-database/best-moves/{name}`. A source that structurally can't produce independent agreement (a two-engine match) can be imported with `minConfirmations=1` — the position still has to clear the import filter's node/eval thresholds, it just loses the cross-engine corroboration signal. Multi-engine sources (CCRL, Fishtest, TCEC round-robin stages) should keep the default of 2.

## Consequences

- `watchAnalysisRoute.ts` and `positionService.ts` need a new read/write path against `best_moves` instead of `evaluated_position`.
- `imported_games` (115 MB) and the `evaluated_position` duplicate rows can eventually be dropped once the cutover is verified.
- The import filter's "not a mate evaluation" check currently works by accident (`Number("M13")` is `NaN`, which happens to fail the score-threshold comparison) — this should become an explicit check (`wv` starting with `"M"`) during implementation rather than carried forward as a hidden behavior.
- Exact import thresholds (node/eval/engine-version cutoffs) and the `evaluated_position` → `best_moves` cutover sequencing are left as implementation-time, cheaply-reversible parameters — not part of this decision.
