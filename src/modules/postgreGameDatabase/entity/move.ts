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
    fenHash: string;

    @ManyToMany(type => Game, game => game.moves)
    games: Game[];
}