import openingsService from "../../services/openingsService";
import * as Boom from "boom";

export class OpeningBookController {

    async get(props: GetProps) {

        const result = await openingsService.find(props.fen);
        console.log('result',result);
        if (!result) {
            throw Boom.notFound('Fen in not found.');
        }

        return result;

    }
}

interface GetProps{
    fen: string;
}