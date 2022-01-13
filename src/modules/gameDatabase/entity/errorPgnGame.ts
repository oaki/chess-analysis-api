import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class ErrorPgnGame {

    @PrimaryGeneratedColumn({type: "integer", unsigned: true})
    id: number;

    @Column({
        type: "text"
    })
    pgn: string;

    @Column({
        type: "text",
        nullable: true
    })
    errorMsg: string;
}