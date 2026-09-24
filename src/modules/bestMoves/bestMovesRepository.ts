import {Connection} from "typeorm";
import {BestMove} from "./entity/bestMove";
import {Engine} from "./entity/engine";
import {Source} from "./entity/source";
import {PV_LENGTH} from "../../libs/moveEncoding";

export type BestMoveRecord = {
    positionKey: string;
    pv: readonly number[];
    evalCp: number;
    nodes: number;
    timeMs: number;
    depth: number | null;
    computeScore: number;
    engineId: number;
    sourceId: number;
    confirmations: number;
};

export type BestMoveWrite = BestMoveRecord;

export async function resolveEngineId(db: Connection, name: string): Promise<number> {
    const repository = db.getRepository(Engine);
    const existing = await repository.findOne({where: {name}});

    if (existing !== undefined) {
        return existing.id;
    }

    const entity = new Engine();
    entity.name = name;

    try {
        const saved = await repository.save(entity);
        return saved.id;
    } catch (error) {
        const raceWinner = await repository.findOne({where: {name}});
        if (raceWinner !== undefined) {
            return raceWinner.id;
        }
        throw error;
    }
}

export async function resolveSourceId(db: Connection, name: string): Promise<number> {
    const repository = db.getRepository(Source);
    const existing = await repository.findOne({where: {name}});

    if (existing !== undefined) {
        return existing.id;
    }

    const entity = new Source();
    entity.name = name;

    try {
        const saved = await repository.save(entity);
        return saved.id;
    } catch (error) {
        const raceWinner = await repository.findOne({where: {name}});
        if (raceWinner !== undefined) {
            return raceWinner.id;
        }
        throw error;
    }
}

function normalizePv(pv: readonly number[]): number[] {
    if (pv.length !== PV_LENGTH) {
        throw new Error(`pv must have exactly ${PV_LENGTH} entries, got ${pv.length}`);
    }

    return [...pv];
}

/**
 * Inserts a best-move row, or replaces the existing one only when the new
 * write's confirmations meet or exceed the stored row's AND its compute_score
 * is higher. A single live search can never silently overwrite a
 * multi-engine-confirmed import row (see docs/adr/0001-best-moves-cache.md).
 */
export async function upsertBestMove(db: Connection, write: BestMoveWrite): Promise<void> {
    const pv = normalizePv(write.pv);

    await db.manager.query(
        `INSERT INTO best_move (
            position_key, pv, eval_cp, nodes, time_ms, depth, compute_score, engine_id, source_id, confirmations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (position_key) DO UPDATE SET
            pv = excluded.pv,
            eval_cp = excluded.eval_cp,
            nodes = excluded.nodes,
            time_ms = excluded.time_ms,
            depth = excluded.depth,
            compute_score = excluded.compute_score,
            engine_id = excluded.engine_id,
            source_id = excluded.source_id,
            confirmations = excluded.confirmations
        WHERE excluded.confirmations >= best_move.confirmations
          AND excluded.compute_score > best_move.compute_score`,
        [
            write.positionKey,
            pv,
            write.evalCp,
            write.nodes,
            write.timeMs,
            write.depth,
            write.computeScore,
            write.engineId,
            write.sourceId,
            write.confirmations,
        ],
    );
}

export async function findBestMove(db: Connection, positionKey: string): Promise<BestMoveRecord | null> {
    const repository = db.getRepository(BestMove);
    const found = await repository.findOne({where: {positionKey}});

    if (found === undefined) {
        return null;
    }

    return {
        positionKey: found.positionKey,
        pv: found.pv,
        evalCp: found.evalCp,
        nodes: found.nodes,
        timeMs: found.timeMs,
        depth: found.depth,
        computeScore: found.computeScore,
        engineId: found.engineId,
        sourceId: found.sourceId,
        confirmations: found.confirmations,
    };
}
