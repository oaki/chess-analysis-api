import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class EvaluatedPosition {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        length: 74
    })
    fen: string;

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
        type: "tinyint"
    })
    import: number;
}