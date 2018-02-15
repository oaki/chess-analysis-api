import {models} from "../models";

export class PagesController {
    public async defaultRender() {
        return await models.User.findById(id);
    }
}