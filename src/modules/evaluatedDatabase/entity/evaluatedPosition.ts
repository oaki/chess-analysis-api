import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class EvaluatedPosition {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        length: 90
    })
    fen: string;

    @Column({
        length: 74
    })
    fenHash: string;

    @Column({
        type: "smallint"
    })
    depth: number;

    @Column("decimal", { precision: 4, scale: 2 })
    score: number;

    @Column({
        type: "integer"
    })
    nodes: number;

    @Column()
    pv: string;

    @Column({
        type: "integer"
    })
    time: number;

    @Column({
        type: "integer"
    })
    tbhits: number;

    @Column({
        type: "boolean"
    })
    import: boolean;
}