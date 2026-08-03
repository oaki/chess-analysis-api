import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Game} from "./game";
import {Worker} from "./worker";

@Entity("users")
export class User {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({ type: "varchar", length: 90 })
    google_user_id: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    name: string;

    @Column({ type: "varchar", length: 255 })
    email: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    picture: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    given_name: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    family_name: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    locale: string;

    @OneToMany(type => Game, game => game.user)
    games: Game[];

    @OneToMany(type => Worker, worker => worker.user)
    workers: Worker[];
}
