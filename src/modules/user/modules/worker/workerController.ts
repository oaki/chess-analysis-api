import {models} from "../../../../models/database";
import * as Boom from "boom";
import {BaseResponse} from "../../../../libs/baseResponse";

export class WorkerController {

    async getAll(props: IGetProps) {
        const workerList = await models.Worker.findAll({
            where: {
                user_id: props.userId
            },
            limit: props.limit,
            offset: props.offset
        });

        return workerList;

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

interface IAddProps {
    name: string;
    workerUuid: string;
    userId: number;
}

interface IDeleteProps {
    id: number;
    userId: number;
}
