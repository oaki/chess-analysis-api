import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {User} from "./user";

@Entity("workers")
export class Worker {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        length: 255
    })
    uuid: string;

    @Column({
        length: 255
    })
    name: string;

    @Column({
        type: "float"
    })
    score: number;

    @Column({
        type: "integer"
    })
    lastUsed: number;

    @CreateDateColumn({type: "timestamp", nullable: true})
    created_at: Date;

    @UpdateDateColumn({type: "timestamp", nullable: true})
    updated_at: Date;

    @ManyToOne(type => User, user => user.workers)
    public user: User;

}