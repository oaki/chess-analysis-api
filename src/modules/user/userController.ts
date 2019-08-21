import {appDbConnection} from "../../libs/connectAppDatabase";
import {User} from "./entity/user";

export class UserController {
    async getProfile(props: { userId: number }) {

        const db = await appDbConnection;
        const userRepository = await db.getRepository(User);

        return await userRepository.findOne(props.userId);
    }

    static async getUserRepository() {
        const db = await appDbConnection;
        return db.getRepository(User);
    }
}
