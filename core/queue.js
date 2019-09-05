const moment = require('moment');
const Util = require('.//util');
const Elastic = require('./elastic');

class My_queue {
    static init() {
        this.instance = [];
    }

 	  get instance() {
        return this._instance;
    };

    static getData() {
        return this.instance;
    }

    static getSize() {
        return this.instance.length;
    }

    static async push(obj) {
        this.instance.push(obj);
        return this.instance;
    }

    static get(number){
      let now = moment.utc();
    	let kqarr = [];
       	if(number > 0 && number <= this.instance.length)
       	{
       		for(let i=0;i<number;i++){
       			// kqarr.push(this.instance.shift());
       			let item = this.instance.shift();
       			kqarr.push({"index": {
	                "_index": "log",
	                "_type": "log",
	                "_id": item.uuid
	            }});
            kqarr.push(item);
              
       		}
       	}
        // console.log(kqarr);
        return kqarr;
    }
    static addOne(table,id,obj){
      let kqarr = [];
      kqarr.push({"index": {
                  "_index": table,
                  "_type": table,
                  "_id": id
              }});
      kqarr.push(obj);

      return kqarr;
    }
}

module.exports = My_queue;