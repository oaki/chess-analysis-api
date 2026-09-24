-- Evaluation DB (chess_eval_v2, PostgreSQL). See docs/adr/0001-best-moves-cache.md.
-- Introduces best_move as the replacement for evaluated_position, plus its
-- engine/source lookup tables. Run manually against the evaluation database;
-- not applied automatically by the application (synchronize is always false).

CREATE TABLE IF NOT EXISTS engine (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS source (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS best_move (
    position_key VARCHAR(20) PRIMARY KEY,
    pv SMALLINT[] NOT NULL,
    eval_cp SMALLINT NOT NULL,
    nodes BIGINT NOT NULL,
    time_ms INTEGER NOT NULL,
    depth SMALLINT,
    compute_score SMALLINT NOT NULL,
    engine_id SMALLINT NOT NULL REFERENCES engine (id),
    source_id SMALLINT NOT NULL REFERENCES source (id),
    confirmations SMALLINT NOT NULL DEFAULT 1
);

-- Seed the engines/sources the import pipeline and live watch-analyze writer
-- reference by name (see src/modules/bestMoves and src/services/positionService.ts).
-- New TCEC seasons / engine versions get an INSERT here at import time, not a
-- code deploy — this seed list only needs to cover what ships with v1.
INSERT INTO engine (name) VALUES
    ('Stockfish 19'),
    ('Stockfish 19-dev'),
    ('Stockfish 18'),
    ('Stockfish 18-dev'),
    ('Stockfish 17.1'),
    ('Live Watch-Analyze Worker')
ON CONFLICT (name) DO NOTHING;

INSERT INTO source (name) VALUES
    ('TCEC'),
    ('CCRL 40/15'),
    ('Fishtest LTC'),
    ('CCC'),
    ('live-watch-analyze')
ON CONFLICT (name) DO NOTHING;
