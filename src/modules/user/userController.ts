import {models} from "../../models/database";

export class UserController {
    async getProfile(props: { userId: number }) {
        return await models.User.findOne({
            where: {
                id: props.userId
            },
            raw: true
        });
    }
}
