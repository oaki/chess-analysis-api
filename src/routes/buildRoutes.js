"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const files_1 = require("./files");
const position_1 = require("./position");
const openingBook_1 = require("./openingBook");
const imports_1 = require("./imports");
function routes(server) {
    server.route(files_1.filesRoute(server));
    server.route(position_1.positionRoute());
    server.route(openingBook_1.openingBookRoute());
    server.route(imports_1.importsRoute());
}
exports.default = routes;
