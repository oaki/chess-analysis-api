import {Column, Entity, Index, ManyToOne, PrimaryColumn} from "typeorm";
import {Game} from "./game";
import {Move} from "./move";

@Entity()
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

    @ManyToOne(() => Move)
    public move: Move;
}