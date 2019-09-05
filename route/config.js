// const Route = require('../core/route');
// const Types = require('../core/types');
// const Elastic = require('../core/elastic');
// const Db = require('../model');
// const Util = require('../core/util');
// const My_queue = require('../core/queue');
// const mqttHandler = require('../core/mqtt');
// const moment = require('moment');

// Route.get({
//     url: '/admin/send',
//     summary: 'gởi mqtt',
//     parameter: {
//         topic: {required:true,type: Types.string()},
//         sms: {required:true,type: Types.string()},
//     },
//     response: Types.raw(),
//     handle: async (control, route) => {
//         let mqtt = new mqttHandler();
//         await mqtt.connect(route.args.topic);
//         await mqtt.sendMessage(route.args.topic,route.args.sms);
//         await mqtt.closeConnect();

//         return {
//             sms : route.args.sms
//         };
//     }
// });

// Route.get({
//     url: '/admin/config/list',
//     summary: 'Lấy danh sách config',
//     paging: true,
//     parameter: {
//         search: {type: Types.string()},
//     },
//     response: Types.list(Types.object({
//         id: Types.integer({description: 'ID user'}),
//         name : Types.string(),
//         value : Types.number(),
//     })),
//     handle: async (control, route) => {
//         let filter = {};
//         if(route.args.search){
//             filter.search = route.args.search;
//         }
//         let data = await Db.config.list(route.args.page, route.args.page_size, filter);

//         control.setPaging(data.count);
//         return data.rows.map(x => ({
//             id: x.id,
//             name : x.name,
//             value : x.value,
//         }));
//     }
// });

// Route.post({
//     url: '/admin/config/update',
//     parameter: {
//         id:{
//             required: true,
//             type: Types.integer()
//         },
//         name : {
//             required: true,
//             type: Types.string()
//         },
//         value : {
//             required: true,
//             type: Types.string()
//         },
//     },
//     response: Types.raw(),
//     handle: async (control, route) => {
//         if(route.args.id){
//             let temp =  await Db.config.getById(route.args.id);
//             if(temp){
//                 let item =  await Db.config.update(route.args.id,route.args.value,route.args.name);
//                 temp.value = route.args.value;
//                 temp.name = route.args.name;
//                 let result = await Elastic.init({index: 'config'}).set(item.id,temp);
//                 return result;
//             }
//             else{
//                 let item = await Db.config.create({
//                     name : route.args.name,
//                     value : route.args.value
//                 });
//                 if (item){
//                     let result = await Elastic.init({index: 'config'}).set(item.id,item);
//                     return result;
//                 }
                
//             }
//         }
//         else{
//             let item =  await Db.config.create(
//                 {   
//                     name : route.args.name,
//                     value : route.args.value
//                 });
//             let result = await Elastic.init({index: 'config'}).set(item.id,item);
//             return result;
//         }
//     },
// });

// // Route.get({
// //     url: '/add',
// //     realresult:true,
// //     parameter: {
// //         id:{
// //             required: true,
// //             type: Types.string({description: 'id', allowNull: false})
// //         },
// //         arr:Types.string(),
// //     },
// //     response: Types.raw(),
// //     handle: async (control, route) => {
// //         let now = moment.utc();

// //         let obj = Util.getLogObject(route.args.arr);
// //         obj.uuid = route.args.id + now.unix();
// //         obj.id = route.args.id;
// //         obj.create_time = now;
// //         let fuel = await Elastic.init({
// //                 index: 'fuel',
// //                 filter_must: [
// //                     { term: {'name.keyword': obj.id }}
// //                 ],
// //             }).searchFirst();
        
// //         if(!fuel)
// //             throw {code: 'not found', message: "can't find fuel"};
// //         obj.info = fuel;
// //         My_queue.push(obj);
// //         if(My_queue.getSize() >= 1){
// //             let data_es = await My_queue.get(1);
// //             let result = await Elastic.esBulk(data_es);
// //             // let mapping = {};
// //             // mapping['log'] = {"properties": {
// //             //     "id": {"type": "keyword"},
// //             //     "al": {"type": "keyword"},
// //             //     "pwr": {"type": "keyword"},
// //             //     "isch": {"type": "keyword"},
// //             // }}
// //             // let map = await DB.esMapping('log',{"mappings": mapping});
// //             let delta = await Elastic.init({
// //                 index: 'config',
// //                 filter_must: [{term: {'name.keyword': 'delta'}},]
// //             }).searchFirst();
            
// //             let dclowvolt = await Elastic.init({
// //                 index: 'config',
// //                 filter_must: [{term: {'name.keyword': 'dclowvolt'}},]
// //             }).searchFirst();
// //             return {
// //                 delta: delta ? delta.value : 0,
// //                 dclowvolt: dclowvolt ? dclowvolt.value : 0,
// //             };
// //         }
// //         return {
// //             delta:0,
// //             dclowvolt:0,
// //         };
// //     }
// // });

// Route.get({
//     url: '/list',
//     response: Types.raw(),
//     handle: async (control, route) => {
//         let es_list = await Elastic.init({
//             index: 'log',
//             sort: [
//                 { create_time: { order: 'desc' } },
//             ],
//         });
//         let kq = es_list.search();
//         return kq;
//     }
// });