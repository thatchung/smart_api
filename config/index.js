let config = {
    isDevelopment: process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'development',
    apiPath: '/api',
    maxRouteCallStack: 10,
    jwt_secret_key: 'e03660f83c720ecf89565957711962c0',
    server: {
        port: 8085,
    },
    elastic: {
        host: undefined,
        port: undefined,
        prefix: undefined,
        enable: true
    },
    database: {
        dbname: undefined,
        username: undefined,
        password: undefined,
        info: {
            dialect: undefined,
            host: undefined,
        }
    },
};

if (config.isDevelopment)
    Object.assign(config, require('./config.dev'));
else
    Object.assign(config, require('./config.prod'));

module.exports = config;