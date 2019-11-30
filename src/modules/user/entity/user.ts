import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Game} from "./game";
import {Worker} from "./worker";

@Entity("users")
export class User {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        length: 90
    })
    google_user_id: string;

    @Column({
        length: 255,
        nullable: true
    })
    name: string;

    @Column({
        length: 255
    })
    email: string;

    @Column({
        length: 255,
        nullable: true
    })
    picture: string;

    @Column({
        length: 255,
        nullable: true
    })
    given_name: string;

    @Column({
        length: 255,
        nullable: true
    })
    family_name: string;

    @Column({
        length: 255,
        nullable: true
    })
    locale: string;

    @OneToMany(type => Game, game => game.user)
    games: Game[];

    @OneToMany(type => Worker, worker => worker.user)
    workers: Worker[];
}