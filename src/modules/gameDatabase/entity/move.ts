import {Column, Entity, Index, PrimaryGeneratedColumn, Unique} from "typeorm";

@Entity()
// @Unique('fenHash')
export class Move {

    @PrimaryGeneratedColumn({type: "integer", unsigned: true})
    id: number;

    @Column({
        length: 74,
        unique: true
    })
    fenHash: string;

    @Column({
        unsigned: true
    })
    numOfGames: number;

    // @OneToMany(() => GameMovesMove, (gameMovesMove) => gameMovesMove.move)
    // public gameMovesMove: GameMovesMove[];
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