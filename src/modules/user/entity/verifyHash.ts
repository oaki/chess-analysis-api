import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity("verify_hashes")
export class VerifyHash {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({
        length: 90
    })
    hash: string;

    @Column({
        type: "text"
    })
    token: string;

    @Column({
        type: "text", nullable: true
    })
    google_token: string;

    @CreateDateColumn({type: "timestamp", nullable: true})
    created_at: Date;

    @UpdateDateColumn({type: "timestamp", nullable: true})
    updated_at: Date;

}