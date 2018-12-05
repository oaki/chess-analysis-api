import {Column, Entity, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {Game} from "./game";


@Entity()
export class Move {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        unique: true,
        length: 74
    })
    fen: string;

    @Column({
        nullable: true
    })
    data: string | null;

    @ManyToMany(type => Game, game => game.moves)
    games: Game[];
}