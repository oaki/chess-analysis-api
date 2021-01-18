import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class ErrorPgnGame {

    @PrimaryGeneratedColumn({type: "bigint"})
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