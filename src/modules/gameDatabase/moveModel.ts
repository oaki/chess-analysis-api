import {indexEntities, MOVE_PREFFIX} from "./entity/indexEntities";

export function getMoveInstance(fenHash: string) {
    const model = getMoveModel(fenHash);
    const instance = new model;
    instance.fenHash = getFenHashWithoutPrefix(fenHash);
    return instance;
}

export function getMoveModel(fenHash: string) {
    const firstTwoLetters = fenHash.substr(0, 2);

    const modelName = `${MOVE_PREFFIX}${firstTwoLetters}`;
    const model = indexEntities[modelName];
    if (!model) {
        throw new Error(`Model is not exist ${modelName}`);
    }

    return model;
}

export function getFenHashWithoutPrefix(fenHash:string) {
    return fenHash.substr(2);
}