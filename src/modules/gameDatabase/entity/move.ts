import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Move {

    @PrimaryGeneratedColumn({type: "integer", unsigned: true})
    id: number;

    @Column({ type: "varchar", length: 74, unique: true })
    fenHash: string;

    @Column({ type: "integer", unsigned: true })
    numOfGames: number;
}
