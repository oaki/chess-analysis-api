# Chess Analysis API

Backend that serves chess position analysis: cached Stockfish evaluations for live-searched positions, a curated best-move lookup, and a static opening-book explorer.

## Language

**Best Moves Cache** (`best_moves` table):
The single-row-per-position store of the best known move for a chess position, replacing `evaluated_position` as the analysis cache backing `/v1/watch/analyze`. One row per `position_key`.
_Avoid_: Evaluation cache (old name), evaluated_position (superseded)

**Position Key**:
The lookup key for a row in the Best Moves Cache. Reuses the existing `decodeFenHash` (Polyglot 64-bit Zobrist hash over piece placement, side to move, castling rights, and en passant — it deliberately excludes halfmove clock and fullmove number). The same hash already used by `Move.fenHash`, `EvaluatedPosition.fenHash`, and the `.bin` opening-book lookup.
_Avoid_: fenHash (old field name in evaluated_position/move — same concept, new table), 128-bit hash (rejected — no halfmove-clock disambiguation needed for v1)

**Principal Variation (pv)**:
In the Best Moves Cache, a fixed-length array of exactly 8 plies, each move 16-bit encoded (6 bits from-square, 6 bits to-square, 3 bits promotion). Replaces a single `move` column — `pv[0]` is the best move itself.
_Avoid_: move column (dropped — pv[0] covers it), WDL (out of scope — not stored today either, dropped from this table)

## Decisions

- **`best_moves` replaces `evaluated_position` entirely** (not an additional table). The watch-analysis cache read/write path moves onto it.
- **Import pipeline drops the `imported_games` Postgres staging table.** The existing `ParsePgn.parsePgnWithJson()` parser (already built for TCEC-style annotated PGN, see `games/evaluation/superfinal15.pgn`) is reused, but filter/dedup/consensus happens in an in-memory or on-disk intermediate — only final `best_moves` rows reach production Postgres.
- **Two write modes feed `best_moves`:** batch import (TCEC/CCRL) requires cross-source consensus before a row is written at all; live watch-analyze search writes unconditionally with `confirmations = 1` and a dedicated `source` value, same "higher compute_score wins" replace rule `evaluated_position` uses today.
- **`confirmations` outranks `compute_score` on overwrite.** A write only replaces an existing row if it matches or exceeds the existing row's `confirmations` AND has a higher `compute_score`. Prevents a single live search from silently overwriting a multi-engine-confirmed import row. Cheap to enforce (one extra `WHERE` condition in the `ON CONFLICT` clause), so kept even though the collision case is rare.
- **`engine` and `source` are lookup tables (`engines`, `sources`), not hardcoded enums.** New TCEC seasons/engine versions get an `INSERT` at import time, not a code deploy. Columns on `best_moves` stay `SMALLINT` ids, no join on the hot lookup path.
- **No `flags` column in v1.** No defined bit meaning today; add a clearly-named column later if a concrete need shows up.
