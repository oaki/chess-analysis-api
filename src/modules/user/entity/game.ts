import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {User} from "./user";

@Entity("games")
export class Game {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        type: "text"
    })
    moves: string;

    @CreateDateColumn({type: "timestamp", nullable: true})
    created_at: Date;

    @UpdateDateColumn({type: "timestamp", nullable: true})
    updated_at: Date;

    @ManyToOne(type => User, user => user.games)
    user: User;

    getMoves() {
        return JSON.parse(this.moves);
    }
}