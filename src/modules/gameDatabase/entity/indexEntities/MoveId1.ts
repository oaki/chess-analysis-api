import {Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Game} from "./../game";

@Entity()
@Index(["fenHash", "gamesId"], { unique: true })
export class MoveId1 {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Index()
    @Column({length: 18})
    fenHash: string;

    @Index()
    @Column({type: "bigint"})
    gamesId: number;
    
    @ManyToOne(type => Game, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    games: Game[];
}
