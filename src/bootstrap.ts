import * as Hapi from 'hapi';
import * as good from 'good';
import * as hapiSwagger from 'hapi-swagger';
import * as vision from 'vision';
import * as inert from 'inert';
import buildRoutes from './routes/buildRoutes';
import {initSockets} from "./sockets/initSockets";
import {optionsGood} from "./config/optionsGood";
import {hapiServerOptions} from "./config/hapiServerOptions";
import {getConfig} from './config/';
import {AuthenticationController} from "./controllers/authenticationController";
const config = getConfig();

export async function initServer() {

    // const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
    // hmset(fen, 'ssss', JSON.stringify({fen}));
    //
    // const isExist = await exists(fen);
    // console.log('isExist', isExist);
    //
    // const all = await hgetall(fen);
    //
    // console.log('all keys', all);

    // const allMoves = await positionService.findAllMoves(fen);
    // console.log('allMoves', allMoves);

    // setup server Hapi
    const hapiServer = Hapi.server(hapiServerOptions);
    // hapiServer.realm.modifiers.route.prefix = `/api/v1`; // prefix pre vsetky route

    // await hapiServer.register(Bell);

    // hapiServer.auth.strategy('google', 'bell', {
    //     provider: 'google',
    //     password: 'ahfjdshfoadsifaefuiaekifuhakwer34i8322o8i723h32823h32iu',
    //     clientId: process.env.googleAuth.googleClientId,
    //     clientSecret: process.env.googleAuth.googleClientSecret,
    //     location: 'http://localhost:8080',
    //     isSecure: false     // Terrible idea but required if not using HTTPS especially if developing locally
    // });


    await hapiServer.register({
        plugin: require('hapi-api-version'),
        options: {
            validVersions: [1],
            defaultVersion: 1,
            vendorName: 'chess-analysis-api'
        }
    });

    await hapiServer.register(require('hapi-auth-jwt2'));

    hapiServer.auth.strategy('jwt', 'jwt',
        { key: config.jwt.key,          // Never Share your secret key
            validate: AuthenticationController.validateJwt,            // validate function defined above
            verifyOptions: { algorithms: [ 'HS256' ] } // pick a strong algorithm
        });

    initSockets(hapiServer);

    buildRoutes(hapiServer);


    const optionsSwagger = {
        info: {
            title: 'Chess analysis api',
            version: '1.0.0'
        },
        host: config.swagger.host,
        // schemes: ['https:'],
        basePath: '/'
    };

    await hapiServer.register([
        {
            plugin: good,
            options: optionsGood
        },
        inert,
        vision,
        {
            plugin: hapiSwagger,
            options: optionsSwagger
        },
       /* {
            plugin: require('./libs/hapi-auth-google'),
            options:{
                REDIRECT_URL: process.env.googleAuth.redirectUrl, // must match google app redirect URI from step 2.8
                handler: AuthenticationController.googleOAuthHangler, // your handler
                process.env: {  // optional route process.env (as for any route in hapi)
                    description: 'Google auth callback',
                    notes: 'Handled by hapi-auth-google plugin',
                    tags: ['api', 'auth', 'plugin']
                },
                access_type: 'online', // options: offline, online
                approval_prompt: 'auto', // options: always, auto
                scope: 'https://www.googleapis.com/auth/plus.profile.emails.read', // ask for their email address
                // can use process.env or if you prefer, define here in options:
                BASE_URL: process.env.googleAuth.baseUrl,
                GOOGLE_CLIENT_ID: process.env.googleAuth.googleClientId,
                GOOGLE_CLIENT_SECRET: process.env.googleAuth.googleClientSecret
            }
        }*/
    ]);



    await hapiServer.start();

    console.log(hapiServer.info.uri);
    return hapiServer;
}
