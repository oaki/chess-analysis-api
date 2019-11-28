import {Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
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
//
// @Entity("game_moves_move")
// export class GameMoves {
//     @Index()
//     @Column({
//         nullable: true,
//         type: "smallint",
//         unsigned: true,
//     })
//     cw: number;
//
//     @Index()
//     @Column({
//         nullable: true,
//         type: "smallint",
//         unsigned: true,
//     })
//     cb: number;
//
//     @JoinColumn()
//     @ManyToOne(type => Game, game => game.moves, {primary: true})
//     game: Game;
//
//     @JoinColumn()
//     @ManyToOne(type => Move, move => move.games, {primary: true})
//     move: Move;
// }