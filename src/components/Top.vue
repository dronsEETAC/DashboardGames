<template>
    <div class="topStyle">
        <div style="margin-left:20%">
            <b-button @click="alertClicked" style="margin:1%; width:15%" variant="primary">Alert</b-button>
            <b-button style="margin:1%; width:15%" variant="secondary">Secondary</b-button>
            <b-button style="margin:1%; width:15%" variant="success">Success</b-button>
            <b-button style="margin:1%; width:15%" variant="danger">Danger</b-button>
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
import { defineComponent, ref, inject } from 'vue' // ref per les variables que canvien, inject per 
// https://www.npmjs.com/package/vue-sweetalert2
import Swal from 'sweetalert2'

export default defineComponent({
    setup () {
        let username = ref(undefined);
        let age = ref(undefined);
        const emitter = inject('emitter');   // Inject `emitter` que hem creat al main.ts
        function alertClicked(){
            Swal.fire('Alert Clicked')
        }
        function InputUsername(){
            console.log("name: ", username.value, " age: ", age.value);            
            emitter.emit('newUser', {'name':username.value, 'age':age.value}); // objecte json
            username.value = undefined;
            age.value = undefined;
        }

        return {
            alertClicked,
            username,
            age,
            InputUsername
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