const mqtt = require('mqtt');
const Elastic = require('./elastic');
const Db = require('../model');
const Util = require('.//util');
const moment = require('moment');
const My_queue = require('./queue');

class MqttHandler {
	// static get() {
	// 	console.log(this.mqttClient);
 //        return this.mqttClient;
 //    };
  constructor() {
    this.mqttClient = null;
    this.host = 'mqtt://27.71.232.111:1883';
    this.username = null;
    this.password = null;
  }
  
  q_connect(){
  	this.mqttClient = mqtt.connect(this.host, { username: this.username, password: this.password });
  }

  connect(subscribe) {
    // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
    if(subscribe){
    	this.mqttClient = mqtt.connect(this.host, { username: this.username, password: this.password });
	    My_queue.init();
	    // Mqtt error calback
	    this.mqttClient.on('error', (err) => {
	      console.log(err);
	      this.mqttClient.end();
	    });

	    // Connection callback
	    this.mqttClient.on('connect', () => {
	      console.log(`mqtt client connected`);
	    });

	    // mqtt subscriptions
	    this.mqttClient.subscribe(subscribe, {qos: 0});

	    this.mqttClient.on('message', async function (topic, message) {
	    	console.log(`mqtt client connected`);
	    });

	    this.mqttClient.on('close', () => {
	      console.log(`mqtt client disconnected`);
	    });
    }
  }

  // Sends a mqtt message to topic: mytopic
  sendMessage(topic,message) {
    this.mqttClient.publish(topic, message);
  }

  closeConnect(){
  	this.mqttClient.end();
  }
}

module.exports = MqttHandler;