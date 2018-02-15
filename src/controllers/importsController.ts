import {ParsePgn, IPosition} from "../models/ParsePgn";
import positionService from "../services/positionService";
import {getBasePath} from "../config";

import * as fs from 'fs';
import {IWorkerResponse} from "../interfaces";

export class ImportsController {
    private getFileContent(name: string) {

        const filename = name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        const path = `${getBasePath()}/src/games/${filename}.pgn`;

        return fs.readFileSync(path).toString();
    }

    public async import(name: string) {
        const content = this.getFileContent(name);
        const parser = new ParsePgn(content);
        parser.parseFileContent();
    }

}