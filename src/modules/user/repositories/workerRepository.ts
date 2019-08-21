import {AbstractRepository, EntityRepository, FindConditions} from "typeorm";
import {Worker} from "../entity/worker";

@EntityRepository(Worker)
export class WorkerRepository extends AbstractRepository<Worker> {
    public async find(conditions?: FindConditions<Worker>): Promise<Worker[]> {
        return await this.repository.find(conditions);
    }
}