import {Column, Entity, PrimaryColumn} from "typeorm";

const bigintTransformer = {
    to: (value: number): number => value,
    from: (value: string): number => Number(value),
};

@Entity("best_move")
export class BestMove {

    @PrimaryColumn({name: "position_key", type: "varchar", length: 20})
    positionKey: string;

    @Column({type: "smallint", array: true})
    pv: number[];

    @Column({name: "eval_cp", type: "smallint"})
    evalCp: number;

    @Column({type: "bigint", transformer: bigintTransformer})
    nodes: number;

    @Column({name: "time_ms", type: "integer"})
    timeMs: number;

    @Column({type: "smallint", nullable: true})
    depth: number | null;

    @Column({name: "compute_score", type: "smallint"})
    computeScore: number;

    @Column({name: "engine_id", type: "smallint"})
    engineId: number;

    @Column({name: "source_id", type: "smallint"})
    sourceId: number;

    @Column({type: "smallint", default: 1})
    confirmations: number;
}
