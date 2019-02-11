import {Column, Entity, Index, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class EvaluatedPosition {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        length: 90
    })
    fen: string;

    @Index()
    @Column({
        length: 74
    })
    fenHash: string;

    @Column({
        type: "smallint"
    })
    depth: number;

    @Index()
    @Column("decimal", { precision: 4, scale: 2 })
    score: number;

    @Index()
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