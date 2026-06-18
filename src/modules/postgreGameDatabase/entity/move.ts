import {Column, Entity, Index, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Move {

    @PrimaryGeneratedColumn({type: "integer", unsigned: true})
    id: number;

    @Index()
    @Column({ type: "varchar", length: 74 })
    fenHash: string;

    @Column({ type: "integer", unsigned: true })
    numOfGames: number;
}
