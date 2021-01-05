import {Column, Entity, Index, JoinTable, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {GameMovesMove} from "./gameMovesMove";

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

    @Index()
    @Column({
        type: "smallint",
        unsigned: true,
    })
    whiteElo: number;

    @Index()
    @Column({
        type: "smallint",
        unsigned: true,
    })
    blackElo: number;

    @Index()
    @Column({
        nullable: true,
        type: "smallint",
        unsigned: true,
    })
    coefW: number;

    @Index()
    @Column({
        nullable: true,
        type: "smallint",
        unsigned: true,
    })
    coefB: number;

    @Column({
        type: "text"
    })
    pgn: string;

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

    @OneToMany(() => GameMovesMove, (gameMovesMove) => gameMovesMove.game)
    @JoinTable()
    public gameMovesMove: GameMovesMove[];
}