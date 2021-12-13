import {Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Game} from "./game";
import {GameMovesMove} from "./gameMovesMove";

@Entity()
export class Move {

    @PrimaryGeneratedColumn({type: "integer", unsigned: true})
    id: number;

    @Index()
    @Column({
        length: 74
    })
    fenHash: string;

    @Column({
        unsigned: true
    })
    numOfGames: number;

    @OneToMany(() => GameMovesMove, (gameMovesMove) => gameMovesMove.move)
    public gameMovesMove: GameMovesMove[];
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