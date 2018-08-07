import {BaseResponse} from "../../libs/baseResponse";
import {models} from "../../models/database";

interface ILogProps {
    payload: string;
}

export class LogController {

    static save(props: ILogProps) {
        const arr = JSON.parse(props.payload);

        arr.forEach((log) => {
            models.Log.create({
                data: JSON.stringify(log),
                uuid: log.uuid
            });
        })

        return BaseResponse.getSuccess();
    }
}