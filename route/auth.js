const Config = require('../config');
const Route = require('../core/route');
const Types = require('../core/types');
const Db = require('../model');
const moment = require('moment');
const Util = require('../core/util');

Route.get({
    url: '/profile',
    summary: 'Lấy thông tin user',
    parameter: {
        token: {
            required: true,
            type : Types.string()
        },
    },
    response: Types.raw(),
    handle: async (control, route) => {
        
        
        let data = await Db.credential.getByToken(route.args.token);
        if(!data){
            throw {code: 'not_found',message:"Không tìm thấy thông tin người dùng"};
        }
        let user = await Db.user.getById(data.user_id);
        if(!user){
            throw {code: 'not_found',message:"Không tìm thấy thông tin người dùng"};
        }
        
        return {
            user : {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photo_url: user.photo_url
            }
        };
    }
});

Route.post({
    url: '/register',
    summary: 'đăng ký hệ thống',
    parameter: {
        type: {
            required: true,
            type: Types.string({ description: 'loại đăng ký' ,enum: ['google', 'normal'] })
        },
        name: {
            required: true,
            type: Types.string()
        },
        email: {
            type: Types.string()
        },
        phone: {
            type: Types.string()
        },
        token:{
            type: Types.string()
        },
        password:{
            type: Types.string()
        },
        photo_url:{
            type: Types.string()
        }
    },
    response: Types.raw(),
    handle: async (control, route) => {
        //region [find account]
        if(route.args.type === 'normal'){
            if(!(route.args.email || route.args.phone) || !route.args.password){
                throw {code: 'login_fail',message:"Chưa điền đầy đủ thông tin đăng ký."};
            }
            let user = await Db.user.getCheckUser(route.args.email, route.args.phone);
            if (user){
                throw {code: 'login_fail',message:"Thông tin user đã tồn tại trong hệ thống."};
            }
            //thêm user
            let userAdd = await Db.user.create({
                name : route.args.name,
                email : route.args.email,
                phone : route.args.phone,
                password : route.args.password,
                photo_url : route.args.photo_url,
            });
            if(userAdd){
                let homeAdd = await Db.home.create({
                    name: `Nhà của ${route.args.name}`,
                    owner_id: userAdd.id
                });
                if(homeAdd){
                    await Db.user_home.create({
                        user_id: userAdd.id,
                        home_id: homeAdd.id
                    });
                    let token = Util.sha3_512Hash(route.args.password + userAdd.id);
                    await Db.credential.create({
                        user_id : userAdd.id,
                        source: 'normal',
                        token: token,
                    })
                    return {
                        user_id : userAdd.id,
                        token : token
                    }
                }
                throw {code: 'login_fail',message:"Tạo thông tin nhà không thành công"};
            }
            throw {code: 'login_fail',message:"Tạo thông tin user không thành công"};
        }
        else if(route.args.type === 'google'){
            if(!route.args.email || !route.args.token){
                throw {code: 'login_fail',message:"Chưa điền đầy đủ thông tin đăng ký."};
            }
            let user = await Db.user.getCheckUser(route.args.email, route.args.phone);
            if (user){
                throw {code: 'login_fail',message:"Thông tin user đã tồn tại trong hệ thống."};
            }
            //thêm user 
            let userAdd = await Db.user.create({
                name : route.args.name,
                email : route.args.email,
                phone : route.args.phone,
                password : route.args.password,
                photo_url : route.args.photo_url,
            });
            if(userAdd){
                let homeAdd = await Db.home.create({
                    name: `Nhà của ${route.args.name}`,
                    owner_id: userAdd.id
                });
                if(homeAdd){
                    await Db.user_home.create({
                        user_id: userAdd.id,
                        home_id: homeAdd.id
                    });
                    let token = route.args.token;
                    await Db.credential.create({
                        user_id : userAdd.id,
                        source: 'google',
                        token: token,
                    })
                    return {
                        user_id : userAdd.id,
                        token : token
                    }
                }
                throw {code: 'login_fail',message:"Tạo thông tin nhà không thành công"};
            }
            throw {code: 'login_fail',message:"Tạo thông tin user không thành công"};
        }
        else{
            throw {code: 'login_fail',message:"Đăng ký không thành công."};
        }
    },
});

Route.post({
    url: '/updateprofile',
    summary: 'cập nhật thông tin',
    parameter: {
        id: {
            required: true,
            type: Types.integer()
        },
        name: {
            required: true,
            type: Types.string()
        },
        email: {
            type: Types.string()
        },
        phone: {
            type: Types.string()
        },
        password:{
            type: Types.string()
        },
        photo_url:{
            type: Types.string()
        }
    },
    response: Types.raw(),
    handle: async (control, route) => {
        //region [find account]
        let updateData = {
            id : route.args.id,
            name : route.args.name
        }
        if(route.args.email && Db.user.getCheckEmailUsed(route.args.email)){
            updateData.email = route.args.email;
        }
        if(route.args.phone && Db.user.getCheckPhoneUsed(route.args.phone)){
            updateData.phone = route.args.phone;
        }
        if(route.args.password){
            updateData.password = route.args.password;
        }
        if(route.args.photo_url){
            updateData.photo_url = route.args.photo_url;
        }
        let user = await Db.user.update(route.args.id,updateData);
        if(!user){
            throw {code: 'update_fail',message:"Cập nhật thông tin không thành công."};
        }
        return {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photo_url: user.photo_url
            }
    },
});

// Route.delete({
//     url: '/auth/logout',
//     summary: 'đăng xuất hệ thống Lixi',
//     requireAuth: true,
//     handle: async (control, route) => {
//         return Db.session.deleteByAccountId(route.session.accountId);
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