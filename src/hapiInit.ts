import * as Hapi from 'hapi';
import routes from './routes/buildRoutes';

import config from "./config";

export async function hapiInit() {

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
        failAction: async (request, h, err) => {
          throw err;
        }
      }
    },
    port: config.server.port,
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

  await server.register([
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
    validate: async function (request, token: string) {
      const isValid = await authenticator.checkAuth(token, true);
      const credentials = {token};
      const artifacts = {test: 'info'};
      return {isValid, credentials, artifacts};
    }
  });

  server.auth.strategy("user", "bearer-access-token", {
    validate: async function (request, token: string) {
      const isValid = await authenticator.checkAuth(token, false);
      const credentials = {token};
      const artifacts = {test: 'info'};
      return {isValid, credentials, artifacts};

    }
  });

  routes(server);

  await server.start();
  return server;
}
