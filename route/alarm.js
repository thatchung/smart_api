// const Config = require('../config');
// const Route = require('../core/route');
// const Types = require('../core/types');
// const Util = require('../core/util');
// const Db = require('../model');
// const moment = require('moment');
// const Queue = require('../core/queue');
// const Elastic = require('../core/elastic');

// Route.get({
//     url: '/gen/list',
//     summary: 'Lấy trạng thái mới nhất',
//     paging: true,
//     requireAuth: true,
//     parameter: {
//         search: {type: Types.string()},
//         area: {type: Types.integer()},
//         alarm_level: {type: Types.integer()},
//         type: {type: Types.integer()},
//         check: {type: Types.integer()},
//     },
//     response: Types.list(Types.object({
//         avg : Types.number(),
//         al: Types.number(),
//         fuelname: Types.string(),
//         all: Types.number(),
//         door: Types.number(),
//         fuel: Types.number(),
//         pwr: Types.string(),
//         hz: Types.number(),
//         sen: Types.number(),
//         v1: Types.number(),
//         v2: Types.number(),
//         isch: Types.number(),
//         note: Types.string(),
//         girdgen: Types.number(),
//         gen_ctrl: Types.number(),
//         id: Types.string(),
//         uuid: Types.string(),
//         create_time: Types.datetime(),
//         eventName: Types.string(),
//         fuel_id: Types.string(),
//         info:Types.object({
//             id: Types.number(),
//             name: Types.string(),
//             lat: Types.number(),
//             lng: Types.number(),
//             address: Types.string(),
//             phone: Types.string(),
//             area_id: Types.number(),
//             type: Types.number(),
//             x: Types.number(),
//             y: Types.number(),
//             z: Types.number(),
//             std_comsumption: Types.number(),
//             status: Types.string(),
//             control: Types.number(),
//             dc_low: Types.number(),
//             tank_volume: Types.number(),
//             create_date: Types.datetime(),
//             area: Types.object({
//                 name: Types.string(),
//                 id: Types.number(),
//             })
//         })
//     })),
//     handle: async (control, route) => {
//         let day_30 = moment.utc().add(-30, 'days').unix();

//         let esFuel = await Elastic.init({
//             index: 'log',
//             filter_must: [
//                 {"range" : { "create_time" : { "gte" : day_30 } } }
//             ],
//             filter_should : [],
//             aggs: {
//                 group_by: {
//                     terms: {
//                         field: 'fuel_id.keyword',
//                         // order : { "create_time" : "desc" }
//                     },
//                     aggs: {
//                         group_docs: {
//                             top_hits: {
//                                 size: 1,
//                                 sort: [
//                                     {
//                                         create_time: { "order": "desc" }
//                                     }
//                                 ]
//                             }
//                         },
//                         bucket_truncate: {
//                             bucket_sort: {
//                                 from: 0,
//                                 size: route.args.page_size
//                             }
//                         }
//                     }
//                 },
//                 count:{
//                     cardinality: {
//                         "field": "id.keyword"
//                     }
//                 }
//             }
//         });
        
//         if (route.args.type)
//             esFuel.filter_must.push({term: {'al.keyword': route.args.type}});
//         if (route.args.search)
//         {
//             esFuel.filter_should.push({"wildcard": {'fuel_id.keyword': `*${route.args.search}*` }});
//             esFuel.filter_should.push({"wildcard": {'info.fuelname.keyword': `*${route.args.search}*` }});
//         }
//         if (route.args.alarm_level){
//             esFuel.filter_must.push({terms: {'al.keyword': Util.getAlramCodeByLevel(route.args.alarm_level)}});
//         }
//         if (route.args.area)
//             esFuel.filter_must.push({term: {'info.area.id': route.args.area}});
//         if(route.session.area_id && route.session.type != 1){
//              esFuel.filter_must.push({term: {'info.area.id': route.session.area_id}});
//         }

//         let temp = await esFuel.aggregate();

//         control.setPaging(temp.group_by.buckets.length);

//         let listArea = await Db.area.list(1, 100);

//         // let listFuel = await Db.fuel.list(1, 100);
//         let listFuel = await Elastic.init({
//                         index: 'fuel'
//                     }).search();

//         return await Promise.all(temp.group_by.buckets.map(async (element) => {
//             let tempObj = element.group_docs.hits.hits[0]._source;
//             tempObj.create_time = moment(tempObj.create_time);
//             tempObj.info.create_date = moment(tempObj.info.create_date);
            
//             listFuel.forEach(function(_fuel) {
//                 if(tempObj.info.name == _fuel.name){
//                     tempObj.fuelname = _fuel.fuelname;
//                 }
//             })
           
//             listArea.rows.forEach(function(area) {
//                 if(tempObj.info.area.id == area.id){
//                     tempObj.info.area.name = area.name;
//                 }
//             })
//             //listrs.push(tempObj);

//             return tempObj;
//         }));



//         // temp.group_by.buckets.forEach(async function(element) {
            
//         // });

//         // return listrs;

//     }
// });


// Route.get({
//     url: '/alarm/list',
//     summary: 'Lấy trạng thái mới nhất',
//     paging: true,
//     requireAuth: true,
//     parameter: {
//         search: {type: Types.string()},
//         area: {type: Types.integer()},
//         alarm_level: {type: Types.integer()},
//         type: {type: Types.string()},
//         check: {type: Types.integer()},
//     },
//     response: Types.list(Types.object({
//         agv : Types.number(),
//         ischeck: Types.string(),
//         type: Types.string(),
//         dc_low: Types.number(),
//         num: Types.number(),
//         level: Types.number(),
//         name: Types.string(),
//         fuel_id: Types.string(),
//         id: Types.string(),
//         fuelname: Types.string(),
//         create_time: Types.datetime(),
//         note: Types.string(),
//     })),
//     handle: async (control, route) => {
//         let day_30 = moment.utc().add(-30, 'days').unix();

//         let esFuel = await Elastic.init({
//             index: 'log_alarm',
//             start: (route.args.page - 1) * route.args.page_size,
//             size: route.args.page_size,
//             filter_must: [
//                 {"range" : { "create_time" : { "gte" : day_30 } } }
//             ],
//             sort: [
//                 {create_time: {order: 'desc'}}
//             ],
//         });
        
//         if (route.args.type)
//             esFuel.filter_must.push({term: {'type.keyword': route.args.type}});
//         if (route.args.search)
//             esFuel.filter_must.push({term: {'fuel_id.keyword': route.args.search}});
//         if (route.args.alarm_level){
//             esFuel.filter_must.push({term: {'level': route.args.alarm_level}});
//         }
        
//         if (route.args.check || route.args.check == 0)
//             esFuel.filter_must.push({term: {'ischeck': route.args.check}});
//         if(route.session.area_id && route.session.type != 1){
//              esFuel.filter_must.push({term: {'info.area.id': route.session.area_id}});
//         }

//         let count = await esFuel.count();
        
//         control.setPaging(count);
//         if (count === 0)
//             return [];

//         let data = await esFuel.search();

//         // let listFuel = await Db.fuel.list(1, 100);
//         let listFuel = await Elastic.init({
//                         index: 'fuel'
//                     }).search();

//         let result = [];

//         for( let x of data) {
//             x.create_time = moment(x.create_time);

//             listFuel.forEach(function(_fuel) {
//                 if(x.fuel_id == _fuel.name){
//                     x.fuelname = _fuel.fuelname;
//                 }
//             })

//             result.push(x);
//         };

//         return result;

//     }
// });

// Route.post({
//     url: '/alarm/note_update',
//     parameter: {
//         uuid : {
//             required: true,
//             type: Types.string()
//         },
// 		note : {
//             required: true,
//             type: Types.string()
//         },
//         name: {
//             required: true,
//             type: Types.string()
//         }
//     },
//     response: Types.raw(),
//     handle: async (control, route) => {

//         let item = await Elastic.init({
//                 index: 'fuel',
//                 filter_must: [
//                     { term: {'name.keyword': route.args.name }}
//                 ],
//             }).searchFirst();
//         if (item === null)
//             throw {code: 'update fail'};
//         else{
//         	item.note = route.args.note;
//             let result = await Elastic.init({
//         		index: 'fuel'}).set(item.id,item);
//             return {
// 	            id: item.id
// 	        };
//         }
//     },
// });

// Route.post({
//     url: '/alarm/check',
//     parameter: {
//         id : {
//             required: true,
//             type: Types.string()
//         },
//     },
//     response: Types.raw(),
//     handle: async (control, route) => {

//         let item = await Elastic.init({
//                 index: 'log_alarm',
//                 filter_must: [
//                     { term: {'id.keyword': route.args.id }}
//                 ],
//             }).searchFirst();
//         if (item === null)
//             throw {code: 'update fail'};
//         else{
//         	item.ischeck = 1;
//             let result = await Elastic.init({
//         		index: 'log_alarm'}).set(item.id,item);
//             return {
// 	            id: item.id
// 	        };
//         }
//     },
// });

// Route.get({
//     url: '/fuel_manager/list',
//     summary: 'Lấy trạng thái mới nhất',
//     paging: true,
//     requireAuth: true,
//     parameter: {
//         search: {type: Types.string()},
//         area: {type: Types.integer()},
//         alarm_level: {type: Types.integer()},
//         type: {type: Types.string()},
//         check: {type: Types.integer()},
//     },
//     response: Types.list(Types.object({
//         fuel_id : Types.string(),
//         starttime: Types.datetime(),
//         endtime: Types.datetime(),
//         type: Types.string(),
//         times: Types.number(),
//         start_level_fuel: Types.number(),
//         end_level_fuel: Types.number(),
//         delta_fuel: Types.number(),
//         fuelname: Types.string(),
//         value_oil:Types.number(),
//         startoil:Types.number(),
//         endoil:Types.number(),
//         info:Types.object({
//             id: Types.number(),
//             name: Types.string(),
//             lat: Types.number(),
//             lng: Types.number(),
//             address: Types.string(),
//             phone: Types.string(),
//             area_id: Types.number(),
//             type: Types.number(),
//             x: Types.number(),
//             y: Types.number(),
//             z: Types.number(),
//             std_comsumption: Types.number(),
//             status: Types.string(),
//             control: Types.number(),
//             dc_low: Types.number(),
//             tank_volume: Types.number(),
//             area: Types.object({
//                 name: Types.string(),
//                 id: Types.number(),
//             })
//         })
//     })),
//     handle: async (control, route) => {
//         let day_30 = moment.utc().add(-30, 'days').unix();

//         let esFuel = await Elastic.init({
//             index: 'log_oil',
//             start: (route.args.page - 1) * route.args.page_size,
//             size: route.args.page_size,
//             filter_must: [
//                 { term: {'done': 1 }}
//             ],
//             sort: [
//                 {starttime: {order: 'desc'}}
//             ],
//         });
        
//         if(route.session.area_id && route.session.type != 1){
//              esFuel.filter_must.push({term: {'info.area.id': route.session.area_id}});
//         }
//         if (route.args.type)
//             esFuel.filter_must.push({term: {'type.keyword': route.args.type}});
//         if (route.args.search)
//             esFuel.filter_must.push({term: {'fuel_id.keyword': route.args.search}});
        
//         if (route.args.check || route.args.check == 0)
//             esFuel.filter_must.push({term: {'ischeck': route.args.check}});

//         let count = await esFuel.count();
        
//         control.setPaging(count);
//         if (count === 0)
//             return [];

//         let data = await esFuel.search();

//         let listFuel = await Elastic.init({
//                         index: 'fuel'
//                     }).search();

//         let result = [];

//         for( let x of data) {
//             console.log(x);
//             x.starttime = moment(x.starttime);
//             x.endtime = moment(x.endtime);

//             x.value_oil = (x.delta_fuel / 4096 * x.info.tank_volume).toFixed(2);
//             x.startoil = (x.start_level_fuel / 4096 * x.info.tank_volume).toFixed(2);
//             x.endoil = (x.end_level_fuel / 4096 * x.info.tank_volume).toFixed(2);

//             listFuel.forEach(function(_fuel) {
//                 if(x.fuel_id == _fuel.name){
//                     x.fuelname = _fuel.fuelname;
//                 }
//             })

//             result.push(x);
            
//         };

//         return result;

//     }
// });