const app = require('../app').app;
const Error = require('../core/error');
const Types = require('../core/types');
const Swagger = require('../core/swagger');
const Config = require('../config');
const Db = require('../model');
const path = require('path');
const moment = require('moment');
const jwt = require('jsonwebtoken');

const methods = ['get', 'post', 'put', 'delete'];
const routes = [];

//region [helper]

function registerRoute(method, options = {}) {
    //region [init & validator]

    if (options === undefined || options === null)
        throw `options is missing`;
    if (typeof options !== 'object')
        throw `options is invalid`;

    // url
    if (options.url === undefined || options.url === null)
        throw `url is missing`;
    options.url = options.url.trim();
    if (options.url.length === 0)
        throw `url is missing`;
    if (options.url[0] !== '/')
        throw `url must begin with '/'`;
    if (/[A-Z]/.test(options.url))
        throw `url must have all lower case`;

    // method
    if (method === undefined || method === null)
        throw `${options.url}: method is missing`;
    method = method.trim().toLowerCase();
    options.method = method;
    let routeName = `${options.method} ${options.url}`;
    if (!methods.includes(method))
        throw `${routeName}: ${method} method is not support`;

    // disable
    if (!options.hasOwnProperty('disable'))
        options.disable = false;
    if (typeof options.disable !== 'boolean')
        throw `${routeName}: disable is invalid`;

    // raw response
    if (!options.hasOwnProperty('rawResponse'))
        options.rawResponse = false;
    if (typeof options.rawResponse !== 'boolean')
        throw `${routeName}: rawResponse is invalid`;

    // swagger
    if (!options.hasOwnProperty('swagger'))
        options.swagger = true;
    if (typeof options.swagger !== 'boolean')
        throw `${routeName}: swagger is invalid`;

    // tags
    if (!options.hasOwnProperty('tags'))
        options.tags = [];
    if (!(options.tags instanceof Array))
        throw `${routeName}: tags is invalid`;
    for (let item of options.tags)
        if (typeof item !== 'string')
            throw `${routeName}: tags item is invalid`;

    // summary
    if (!options.hasOwnProperty('summary'))
        options.summary = '';
    if (typeof options.summary !== 'string')
        throw `${routeName}: summary is invalid`;

    // description
    if (!options.hasOwnProperty('description'))
        options.description = '';
    if (typeof options.description !== 'string')
        throw `${routeName}: description is invalid`;

    // logAction
    if (!options.hasOwnProperty('logAction'))
        options.logAction = options.method !== 'get';
    if (typeof options.logAction !== 'boolean')
        throw `${routeName}: logAction is invalid`;

    // parameter
    let parameter = {};
    if (!options.hasOwnProperty('parameter'))
        options.parameter = {};
    if (typeof options.parameter !== 'object')
        throw `${routeName}: parameter is invalid`;

    // response
    if (options.response === undefined || options.response === null)
        options.response = null;
    if (options.response !== null) {
        if (!(options.response instanceof Types.rawType))
            throw `${routeName}: response is invalid`;
        if (!options.response._canBeResponse(options))
            throw `${routeName}: ${options.response.constructor.name} cannot be response`;
    }

    // requireAuth
    if (!options.hasOwnProperty('requireAuth'))
        options.requireAuth = false;
    if (typeof options.requireAuth !== 'boolean')
        throw `${routeName}: requireAuth is invalid`;
    if (options.requireAuth) {
        parameter.authorization = {
            location: 'header',
            type: Types.string({description: 'session token'})
        };
    }

    // requireRoot
    if (!options.hasOwnProperty('requireRoot'))
        options.requireRoot = false;
    if (typeof options.requireRoot !== 'boolean')
        throw `${routeName}: requireRoot is invalid`;

    // permission
    if (!options.hasOwnProperty('permission'))
        options.permission = [];
    if (!Array.isArray(options.permission))
        throw `${routeName}: permission is invalid`;

    // paging
    if (!options.hasOwnProperty('paging'))
        options.paging = false;
    if (typeof options.paging !== 'boolean')
        throw `${routeName}: paging is invalid`;
    if (options.paging) {
        if (!(options.response instanceof Types.listType))
            throw `${routeName}: ${options.response.constructor.name} is not support for paging response`;

        parameter.page = {
            type: Types.integer({default: 1, description: 'vị trí trang dữ liệu'}),
            check: (value) => {
                if (value <= 0)
                    throw 'vị trí trang dữ liệu phải >= 1';
            }
        };
        parameter.page_size = {
            type: Types.integer({default: 10, description: 'kích thước (số phần tử) của trang'}),
            check: (value) => {
                if (value <= 0)
                    throw 'kích thước trang dữ liệu phải >= 1';
            }
        };
    }

    // list parameter
    options.parameter = Object.assign(parameter, options.parameter);
    for (let paramKey in options.parameter) {
        let paramData = options.parameter[paramKey];

        // check unique
        let checkCount = 0;
        for (let key in options.parameter) {
            if (paramKey.toLowerCase() === key.toLowerCase())
                checkCount += 1;
        }
        if (checkCount > 1)
            throw `${options.url} - ${paramKey}: is duplicated`;

        // check name
        if (/[A-Z]/.test(paramKey))
            throw `parameter key must have all lower case`;

        // simple way
        if (paramData instanceof Types.rawType) {
            options.parameter[paramKey] = {type: paramData};
            paramData = options.parameter[paramKey];
        }

        // type
        if (!paramData.hasOwnProperty('type'))
            throw `${routeName} - ${paramKey}: is missing type`;
        if (!(paramData.type instanceof Types.rawType))
            throw `${routeName} - ${paramKey}: type is not support`;
        if (!paramData.type._canBeParameter(options))
            throw `${routeName} - ${paramKey}: ${paramData.type.constructor.name} cannot be parameter`;

        // location
        if (!paramData.hasOwnProperty('location')) {
            if (['get', 'delete'].includes(options.method))
                paramData.location = 'query';
            else
                paramData.location = 'body';
        }
        if (!['path', 'query', 'header', 'body'].includes(paramData.location))
            throw `${routeName} - ${paramKey}: location is not support`;

        // required
        if (!paramData.hasOwnProperty('required'))
            paramData.required = false;
        if (typeof paramData.required !== 'boolean')
            throw `${routeName} - ${paramKey}: required is invalid`;

        // check
        if (!paramData.hasOwnProperty('check') || paramData.check === null)
            paramData.check = undefined;
        else if (paramData.check !== undefined && typeof paramData.check !== 'function')
            throw `${routeName} - ${paramKey}: checker is invalid`;
    }

    //error
    if (!options.hasOwnProperty('error'))
        options.error = {};
    if (typeof options.error !== 'object')
        throw `${routeName}: error is invalid`;
    for (let code in options.error)
        if (typeof options.error[code] !== 'string')
            throw `${routeName}: error code \'${code}\' is invalid`;

    // handle
    if (typeof options.handle !== 'function')
        throw `${routeName}: handle is invalid`;

    // logHandle
    if (options.logHandle && typeof options.logHandle !== 'function')
        throw `${routeName}: logHandle is invalid`;

    //endregion

    //region [store route]

    for (let route of routes) {
        if (route.method === options.method && route.url === options.url)
            throw `${routeName}: is duplicated`;
    }
    routes.push(options);

    if (options.swagger)
        Swagger.register(options);

    //endregion

    //region [process]

    if (options.disable) {
        console.log(`${routeName}: is disabled`);
    } else {
        let apiPath = Config.apiPath ? Config.apiPath : '';
        app[options.method]((apiPath + options.url).replace(/{/g, ':').replace(/}/g, ''), async (req, res) => {
            try {
                await processRoute(req, res, options, undefined, 1);
            } catch (e) {
                let args = parseParameter(req, options, undefined, true);
                makeRouteHandle(req, res, options, args, true).then(async (routeHandle) => {
                    await errorHandler(req, res, e, options, routeHandle);
                });
            }
        });
    }

    //endregion
}

async function processRoute(req, res, options, redirectParameter, callStackCount) {
    if (callStackCount > Config.maxRouteCallStack)
        throw {
            code: 'call_stack_is_exceeded',
            message: 'Maximum call stack is exceeded',
        };

    let args = parseParameter(req, options, redirectParameter, false);
    let routeHandle = await makeRouteHandle(req, res, options, args, false);

    let result = await options.handle(routeHandle.control, routeHandle.routeData);
    if (routeHandle.controlData.redirect !== null)
        return await processRoute(req, res, routeHandle.controlData.redirect.route, routeHandle.controlData.redirect.parameter, callStackCount + 1);

    let parsedResult = routeHandle.controlData.responseResult;
    if (parsedResult === undefined) {
        routeHandle.controlData.responseResult = parseResult(options, routeHandle, result);
        parsedResult = routeHandle.controlData.responseResult;

        if (options.response instanceof Types.fileType)
            res.end(parsedResult.data);
        else
            res.json(parsedResult);
    }

    return {
        args: routeHandle.routeData.args,
        result: parsedResult,
    };
}

async function errorHandler(req, res, e, options, routeHandle) {
    if (!Error.isError(e))
        e = Error.make(e);

    let message = e.message;
    if (options.error && options.error.hasOwnProperty(e.code))
        message = options.error[e.code];

    let result = {
        meta: {
            success: false
        },
        error: {
            code: e.code,
            message: message,
            data: e.data,
        }
    };
    if (Config.isDevelopment)
        result.error.exception = e.exception;

    res.status(500);
    res.json(result);
}

async function makeRouteHandle(req, res, options, args, skipError) {
    let routeHandle = {
        control: {},
        controlData: {
            responseResult: undefined,
            redirect: null,
            paging: null,
        },
        routeData: {
            args: args,
            session: undefined,
        },
    };

    if (options.requireAuth) {
        try {
            routeHandle.routeData.session = await getSession(args.authorization);
        } catch (e) {
            if (!skipError)
                throw e;
            routeHandle.routeData.session = undefined;
        }
    }

    routeHandle.control.request = req;

    routeHandle.control.redirect = (method, url, parameter = {}) => {
        method = method.trim().toLowerCase();
        if (!methods.includes(method))
            throw `control: ${method} is not support`;

        let targetRoute = null;
        for (let route of routes) {
            if (route.method === method && route.url === url) {
                targetRoute = route;
                break;
            }
        }
        if (targetRoute === null)
            throw `control: ${method} ${url} is not found`;

        routeHandle.controlData.redirect = {
            route: targetRoute,
            parameter: parameter,
        };
    };

    routeHandle.control.setPaging = (total, page = null, pageSize = null) => {
        if (!options.paging)
            throw `control: this route is not support paging`;

        if (typeof total !== 'number' || total < 0)
            throw `control: total must be number and >= 0`;

        page = page || args.page;
        if (typeof page !== 'number' || page < 1)
            throw `control: page must be number and >= 1`;

        pageSize = pageSize || args.page_size;
        if (typeof pageSize !== 'number' || pageSize < 1)
            throw `control: pageSize must be number and >= 1`;

        routeHandle.controlData.paging = {
            total: total,
            page: page,
            pageSize: pageSize,
        };
    };

    routeHandle.control.setHeader = (name, value) => {
        res.set(name, value);
    };

    routeHandle.control.setResponse = (data) => {
        routeHandle.controlData.responseResult = data;
    };

    //endregion

    return routeHandle;
}

function parseParameter(req, options, redirectParameter, skipError) {
    let errors = [];
    let result = {};

    for (let paramKey in options.parameter) {
        let paramData = options.parameter[paramKey];
        let source = redirectParameter;
        let found = false;
        let value;

        //region [get value]

        result[paramKey] = undefined;
        if (source === undefined) {
            if (paramData.location === 'path') {
                source = req['params'];
            } else if (paramData.location === 'query') {
                source = req['query'];
            } else if (paramData.location === 'header') {
                source = req['headers'];
            } else if (paramData.location === 'body') {
                source = req['body'];
            } else {
                errors.push({
                    field: paramKey,
                    code: 'location_invalid',
                    message: `location '${paramData.location}' is not support`,
                });
                continue;
            }
        }

        found = source.hasOwnProperty(paramKey);
        value = source[paramKey];

        if (!found && paramData.type.default !== undefined) {
            found = true;
            value = paramData.type.default;
        }

        //endregion

        //region [required]

        if (!found && paramData.required) {
            errors.push({
                field: paramKey,
                code: 'required',
                message: `this field is missing`,
            });
            continue;
        }

        //endregion

        //region [parse value]

        result[paramKey] = value;
        try {
            value = paramData.type.parse(value, 'parameter');
        } catch (e) {
            e = Error.make(e);
            errors.push({
                field: paramKey,
                code: e.code,
                message: e.message,
            });
            continue;
        }

        //endregion

        //region [check value]

        if (paramData.check !== undefined) {
            try {
                paramData.check(value);
            } catch (e) {
                e = Error.make(e);
                errors.push({
                    field: paramKey,
                    code: e.code,
                    message: e.message,
                });
                continue;
            }
        }

        //endregion

        result[paramKey] = value;
    }

    if (errors.length > 0 && !skipError)
        throw {
            code: 'parameter_invalid',
            message: errors[0].message,
            data: errors,
        };

    return result;
}

function parseResult(options, routeHandle, result) {
    //region [raw response]

    if (options.rawResponse)
        return options.response === null ? undefined : result;

    //endregion

    //region [parse result]

    let parsedResult;
    try {
        parsedResult = options.response === null ? undefined : options.response.parse(result, 'result');
    } catch (e) {
        throw {
            exception: e,
            code: 'parse_result',
        };
    }

    //endregion

    //region [meta]

    let meta = {success: true};

    if (options.paging) {
        if (routeHandle.controlData.paging === null)
            throw {
                code: 'parse_result',
                message: `paging metadata is missing`
            };

        meta.total = routeHandle.controlData.paging.total;
        meta.page = routeHandle.controlData.paging.page;
        meta.page_size = routeHandle.controlData.paging.pageSize;
        meta.page_count = Math.ceil(meta.total / meta.page_size);
        meta.have_prev_page = routeHandle.controlData.paging.page > 1;
        meta.have_next_page = routeHandle.controlData.paging.page * routeHandle.controlData.paging.pageSize < routeHandle.controlData.paging.total;
    }

    //endregion
    if(options.realresult){
        return parsedResult
    }
    else
        return {
            meta: meta,
            data: parsedResult,
        };
}


async function getSession(authorization) {
    let data, session, profile, permission,acc_extention;

    try {
        data = jwt.verify(authorization, Config.jwt_secret_key);
        session = await Db.session.getByKey(authorization);
        profile = await Db.user.getById(session.id_user);
        permission = await Db.user_permission.listByAccountId(session.id_user);
        
    } catch (e) {
        if (session)
            await Db.session.delete(session);
        throw {code: 'session_invalid'};
    }

    if (!data || !session || moment.utc().toDate() > session.expired) {
        if (session)
            await Db.session.delete(session);
        throw {code: 'session_invalid'};
    }
    
    return {
        accountId: profile.id,
        accountLogin: profile.email,
        accountName: profile.name,
        permission: permission,
        area_id : profile.area_id,
        type:profile.type,
        avatar: profile.avatar,
        // extention: acc_extention && acc_extention.sip_extension ? acc_extention.sip_extension : null,
        // password: acc_extention && acc_extention.sip_extensionpass ? acc_extention.sip_extensionpass : null,
        // channel: acc_extention && acc_extention.channel_id ?  acc_extention.channel_id : null,
    }
}

//endregion

module.exports = {
    get: (options) => registerRoute('get', options),
    post: (options) => registerRoute('post', options),
    put: (options) => registerRoute('put', options),
    delete: (options) => registerRoute('delete', options),
};