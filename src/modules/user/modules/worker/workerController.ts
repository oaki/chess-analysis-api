import * as Boom from "boom";
import {BaseResponse} from "../../../../libs/baseResponse";
import {SocketService} from "../../../../sockets/initSockets";
import {appDbConnection} from "../../../../libs/connectAppDatabase";
import {Worker} from "../../entity/worker";
import {UserController} from "../../userController";

export class WorkerController {

    async getAll(props: IGetProps) {

        const db = await appDbConnection;
        const workerRepository = await db.getRepository(Worker);

        const workerList = await workerRepository.createQueryBuilder("worker")
            .where("userId = :id", {id: props.userId})
            .limit(props.limit)
            .offset(props.offset)
            .getMany();

        console.log(workerList);
        return workerList.map((worker: any) => {
            return {...worker, ready: SocketService.isWorkerOnline(worker.uuid)}
        });

    }

    async checkStatus(props: ICheckStatusProps) {

        return SocketService.isWorkersOnline(props.uuids);
    }

    static async getWorkerRepository() {
        const db = await appDbConnection;
        return await db.getRepository(Worker);
    }


    async add(props: IAddProps) {
        try {
            const repository = await WorkerController.getWorkerRepository();
            const userRepository = await UserController.getUserRepository();

            const user = await userRepository.findOne(props.userId);
            const worker = new Worker();
            worker.uuid = props.workerUuid;
            worker.user = user;
            worker.name = props.name;
            worker.lastUsed = 0;
            worker.score = 0;
            await repository.save(worker);

            return worker;
        } catch (e) {
            console.log(e);
            throw Boom.conflict();
        }
    }

    async delete(props: IDeleteProps) {
        const repository = await WorkerController.getWorkerRepository();
        const worker = await repository.findOne({
            where: {
                id: props.id,
                user_id: props.userId
            }
        });

        if (!worker) {
            throw Boom.notFound("Worker is not found.")
        }

        await repository.remove(worker);


        return BaseResponse.getSuccess();

    }
}


interface IGetProps {
    offset: number;
    limit: number;
    userId: number;
}

interface ICheckStatusProps {
    uuids: string[];
    userId: number;
}

interface IAddProps {
    name: string;
    workerUuid: string;
    userId: number;
}

interface IDeleteProps {
    id: number;
    userId: number;
}
