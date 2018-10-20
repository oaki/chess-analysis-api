import {models} from "../../models/database";

export class UserController {
    async getProfile(props: { userId: number }) {
        return await models.User.find({
            where: {
                id: props.userId
            },
            raw: true
        });
    }
}
