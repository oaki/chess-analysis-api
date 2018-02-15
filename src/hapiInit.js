"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Hapi = require("hapi");
const buildRoutes_1 = require("./routes/buildRoutes");
const config_1 = require("./config");
function hapiInit() {
    return __awaiter(this, void 0, void 0, function* () {
        const authenticator = new DefaultAuthenticator();
        const server = Hapi.server({
            debug: {
                request: '*',
                log: '*',
            },
            router: {
                stripTrailingSlash: true
            },
            routes: {
                validate: {
                    failAction: (request, h, err) => __awaiter(this, void 0, void 0, function* () {
                        throw err;
                    })
                }
            },
            port: config_1.default.server.port,
            cache: [{
                    name: 'redisCache',
                    engine: require('catbox-redis'),
                    host: '127.0.0.1',
                    partition: 'cache'
                }]
        });
        server.realm.modifiers.route.prefix = `/api/v1`; // prefix pre vsetky route
        const optionsGood = {
            ops: {
                interval: 10000
            },
            reporters: {
                myFileReporter: [{
                        module: 'good-squeeze',
                        name: 'Squeeze',
                        args: [{
                                ops: '*',
                                error: '*',
                                response: '*',
                                request: '*'
                            }]
                    }, {
                        module: 'good-squeeze',
                        name: 'SafeJson'
                    }, {
                        module: 'good-file',
                        args: ['./log/hapilog.log']
                    }],
            }
        };
        const optionsSwagger = {
            info: {
                title: 'Social Communities Documentation',
                version: '1.0.0'
            },
            basePath: '/api/v1' // test environment
        };
        yield server.register([
            {
                plugin: require('good'),
                options: optionsGood
            },
            require('inert'),
            require('vision'),
            {
                plugin: require('hapi-swagger'),
                options: optionsSwagger
            },
            require('hapi-auth-bearer-token')
        ]);
        server.auth.strategy("admin", "bearer-access-token", {
            validate: function (request, token) {
                return __awaiter(this, void 0, void 0, function* () {
                    const isValid = yield authenticator.checkAuth(token, true);
                    const credentials = { token };
                    const artifacts = { test: 'info' };
                    return { isValid, credentials, artifacts };
                });
            }
        });
        server.auth.strategy("user", "bearer-access-token", {
            validate: function (request, token) {
                return __awaiter(this, void 0, void 0, function* () {
                    const isValid = yield authenticator.checkAuth(token, false);
                    const credentials = { token };
                    const artifacts = { test: 'info' };
                    return { isValid, credentials, artifacts };
                });
            }
        });
        buildRoutes_1.default(server);
        yield server.start();
        return server;
    });
}
exports.hapiInit = hapiInit;
