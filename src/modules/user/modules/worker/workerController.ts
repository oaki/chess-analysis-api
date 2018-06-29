import {models} from "../../../../models/database";
import * as Boom from "boom";
import {BaseResponse} from "../../../../libs/baseResponse";
import {SocketService} from "../../../../sockets/initSockets";

import {WorkerAttributes} from "./models/workerModel";


export class WorkerController {

    async getAll(props: IGetProps) {
        const workerList = await models.Worker.findAll({
            where: {
                user_id: props.userId
            },
            limit: props.limit,
            offset: props.offset,
            raw: true
        });

        return workerList.map((worker:WorkerAttributes)=>{
            return {...worker, ready: SocketService.isWorkerOnline(worker.uuid)}
        });

    }

    async checkStatus(props: ICheckStatusProps) {

        return SocketService.isWorkersOnline(props.uuids);
    }

    async add(props: IAddProps) {
        try {
            const worker = await models.Worker.create({
                uuid: props.workerUuid,
                name: props.name,
                user_id: props.userId
            });
            return worker;
        } catch (e) {
            console.log(e);
            throw Boom.conflict();
        }
    }

    async delete(props: IDeleteProps) {
        const worker = await models.Worker.find({
            where: {
                id: props.id,
                user_id: props.userId
            }
        });

        if (!worker) {
            throw Boom.notFound('Worker is not found.')
        }

        await worker.destroy();


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
