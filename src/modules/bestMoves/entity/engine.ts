import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity("engine")
export class Engine {

    @PrimaryGeneratedColumn({type: "smallint"})
    id: number;

    @Column({type: "varchar", length: 50, unique: true})
    name: string;
}
