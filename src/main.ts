import { createApp } from 'vue'
import App from './App.vue'

import BootstrapVue3 from 'bootstrap-vue-3'
import BootstrapVueIcons from 'bootstrap-vue-3' // icons

// Optional, since every component import their Bootstrap functionality
// the following line is not necessary
// import 'bootstrap'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'

import 'bootstrap-icons/font/bootstrap-icons.css'

// https://stackoverflow.com/questions/66537320/vue-3-event-bus-with-composition-api
import mitt from 'mitt';                  // Import mitt
const emitter = mitt();                   // Initialize mitt

// https://www.emqx.com/en/blog/how-to-use-mqtt-in-vue
import mqtt, { MqttClient } from 'mqtt'

const app = createApp(App)
app.provide('emitter', emitter);          // permet a tots els components accedir a aquell emisor

let client: MqttClient
try{
    client = mqtt.connect('ws://broker.hivemq.com:8000/mqtt') //proba a connectar-se
    client.on('connect', () => { //si el commando que rep es 'connect', s'ha connectat bé
        console.log("Connection succeeded!");
        client.publish("dashboardWebApp/mobileApp/Connect","");        
        app.provide('mqttClient', client); // com s'ha connectet proveim el client als altres components pk el puguin utilitzar
    })
}
catch(error){
    console.log("mqtt.connect error ", error);
}

app.use(BootstrapVue3)
app.use(BootstrapVueIcons)
app.mount('#app')
