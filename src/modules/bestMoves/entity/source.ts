import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity("source")
export class Source {

    @PrimaryGeneratedColumn({type: "smallint"})
    id: number;

    @Column({type: "varchar", length: 50, unique: true})
    name: string;
}
