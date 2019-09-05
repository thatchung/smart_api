require('./core/_global');
const fs = require('fs');
const cluster = require('cluster');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const path = require('path');
const formidable = require('formidable');
const app = express();
const server = http.createServer(app);
const socket = socketIO(server);
module.exports = {app, socket};

const Config = require('./config');
const Elastic = require('./core/elastic');
const Db = require('./model');
const Route = require('./core/route');
const Types = require('./core/types');
const Swagger = require('./core/swagger');
const moment = require('moment');
const mqttHandler = require('./core/mqtt');

//action on google
const actions_on_google = require("actions-on-google");
const session = require('express-session');
const Auth_Smarthome =  require("./auth-smarthome");
const Smarthome_provider = require("./smarthome-provider");

let jwt;
try {
    jwt = require('./smart-home-key.json');
}
catch (e) {
    console.warn('Service account key is not found');
    console.warn('Report state and Request sync will be unavailable');
}

const smart_home_app = actions_on_google.smarthome({
    jwt,
    debug: true,
});

var mqttClient = new mqttHandler();
Auth_Smarthome.registerAuthEndpoints(app);

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
async function getUserIdOrThrow(headers) {
    const userId = await Auth_Smarthome.getUser(headers);
    const userInfo = await Smarthome_provider.userExists(userId);
    if (!userInfo) {
        throw new Error(`User ${userId} has not created an account, so there are no devices`);
    }
    return userId;
}

async function setup() {
    // load route
    require(`./route/_init_`);

    // load elastic
    // await Elastic.indicesSetup('session', {
    //     mappings: {
    //         'session': {
    //             'properties': {
    //                 user: {type: 'long'},
    //                 expired: {type: 'long'},
    //                 token: {type: 'text', analyzer: 'keyword'},
    //             }
    //         }
    //     }
    // });

    // swagger
    if (Config.isDevelopment) {
        app.use('/swagger', express.static(path.join(__dirname, 'swagger')));

        Route.get({
            url: '/_swagger',
            swagger: false,
            rawResponse: true,
            response: Types.raw(),
            handle: (control, route) => {
                return Swagger.document()
            }
        });
    }

    // default route
    if (Config.isDevelopment) {
        // app.use((req, res) => {
        //     res.redirect('/swagger');
        // });
    } else {
        app.use('/', express.static(path.join(__dirname, 'site')));
        app.use((req, res) => {
            res.sendFile(path.join(__dirname, 'site', 'index.html'));
        });
    }

    //smarthome
    smart_home_app.onSync(async (body, headers) => {
        console.log("1");
        const userId = await getUserIdOrThrow(headers);
        console.log("2");
        console.log("onSync : " + userId);
        console.log("onSync : " + headers);
        //set trạng thái onl cho user
        const devices = await Smarthome_provider.getDevices(userId);
        return {
            requestId: body.requestId,
            payload: {
                userId: userId,
                devices,
            },
        };
    });
    smart_home_app.onQuery(async (body, headers) => {
        const userId = await getUserIdOrThrow(headers);
        console.log("onQuery -- " + "getState");
        const devices = await Smarthome_provider.getDevices(userId);
        return {
            requestId: body.requestId,
            payload: {
                userId: userId,
                devices,
            },
        };
    });
    smart_home_app.onExecute(async (body, headers) => {
        const userId = await getUserIdOrThrow(headers);
        const commands = [{
                ids: [],
                status: 'SUCCESS',
                states: {},
            }];
        console.log("onExecute -- " + "execute");
        const { devices, execution } = body.inputs[0].payload.commands[0];
        await asyncForEach(devices,async (device) => {
            try {
                const states = await Smarthome_provider.execute(userId, device.id, execution[0]);
                commands[0].ids.push(device.id);
                commands[0].states = states;
                // Report state back to Homegraph
                await smart_home_app.reportState({
                    agentUserId: userId,
                    requestId: Math.random().toString(),
                    payload: {
                        devices: {
                            states: {
                                [device.id]: states,
                            },
                        },
                    },
                });
            }
            catch (e) {
                commands.push({
                    ids: [device.id],
                    status: 'ERROR',
                    errorCode: e.message,
                });
            }
        });
        return {
            requestId: body.requestId,
            payload: {
                commands,
            },
        };
    });
    smart_home_app.onDisconnect((body, headers) => {
        console.log(onDisconnect);
    });

    app.post('/smarthome', smart_home_app);
    app.post('/smarthome/update',async (req, res) => {
        console.log(req.body);
        const { userId, deviceId, name, nickname, states } = req.body;
        try {
            await Smarthome_provider.updateDevice(userId, deviceId, name, nickname, states);
            const reportStateResponse = await smart_home_app.reportState({
                agentUserId: userId,
                requestId: Math.random().toString(),
                payload: {
                    devices: {
                        states: {
                            [deviceId]: states,
                        },
                    },
                },
            });
            console.log(reportStateResponse);
            res.status(200).send('OK');
        }
        catch (e) {
            console.error(e);
            res.status(400).send(`Error reporting state: ${e}`);
        }
    });
    app.post('/smarthome/create',async (req, res) => {
        console.log(req.body);
        const { userId, data } = req.body;
        try {
            await Smarthome_provider.addDevice(userId, data);
            await smart_home_app.requestSync(userId);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            res.status(200).send('OK');
        }
    });
    app.post('/smarthome/delete',async (req, res) => {
        console.log(req.body);
        const { userId, deviceId } = req.body;
        try {
            await Smarthome_provider.deleteDevice(userId, deviceId);
            await smart_home_app.requestSync(userId);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            res.status(200).send('OK');
        }
    });
    app.use('/web', express.static('./web'));
    app.use('/web/', express.static('./web'));
    app.use('/', express.static('./web'));

    return server;
}

if (cluster.isMaster) {
    // let cpuCount = require('os').cpus().length;
    let cpuCount = 2;

    console.log(`Master ${process.pid} is running`);

    // mqttClient.connect('logger');
    // mqttClient.connect('log_fuel');

    for (let i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log('worker ' + worker.process.pid + ' died');
    });
} else {
    app.use(cors());
    app.use(bodyParser.json({limit: '100mb'}));
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(compression());

    console.log(`Worker ${process.pid} started`);

    // start server
    setup()
        .then((server) => server.listen(Config.server.port))
        .catch(e => console.log(e));
}

