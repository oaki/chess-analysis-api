import {sync} from "../../models/database";
import {BaseResponse} from "../../libs/baseResponse";

export class SyncController {
    async sync(options:{}) {

        await sync(options);
        return BaseResponse.getSuccess();
    }

}
