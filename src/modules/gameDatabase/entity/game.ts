import {Column, Entity, Index, JoinTable, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {GameMovesMove} from "./gameMovesMove";

@Entity()
export class Game {

    @PrimaryGeneratedColumn({type: "integer", unsigned: true})
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
        type: "text",
        nullable: true,
    })
    originalPgn: string;

    @Index()
    @Column({
        length: 33
    })
    pgnHash: string;

    @Column({
        type: "enum",
        enum: [
            "1-0",
            "0-1",
            "1/2-1/2"
        ]
    })
    result: string;

    // @OneToMany(() => GameMovesMove, (gameMovesMove) => gameMovesMove.game)
    // @JoinTable()
    // public gameMovesMove: GameMovesMove[];
}