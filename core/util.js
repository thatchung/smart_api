const Config = require('../config');
const uuid = require('uuid');
const Elastic = require('./elastic');
const sha256 = require('sha256');
const sha3 = require('js-sha3');

module.exports = class {
    static randomString(length = 32) {
        if (length <= 0)
            throw 'length must be > 0';

        let ct = Math.ceil(length / 32);
        let result = '';
        for (let i = 0; i < ct; i++)
            result += uuid.v4();

        result = result.replace(/-/g, '').substring(0, length);
        return result;
    }

    static sha3_512Hash(string) {
        return sha3.sha3_512(string);
    }
    
    formatDate(value, type, timezoneOffset) {
        if (timezoneOffset === undefined || timezoneOffset === null) {
            if (type == 'minute') {
                return moment.unix(value).format('HH:mm');
            } else if (type == 'hour') {
                return moment.unix(value).format('HH:00');
            }else if (type == 'day') {
                return moment.unix(value).format('DD-MM-YYYY');
            }else if (type == 'week') {
                return moment.unix(value).format('DD-MM-YYYY');
            }else if (type == 'month') {
                return moment.unix(value).format('MM-YYYY');
            }else if (type == 'year') {
                return moment.unix(value).format('YYYY');
            }
        }
        return moment.unix(value).add(timezoneOffset - moment().utcOffset(), 'minute').format('DD-MM-YYYY HH:mm');
    }

    static sha1_256Hash(string) {
        return sha256(string);
    }

    static phoneChangeTo10(phone){
        if(phone && phone.length > 4) {
            let str = phone.slice(0,4);
            let val = phone.slice(4);
            
            str = str.replace(/0123/g, "083");
            str = str.replace(/0124/g, "084");
            str = str.replace(/0125/g, "085");
            str = str.replace(/0127/g, "081");
            str = str.replace(/0129/g, "082");
            str = str.replace(/0169/g, "039");
            str = str.replace(/0168/g, "038");
            str = str.replace(/0167/g, "037");
            str = str.replace(/0166/g, "036");
            str = str.replace(/0164/g, "034");
            str = str.replace(/0163/g, "033");
            str = str.replace(/0162/g, "032");
            str = str.replace(/0120/g, "070");
            str = str.replace(/0121/g, "079");
            str = str.replace(/0122/g, "077");
            str = str.replace(/0126/g, "076");
            str = str.replace(/0128/g, "078");
            str = str.replace(/0186/g, "056");
            str = str.replace(/0188/g, "058");
            str = str.replace(/0199/g, "059");
    
            phone = str+val;
        }

        return phone;
    }

    static phoneChangeTo11(phone){
        if(phone && phone.length > 4) {
            let str = phone.slice(0,3);
            let val = phone.slice(3);
            
            str = str.replace(/083/g, "0123");
            str = str.replace(/084/g, "0124");
            str = str.replace(/085/g, "0125");
            str = str.replace(/081/g, "0127");
            str = str.replace(/082/g, "0129");
            str = str.replace(/039/g, "0169"); 
            str = str.replace(/038/g, "0168");
            str = str.replace(/037/g, "0167");
            str = str.replace(/036/g, "0166");
            str = str.replace(/034/g, "0164");
            str = str.replace(/033/g, "0163");
            str = str.replace(/032/g, "0162");
            str = str.replace(/070/g, "0120");
            str = str.replace(/079/g, "0121");
            str = str.replace(/077/g, "0122");
            str = str.replace(/076/g, "0126");
            str = str.replace(/078/g, "0128");
            str = str.replace(/056/g, "0186");
            str = str.replace(/058/g, "0188");
            str = str.replace(/059/g, "0199");
    
            phone = str+val;
        }
        return phone;
    }

    static formatStringAscii(str){
        str = str.toLowerCase();
        str = str.normalize();

        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        str = str.replace(/Đ/g, "D");
        return str;
    }
    
    static clearVietnamese(text){
        return text
            .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
            .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
            .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
            .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
            .replace(/[ìíịỉĩ]/g, 'i')
            .replace(/[ÌÍỊỈĨ]/g, 'I')
            .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
            .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
            .replace(/[ùúụủũưừứựửữ]/g, 'u')
            .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
            .replace(/[ỳýỵỷỹ]/g, 'y')
            .replace(/[ỲÝỴỶỸ]/g, 'Y')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    }

    static async mapAwait(listItem, mapMethod, session = 20) {
        let result = [];
        for (let i = 0; i <= Math.ceil(listItem.length / session); i++) {
            const start = i * session;
            const end = (i + 1) * session;
            const sessionItems = listItem.slice(start, end);
            let sessionResult = [];
            // const sessionResult = await Promise.all(sessionItems.map(item => mapMethod(item)));
            for (let s of sessionItems){
                sessionResult.push(await mapMethod(s))
            }
            // console.log(sessionResult)
            result = result.concat(sessionResult);
        }
        return result;
    }

    static ticketType(nameType){
        if (nameType === 'callin')
            return 'User gọi vào';
        if (nameType === 'callout')
            return 'Cs gọi ra';
    }

    static callStatus(value){
        if (value === 'preparecall')
            return 'Đang quay số';
        if (value === 'dial')
            return 'Gọi nhỡ';
        // if (value === 'calling')
        //     return 'Đang nghe máy';
        if (value === 'calloff')
            return 'Không nghe máy';
        if (value === 'endcall')
            return 'Kết thúc';
    }

    static processStatus(value){
        if (value === 'prepare')
            return 'Chưa xử lý';
        if (value === 'doing')
            return 'Đang xử lý';
        if (value === 'success')
            return 'Thành công';
        if (value === 'fail')
            return 'Thất bại';
    }

    static getCsTicketByState(arr,id,process) {
       var kq = 0;
        for (var i = 0; i < arr.length; i++) {
            if(id == arr[i].id && process == arr[i].process)
                kq = arr[i].count;
        }
        return kq;
    }

    static getAgentTicketByState(arr,agent,status) {
       var kq = 0;
        for (var i = 0; i < arr.length; i++) {
            if(agent == arr[i].agentname && status == arr[i].callstatus)
                kq = arr[i].count;
        }
        return kq;
    }

    static getTicketByTypeAndDate(arr,date,state) {
       var kq = 0;
       if(state != 'all'){
            for (var i = 0; i < arr.length; i++) {
                if(date == arr[i].date && state == arr[i].type)
                    kq = arr[i].count;
            }
        }
        else{
            for (var i = 0; i < arr.length; i++) {
                if(date == arr[i].date){
                    kq = kq +  arr[i].count;
                }
            }
        }
        return kq;
    }

    static getTicketByUserProcessAndDate(arr,date,id) {
       var kq = 0;

        for (var i = 0; i < arr.length; i++) {
            if(date == arr[i].date && id == arr[i].type)
                kq = arr[i].count;
        }
       
        return kq;
    }

    static getUpTicket(arr,id) {
       var kq = 0;
        for (var i = 0; i < arr.length; i++) {
            if(id == arr[i].id )
                kq = arr[i].count;
        }
        return kq;
    }

    static paginate (array, page_size, page) {
      return array.slice(page_number * page_size, (page_number + 1) * page_size);
    }

    static checkloadintime (start_time, end_time, start_get,end_get) {
        if(end_time <= end_get && end_time >= start_get)
            return true;
        if(start_time >= start_get && start_time <= end_get)
            return true;
        return false;
    }


};