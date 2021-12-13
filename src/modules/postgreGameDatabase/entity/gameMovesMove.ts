import {Column, Entity, Index, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";
import {Game} from "./game";
import {Move} from "./move";

@Entity()
// @Index((relation: GameMovesMove) => [relation.move, relation.game], { unique: true })
export class GameMovesMove {
    @PrimaryColumn({type: "integer", unsigned: true})
    public moveId: number;

    @PrimaryColumn({type: "integer", unsigned: true})
    public gameId: number;

    @Index()
    @Column({type: "smallint"})
    cw: number;

    @Index()
    @Column({type: "smallint"})
    cb: number;

    @ManyToOne(() => Game, (game) => game.gameMovesMove)
    public game: Game;

    @ManyToOne(() => Move, (move) => move.gameMovesMove)
    public move: Move;
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