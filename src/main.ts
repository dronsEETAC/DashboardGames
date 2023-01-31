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

const app = createApp(App)
app.use(BootstrapVue3)
app.use(BootstrapVueIcons)
app.provide('emitter', emitter);          // permet a tots els components accedir a aquell emisor
app.mount('#app')
