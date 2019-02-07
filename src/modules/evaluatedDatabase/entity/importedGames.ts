import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class ImportedGames {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        length: 90
    })
    event: string;

    @Column({
        type: "date"
    })
    event_date: Date;

    @Column({
        length: 90
    })
    white_name: string;

    @Column({
        length: 90
    })
    black_name: string;

    @Column({
        type: "enum",
        enum: [
            "1-0",
            "1/2-1/2",
            "0-1"
        ]
    })
    result: "1-0" | "1/2-1/2" | "0-1";

    @Column({
        type: "integer"
    })
    black_elo: number;

    @Column({
        type: "integer"
    })
    white_elo: number;

    @Column({
        length: 90
    })
    opening: string;

    @Column({
        type: "text"
    })
    moves: string;

    @Column({
        type: "boolean"
    })
    isParsed: boolean;
}