const Config = require('../config');
const swagger = {
    swagger: '2.0',
    info: {
        title: 'APIs',
        version: '1.0',
    },
};

module.exports = {
    document: () => swagger,
    register: (routeOptions) => {
        //region [prepare]

        let apiPath = '/api';
        let route = {};
        if (!swagger.hasOwnProperty('paths'))
            swagger.paths = {};
        if (!swagger.paths.hasOwnProperty(apiPath + routeOptions.url))
            swagger.paths[apiPath + routeOptions.url] = {};

        //endregion

        //region [path metadata]

        route.produces = ['application/json'];

        if (routeOptions.tags.length > 0)
            route.tags = routeOptions.tags;
        if (routeOptions.summary.length > 0)
            route.summary = routeOptions.summary;
        if (routeOptions.description.length > 0)
            route.description = routeOptions.description;
        if (routeOptions.disable)
            route.deprecated = true;

        //endregion

        //region [parameter]

        let parameters = [];
        for (let paramKey in routeOptions.parameter) {
            let paramData = routeOptions.parameter[paramKey];

            if (paramData.location !== 'body') {
                let param = {
                    name: paramKey,
                    in: paramData.location,
                    required: paramData.required,
                };

                param = Object.assign(param, paramData.type.swaggerType('parameter'));

                parameters.push(param);
            } else {
                let body = null;
                for (let p of parameters) {
                    if (p.name === 'body') {
                        body = p;
                        break;
                    }
                }

                if (body === null) {
                    body = {
                        name: 'body',
                        in: 'body',
                        required: true,
                        schema: {
                            'type': 'object',
                            'properties': {},
                        },
                    };
                    parameters.push(body);
                }

                body.schema.properties[paramKey] = paramData.type.swaggerType('parameter');

                if (!paramData.type.allowNull) {
                    if (body.schema.required === undefined)
                        body.schema.required = [];
                    body.schema.required.push(paramKey);
                }
            }
        }

        if (parameters.length > 0)
            route.parameters = parameters;

        //endregion

        //region [response]

        route.responses = {};

        // response 200
        if (routeOptions.response !== null) {
            if (routeOptions.rawResponse)
                route.responses[200] = {
                    schema: routeOptions.response.swaggerType('result')
                };
            else {
                let meta = {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                            description: 'kết quả xử lý không bị lỗi?'
                        },
                    }
                };
                if (routeOptions.paging) {
                    meta.properties.total = {type: 'integer', description: 'tổng số lượng item'};
                    meta.properties.page = {type: 'integer', description: 'số trang hiện tại'};
                    meta.properties.page_size = {type: 'integer', description: 'số lượng item lấy mỗi trang'};
                    meta.properties.page_count = {type: 'integer', description: 'số lượng trang'};
                    meta.properties.have_prev_page = {
                        type: 'boolean',
                        description: 'có trang dữ liệu tiếp theo không?'
                    };
                    meta.properties.have_next_page = {
                        type: 'boolean',
                        description: 'có trang dữ liệu phía trước không?'
                    };
                }

                route.responses[200] = {
                    schema: {
                        type: 'object',
                        properties: {
                            meta: meta,
                            data: routeOptions.response.swaggerType('result'),
                        },
                    }
                };

            }
        } else {
            route.responses[200] = {description: 'xử lý thành công'};
        }

        // response 500
        route.responses[500] = {
            schema: {
                type: 'object',
                properties: {
                    meta: {
                        type: 'object',
                        properties: {
                            success: {
                                type: 'boolean',
                                example: false,
                                description: 'kết quả xử lý không bị lỗi?'
                            }
                        }
                    },
                    error: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'mã lỗi (xem thêm ở danh sách bên dưới)'
                            },
                            message: {
                                type: 'string',
                                description: 'thông báo lỗi'
                            },
                            data: {
                                type: 'object',
                                description: 'dữ liệu mô tả lỗi'
                            },
                        }
                    }
                }
            }
        };

        if (Config.isDevelopment)
            route.responses[500].schema.properties.error.properties.exception = {type: 'object'};

        //endregion

        //region [error]

        route.responses['exception'] = {description: 'lỗi không xác định'};

        if (routeOptions.session)
            route.responses['session_invalid'] = {description: 'phiên đăng nhập bị lỗi / chưa đăng nhập'};
        if (Object.keys(routeOptions.parameter).length > 0)
            route.responses['parameter_invalid'] = {description: 'tham số đầu vào không phù hợp'};

        for (let code in routeOptions.error)
            route.responses[code] = {description: routeOptions.error[code]};

        //endregion

        swagger.paths[apiPath + routeOptions.url][routeOptions.method] = route;
    },
};