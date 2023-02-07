<template>
    <div class="topStyle">
        <div style="display:flex; margin-left:20%">
            <b-button @click="alertClicked" style="margin:1%; width:15%" variant="primary">Alert</b-button>
            <b-button @click="showParametersPopup = true" style="margin:1%; width:15%" variant="secondary">Parameters</b-button>
            <Parameters v-if="showParametersPopup" @close="closeParameters"></Parameters> <!-- Quan es clicki el boto de close, Parameters.vue fara la funció close, quan aixo passi @close, aqui s'executara la funcio closeParameters -->
            <b-button @click="getValue" style="margin:1%; width:15%" variant="success">Get Value</b-button>
            <b-form-input style = "width:8%; margin-top:1%" disabled = "True" v-model="value" size="lg"></b-form-input> <!-- disabled pk no es pugui escriure -->
            <b-button @click="showMap=!showMap" style="margin:1%; width:15%" variant="danger">Show Map</b-button>
            <Maps v-if="showMap" @close="closeMap"></Maps>
        </div>
        <b-input-group prepend="New user" style="width:50%; margin-left: 22%; margin-top: 1%">
            <b-form-input placeholder="name here" v-model="username"></b-form-input>
            <b-form-input placeholder="age here" v-model="age"></b-form-input>
            <b-input-group-append>
            <b-button @click ="InputUsername" variant="info">Enter</b-button>
            </b-input-group-append>
        </b-input-group>
    </div>
</template>

<script> // treiem la etiqueta lang="ts" pk no es queixi dels tipus de typescript
import { defineComponent, ref, inject, onMounted } from 'vue' // ref per les variables que canvien, inject per 
// https://www.npmjs.com/package/vue-sweetalert2
import Swal from 'sweetalert2'

// importar els components
import Parameters from './Parameters.vue'
import Maps from './Maps.vue'

export default defineComponent({
    components:{
        Parameters,
        Maps
    },
    setup () {
        let username = ref(undefined);
        let age = ref(undefined);
        let showParametersPopup = ref(false);
        let value = ref(undefined);
        let showMap = ref(false);
        let client = inject('mqttClient');
        const emitter = inject('emitter');   // Inject `emitter` que hem creat al main.ts

        onMounted(() => { // quan es crei ("monti") aquest component, s'executarà la funcio
            client.on('message', (topic,message) => { // en el caso de que se reciba un message
                if(topic == "Value"){
                    value.value = message;
                }
            })
        }) 
      
        function alertClicked(){
            Swal.fire('Alert Clicked')
        }
        function InputUsername(){
            console.log("name: ", username.value, " age: ", age.value);            
            emitter.emit('newUser', {'name':username.value, 'age':age.value}); // objecte json
            username.value = undefined;
            age.value = undefined;
        }
        function closeParameters(){
            showParametersPopup.value = false;
        }
        function getValue(){
            client.publish("getValue","")
            client.subscribe("Value") // ens hem de subscriure a la resposta amb topic value
        }
        function closeMap(){
            showMap.value = false;
        }

        return {
            alertClicked,            
            InputUsername,            
            closeParameters,
            getValue,
            closeMap,
            username,
            age,
            showParametersPopup,
            value,
            client,
            showMap
        }
    }
})
</script>

<style scoped>
.topStyle{
    border-style: solid;
    border-color: red;
    height: 20%;
}
</style>