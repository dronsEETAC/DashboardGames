<template>
    <div class="popup">
        <div class="popup-inner">

            <h1 style="text-align:center; margin-bottom: 5%">Parameters</h1>
            <div>
                <b-form-group
                    label="Name:"
                    label-for="input-1">
                    <b-form-input v-model="name"></b-form-input>
                </b-form-group>

                <b-input-group style="width:80%; margin-left:10%">
                    <b-form-input v-model="speed" type="range" min="0" max="100"></b-form-input>
                    <h4>Speed: {{ speed }}</h4>
                </b-input-group>

                <div style="display:flex">

                    <div style="width: 45%; margin: 1%"> 
                        <b-card bg-variant="light">
                            <b-form-group label="Radios using options" label-align-sm="right" v-slot="{ ariaDescribedby }">
                                <b-form-radio-group
                                    class="pt-2"
                                    v-model="radioButtonSelected" 
                                    :options="['A','B','C']"
                                    :aria-describedby="ariaDescribedby"
                                ></b-form-radio-group> <!-- radioButtonSelected indica quin dels tres ha estat seleccionat -->
                            </b-form-group>
                        </b-card>
                    </div>

                    <div style="width: 45%; margin: 1%; margin-left: 3%"> 
                        <b-card bg-variant="light" inline>
                            <b-form-group label="Checkbox options:" v-slot="{ ariaDescribedby }">
                                <b-form-checkbox-group
                                    v-model="checkBoxSelected"
                                    :options="checkBoxOptions"
                                    :aria-describedby="ariaDescribedby"
                                ></b-form-checkbox-group>
                             </b-form-group>
                        </b-card>
                    </div>

                </div>

            </div>
            
            <b-button style="width:30%; margin-left:10%" @click="writeParameters" variant="warning" size="lg">Send Parameters</b-button>
            <b-button style="width:20%; margin-left:20%" @click="close" variant="danger" size="lg">Close</b-button>
        </div>
    </div>
</template>

<script>

import Swal from 'sweetalert2'

import { ref, inject} from 'vue'

export default {
    setup (props, context) {
        let name = ref(undefined);
        let speed = ref(undefined);
        let radioButtonSelected = ref(undefined);
        let checkBoxOptions= ref ( [
          { text: 'Orange', value: 'orange' },
          { text: 'Apple', value: 'apple' },
          { text: 'Pineapple', value: 'pineapple' },
          { text: 'Grape', value: 'grape'},
         { text: 'Otro', value: 'otro'}
        ]);
        let checkBoxSelected = ref(undefined);
        let client = inject('mqttClient');

        function close(){
            context.emit('close'); // el context es passa com a parametre del setup
        }
        function writeParameters(){
            console.log("Name: ", name.value);
            console.log("Speed: ", speed.value);
            console.log("Radio Button: ", radioButtonSelected.value);
            console.log("Checkbox: ", checkBoxSelected.value);
            // enviem un JSON amb els parametres
            const parameters = {
                checkBoxSelected: checkBoxSelected.value,
                radioButtonSelected: radioButtonSelected.value,
                name: name.value,
                speed: speed.value
            }           

            Swal.fire({
                title: "Write parameters?",
                text: "Are you sure? You won't be able to revert this!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Yes, write parameters!"
            }).then((result)=>{
                if(result.value){ //confirmed
                    let message = JSON.stringify(parameters);
                    client.publish("writeParameters",message);
                    Swal.fire('Done!');
                    context.emit('close') 
                }
            })

            
        }

        return {
            close,
            writeParameters,
            name,
            speed,
            radioButtonSelected,
            checkBoxOptions,
            checkBoxSelected,
            client
        }
    }
}
</script>

<style scoped>
.popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
  
	z-index: 99;
	background-color: rgba(0, 0, 0, 0.2);
	
	display: flex; 
	align-items: center;
	justify-content: center;
	
}
.popup-inner {
		background: #FFF;
		padding: 32px;
        width: 800px;
        height: 600px;
}
</style>