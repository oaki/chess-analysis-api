import {Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {Move} from "./move";

@Entity()
export class Game {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        length: 50
    })
    white: string;

    @Column({
        length: 50
    })
    black: string;

    @Column({
        type: "smallint",
        unsigned: true,
    })
    whiteElo: number;

    @Column({
        type: "smallint",
        unsigned: true,
    })
    blackElo: number;

    @Column({
        type: "text"
    })
    pgn: string;

    @Column({
        type: "enum",
        enum: [
            "1-0",
            "0-1",
            "1/2-1/2"
        ]
    })
    result: string;

    @ManyToMany(type => Move, move => move.games)
    @JoinTable()
    moves: Move[];
}