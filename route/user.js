const Config = require('../config');
const Route = require('../core/route');
const Types = require('../core/types');
const Util = require('../core/util');
const Db = require('../model');
const moment = require('moment');
const mqttHandler = require('../core/mqtt');


Route.get({
    url: '/get_list_devices',
    summary: 'Lấy danh sách thiết bị',
    paging: true,
    parameter: {
        token: {
        	required: true,
        	type: Types.string()
        },
    },
    response: 
    Types.list(Types.object({
    	id: Types.integer(),
        mac_address: Types.string(),
        name: Types.string(),
        type: Types.string(),
        hw_version: Types.string(),
        sw_version: Types.string(),
        model: Types.string(),
        menufactuter: Types.string(),
        // traits: Types.string(),
        // attributes: Types.string(),
        state: Types.string(),
        home_id: Types.integer()
    })),
    handle: async (control, route) => {
        let data = await Db.credential.getByToken(route.args.token);
        if(!data){
            throw {code: 'not_found',message:"Không tìm thấy thông tin người dùng"};
        }

        let user_home = await Db.user_home.getByUserId(data.user_id);
        if(!user_home){
            throw {code: 'not_found',message:"Không tìm thấy thông tin nhà của người dùng"};
        }

        let listData = await Db.device.listByHomeId(route.args.page,route.args.page_size,user_home.home_id);
        
        control.setPaging(listData.count);
        if(listData.count == 0)
        	return [];
        return listData.rows.map(x => ({
            id: x.id,
            mac_address: x.mac_address,
            name: x.name,
            type: x.type,
            hw_version: x.hw_version,
            sw_version: x.sw_version,
            model: x.model,
            menufactuter: x.menufactuter,
            state: JSON.stringify(x.state),
            home_id: x.home_id
        }));
    }
});


Route.get({
    url: '/get_device_state',
    summary: 'Lấy trạng thái thiết bị',
    parameter: {
        token: {
        	required: true,
        	type: Types.string()
        },
        mac_address : {
        	required: true,
        	type: Types.string()
        },
    },
    response: Types.raw(),
    handle: async (control, route) => {
        let data = await Db.credential.getByToken(route.args.token);
        if(!data){
            throw {code: 'not_found',message:"Không tìm thấy thông tin người dùng"};
        }

        let user_home = await Db.user_home.getByUserId(data.user_id);
        if(!user_home){
            throw {code: 'not_found',message:"Không tìm thấy thông tin nhà của người dùng"};
        }

        let item = await Db.device.getByAddress(route.args.mac_address);
        if(!item){
            throw {code: 'not_found',message:"Không tìm thấy thông tin thiết bị"};
        }
        
        return item.state;
    }
});

Route.post({
    url: '/add_device',
    parameter: {
    	token: {
        	required: true,
        	type: Types.string()
        },
        mac_address:{
            required: true,
            type: Types.string()
        },
        name: {
        	required: true,
            type: Types.string()
        },
        type: {
        	required: true,
            type: Types.string()
        },
        hw_version: {
            type: Types.string()
        },
        sw_version: {
            type: Types.string()
        },
        model: {
            type: Types.string()
        },
        menufactuter: {
            type: Types.string()
        },
        // traits: {
        //     type: Types.string({description:"Cấu trúc JSON"})
        // },
        // attri: {
        //     type: Types.string({description:"Cấu trúc JSON"})
        // },
        // state: {
        //     type: Types.string({description:"Cấu trúc JSON"})
        // },
    },
    response: Types.raw(),
    handle: async (control, route) => {
        
        let data = await Db.credential.getByToken(route.args.token);
        if(!data){
            throw {code: 'not_found',message:"Không tìm thấy thông tin người dùng"};
        }

        let user_home = await Db.user_home.getByUserId(data.user_id);
        if(!user_home){
            throw {code: 'not_found',message:"Không tìm thấy thông tin nhà của người dùng"};
        }
        
        let traitsJson = {
            '0' : '',
            '1' : '',
            '2' : ''
        };
        let attriJson = {
            '0' : {
                    'color' : 'none'
                },
            '1' : {
                    'color' : 'none'
                },
            '2' : {
                    'color' : 'none'
                }
        };
        let stateJson = {
            '0' : {
                'brightness' : 0,
                'on' : false,
                'online' : true
            },
            '1' : {
                'brightness' : 0,
                'on' : false,
                'online' : true
            },
            '2' : {
                'brightness' : 0,
                'on' : false,
                'online' : true
            }
        };

        let item = await Db.device.create({
            mac_address: route.args.mac_address,
            name: route.args.name,
            type: route.args.type,
            hw_version: route.args.hw_version,
            sw_version: route.args.sw_version,
            model: route.args.model,
            menufactuter: route.args.menufactuter,
            traits: JSON.stringify(traitsJson),
            attri: JSON.stringify(attriJson),
            state: JSON.stringify(stateJson),
            home_id: user_home.home_id
        });
        if (item === null)
            throw {code: 'add_fail',message:"Tạo thông tin thiết bị không thành công"};
        else{
            return item;
        }
    },
});

Route.post({
    url: '/update_device',
    parameter: {
    	token: {
        	required: true,
        	type: Types.string()
        },
        mac_address:{
            required: true,
            type: Types.string()
        },
        name: {
        	required: true,
            type: Types.string()
        },
        // traits: {
        // 	required: true,
        //     type: Types.string({description:"Cấu trúc JSON"})
        // },
        // attri: {
        // 	required: true,
        //     type: Types.string({description:"Cấu trúc JSON"})
        // },
        // state: {
        // 	required: true,
        //     type: Types.string({description:"Cấu trúc JSON"})
        // },
    },
    response: Types.raw(),
    handle: async (control, route) => {
        
        // let data = await Db.credential.getByToken(route.args.token);
        // if(!data){
        //     throw {code: 'not_found',message:"Không tìm thấy thông tin người dùng"};
        // }

        // let user_home = await Db.user_home.getByUserId(data.user_id);
        // if(!user_home){
        //     throw {code: 'not_found',message:"Không tìm thấy thông tin nhà của người dùng"};
        // }
        
        let item = await Db.device.update_device(route.args.mac_address,{
            name: route.args.name,
            // traits: route.args.traits,
            // attri: route.args.attri,
            // state: route.args.state,
        });
        if (item === null)
            throw {code: 'add_fail',message:"Cập nhật thông tin thiết bị không thành công"};
        else{
            return item;
        }
    },
});

Route.post({
    url: '/control_device',
    parameter: {
    	token: {
        	required: true,
        	type: Types.string()
        },
        mac_address:{
            required: true,
            type: Types.string()
        },
        // traits: {
        // 	// required: true,
        //     type: Types.string({description:"Cấu trúc JSON"})
        // },
        // attri: {
        // 	required: true,
        //     type: Types.string({description:"Cấu trúc [20,-1,100,-1]"})
        // },
        state: {
        	required: true,
            type: Types.string({description:"Cấu trúc [20,-1,100,-1]"})
        },
    },
    response: Types.raw(),
    handle: async (control, route) => {
        
        // let data = await Db.credential.getByToken(route.args.token);
        // if(!data){
        //     throw {code: 'not_found',message:"Không tìm thấy thông tin người dùng"};
        // }

        // let user_home = await Db.user_home.getByUserId(data.user_id);
        // if(!user_home){
        //     throw {code: 'not_found',message:"Không tìm thấy thông tin nhà của người dùng"};
        // }
        
        let jsonAttri = JSON.parse(route.args.state);

        let dataMqtt =  {
              request: 300,
              device:    {
                  id: route.args.mac_address,
                  status: 0,
                  type: 2,
                  data: jsonAttri
                }
            };

        let deviceUpdate = await Db.device.getByAddress(route.args.mac_address);
        if(deviceUpdate == null){
            throw {code: 'control_fail',message:"Cập nhật thông tin thiết bị không thành công"};
        }

        let stateJson = deviceUpdate.state;
        // let brightness = jsonAttri[0];
        let light1 = jsonAttri[1];
        let light2 = jsonAttri[2];
        let light3 = jsonAttri[3];

        if(light1 >= 0){
            stateJson['0'] = {
                'brightness' : light1,
                'on' : light1 != 0,
                'online' : true
            };
        }
        if(light2 >= 0){
            stateJson['1'] = {
                'brightness' : light2,
                'on' : light2 != 0,
                'online' : true
            };
        }
        if(light3 >= 0){
            stateJson['2'] = {
                'brightness' : light3,
                'on' : light3 != 0,
                'online' : true
            };
        }
        
        let item = await Db.device.controlState(route.args.mac_address,{
            // traits: JSON.stringify({data:0}),
            // attri: route.args.attri,
            state: JSON.stringify(stateJson),
        });
        if (item === null)
            throw {code: 'control_fail',message:"Cập nhật thông tin thiết bị không thành công"};
        else{
            //send mqtt to device
            var mqttClient = await new mqttHandler();
            await mqttClient.connect(`log_home/${route.args.mac_address}/status`);
            if(mqttClient){
                mqttClient.sendMessage(`log_home/${route.args.mac_address}/status`,JSON.stringify(dataMqtt));
            }
           
            mqttClient.closeConnect();
            return item;
        }
    },
});


// Route.post({
//     url: '/admin/user/update',
//     requireAuth: true,
//     parameter: {
//         id:{
//             required: true,
//             type: Types.integer()
//         },
//         name:{
//             required: true,
//             type: Types.string({description: 'tên hẹ', allowNull: false})
//         },
//         email: {
//         	required: true,
//             type: Types.string()
//         },
//         account: {
//             type: Types.string()
//         },
//         phone: {
//             type: Types.string()
//         },
//         password: {
//             type: Types.string()
//         },
//         type: {
//             required: true,
//             type: Types.integer()
//         },
//         area_id: {
//             required: true,
//             type: Types.integer()
//         },
//         status: {
//             required: true,
//             type: Types.string()
//         },
//         avatar: {
//             type: Types.string()
//         },
//     },
//     response: Types.raw(),
//     handle: async (control, route) => {
//         let checkUpdate = await Db.user.checkUpdateLogin(route.args.id,route.args.email,route.args.account,route.args.phone);
//         if(checkUpdate){
//             throw  {"code": "account_exits", "message": "Thông tin cập nhật đã tồn tại trong hệ thống"};
//         }

//         let item = await Db.user.update(route.args.id,{
//             name: route.args.name,
//             email: route.args.email,
// 	        account: route.args.account,
// 	        phone: route.args.phone,
// 	        status: route.args.status,
// 	        type: route.args.type,
// 	        password: route.args.password,
//             area_id: route.args.area_id,
//             avatar: route.args.avatar,
//         });

//         if (item === null)
//             throw {code: 'update_invalid'};
//         else{
//             return {
// 	            id: item.id,
// 	            name: item.name
// 	        };
//         }
//     },
//     logHandle: async (control, route, result, isError) => {
//         let parameter = route.args;

//         await control.writeLogAction({
//             user_id: result.data ? result.data.id : null,
//             parameter:parameter,
//             response: result,
//             isError: isError,
//         })
//     }
// });

// Route.get({
//     url: '/admin/user/permission/list',
//     summary: 'Lấy danh sách quyền của user',
//     paging: true,
//     parameter: {
//         user_id:{
//             required: true,
//             type: Types.integer()
//         }
//     },
//     response: Types.list(Types.object({
//         id: Types.integer({description: 'ID'}),
//         name: Types.string(),
//         des: Types.string(),
//         active: Types.integer()
//     })),
//     handle: async (control, route) => {

//         let listPermission = await Db.user_permission.listByAccountId(route.args.user_id);

//         let data = await Db.permission.list(route.args.page, route.args.page_size);
//         control.setPaging(data.count);
//         return data.rows.map(x => ({
//             id: x.id,
//             name: x.name,
//             des: x.des,
//             active: listPermission.indexOf(x.name) > -1 ? 1 :0
//         }));
//     }
// });

// Route.post({
//     url: '/admin/user_permission/add',
//     parameter: {
//         user_id:{
//             required: true,
//             type: Types.integer()
//         },
//         permission_id:{
//             required: true,
//             type: Types.integer({ allowNull: false})
//         },
//         name:{
//             required: true,
//             type: Types.string({ allowNull: false})
//         },
//     },
//     response: Types.raw(),
//     handle: async (control, route) => {


//         let item = await Db.user_permission.create({
//             user_id: route.args.user_id,
//             permission_id: route.args.permission_id,
//             name: route.args.name,
//         });

//         if (item === null)
//             throw {code: 'update_invalid'};
//         else{
//             return {
//                 id: item.id,
//                 name: item.name
//             };
//         }
//     },
//     logHandle: async (control, route, result, isError) => {
//         let parameter = route.args;

//         await control.writeLogAction({
//             user_id: result.data ? result.data.id : null,
//             parameter:parameter,
//             response: result,
//             isError: isError,
//         })
//     }
// });

// Route.post({
//     url: '/admin/user_permission/delete',
//     parameter: {
//         user_id:{
//             required: true,
//             type: Types.integer()
//         },
//         permission_id:{
//             required: true,
//             type: Types.integer({ allowNull: false})
//         },
//         name:{
//             required: true,
//             type: Types.string({ allowNull: false})
//         },
//     },
//     response: Types.raw(),
//     handle: async (control, route) => {


//         let item = await Db.user_permission.delete({
//             user_id: route.args.user_id,
//             permission_id: route.args.permission_id,
//             name: route.args.name,
//         });

//         if (item === null)
//             throw {code: 'update_invalid'};
//         else{
//             return {
//                 item
//             };
//         }
//     },
//     logHandle: async (control, route, result, isError) => {
//         let parameter = route.args;

//         await control.writeLogAction({
//             user_id: result.data ? result.data.id : null,
//             parameter:parameter,
//             response: result,
//             isError: isError,
//         })
//     }
// });

// Route.post({
//     url: '/photo/add',
//     summary: 'Thêm hình ảnh',
//     requireAuth: true,
//     parameter: {
//         name: {required: true, type: Types.string()},
//         image: {required: true, type: Types.string({description: 'base64 của ảnh'})},
//     },
//     response: Types.object({
//         id: Types.integer({description: 'ID ảnh'}),
//         link: Types.string({description: 'link ảnh'}),
//     }),
//     error: {
//         create_false: 'Tạo dữ liệu không thành công',
//         not_found: 'Tạo thành công nhưng không tìm thấy dữ liệu',
//     },
//     handle: async (control, route) => {
//         let extention = (/[.]/.exec(route.args.name)) ? /[^.]+$/.exec(route.args.name) : undefined;
//         if(!extention){
//             extention = ".jpg";
//         }
//         let name = Util.sha3_512Hash(route.args.name + moment().unix());
//         Fs.writeFile('dist/image/'+name + '.' + extention, route.args.image, 'base64', function(err) {
//             console.log(err);
//         });


//         return {
//             // id: result ? result.id : null,
//             link: Config.photolink + name + '.' + extention,
//         };
//     }
// });

