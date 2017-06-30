global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
module.exports = function(RED) {
  "use strict";
  const cassandra = require('cassandra-driver'),
        Rx = require('rxjs'),
        firebase = require('firebase');

  function reactSensorEvent(config) {
      RED.nodes.createNode(this, config);
      var node = this;

      // Initialize Firebase
      var config = {
        apiKey: "AIzaSyAOWUE7YxJmy3kR53hjE-oLM1VE23HkZ0s",
        authDomain: "plateforme-donnees-urbaines.firebaseapp.com",
        databaseURL: "https://plateforme-donnees-urbaines.firebaseio.com",
        projectId: "plateforme-donnees-urbaines",
        storageBucket: "plateforme-donnees-urbaines.appspot.com",
        messagingSenderId: "238930573214"
      };
      firebase.initializeApp(config);

      node.on('input', function(msg) {
        const sensorId = msg.payload.header.id;
        const value = msg.payload.data.informationmap[0].value;

        // firebase
        firebase.database().ref('equipments/presence_sensors/' + sensorId + '/value').set(parseInt(value));

        switch(sensorId) {
          case "presence_sensor0":
            if(value != 0)
              lightOnOff("street_light0", value == 1 ? 1: 0);
            break;
          case "presence_sensor1":
            if(value != 0) {
              lightOnOff("street_light0", value == 1 ? 0: 1);
              lightOnOff("street_light1", value == 1 ? 1: 0);
            }
            break;
          case "presence_sensor2":
            if(value != 0) {
              lightOnOff("street_light1", value == 1 ? 0: 1);
              lightOnOff("street_light2", value == 1 ? 1: 0);
            }
            break;
          case "presence_sensor3":
            if(value != 0) {
              lightOnOff("street_light2", value == 1 ? 0: 1);
              lightOnOff("street_light3", value == 1 ? 1: 0);
            }
            break;
          case "presence_sensor4":
            if(value != 0)
              lightOnOff("street_light3", value == 1 ? 0: 1);
            break;
        }

        // reset sensor after 1sec
        setTimeout(function(){ 
          resetSensor(sensorId);
        }, 1000);
        
        node.send(msg);
      });   
  }

  function lightOnOff(streetLightId, value) {
    const body = {
      "id": streetLightId,
      "type": "street_light",
      "commandclass": "event",
      "value": value,
      "date": new Date().getTime()
    };

    Rx.Observable
      .ajax.post({url: "http://169.46.26.52:1880/sensor", body: body, headers: {"x-data-type": "SENSOR"}})
      .map(e => e.response)
      .subscribe(response => {
        firebase.database().ref('equipments/street_lights/' + streetLightId + '/value').set(parseInt(value));
      });
  }

  function resetSensor(sensorId) {
    const body = {
      "id": sensorId,
      "type": "presence_sensor",
      "commandclass": "event",
      "value": 0,
      "date": new Date().getTime()
    }; 

    Rx.Observable
      .ajax.post({url: "http://169.46.26.52:1880/sensor", body: body, headers: {"x-data-type": "SENSOR"}})
      .map(e => e.response)
      .subscribe(response => {
        firebase.database().ref('equipments/presence_sensors/' + sensorId + '/value').set(parseInt(value));
      });    
  }

  RED.nodes.registerType("presence-sensor", reactSensorEvent);
}
