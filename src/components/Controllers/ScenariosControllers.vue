<template>
    <div class="popup">
        <div class="popup-inner">
            <div class="row" v-if="props.numPlayers==4">
                <div class="col" style="text-align: center;"> 
                    <img src="../../assets/ControllersAssets/scenario4p1.png" style="width:100%; border-radius: 10px;">
                    <b-button @click="select(1)" class="button">Scenario 1</b-button>
                </div>
                <div class="col"> 
                    <img src="../../assets/ControllersAssets/scenario4p2.png" style="width:100%; border-radius: 10px;">
                    <b-button @click="select(2)" class="button">Scenario 2</b-button>
                </div>
                <div class="col"> 
                    <img src="../../assets/ControllersAssets/scenario4p3.png" style="width:100%; border-radius: 10px;">
                    <b-button @click="select(3)" class="button">Scenario 3</b-button>
                </div>
            </div>
            <div class="row" v-if="props.numPlayers==3">
                <div class="col" style="text-align: center;"> 
                    <img src="../../assets/ControllersAssets/scenario3p1.png" style="width:100%; border-radius: 10px;">
                    <b-button @click="select(1)" class="button">Scenario 1</b-button>
                </div>
                <div class="col"> 
                    <img src="../../assets/ControllersAssets/scenario3p2.png" style="width:100%; border-radius: 10px;">
                    <b-button @click="select(2)" class="button">Scenario 2</b-button>
                </div>
                <div class="col"> 
                    <img src="../../assets/ControllersAssets/scenario3p3.png" style="width:100%; border-radius: 10px;">
                    <b-button @click="select(3)" class="button">Scenario 3</b-button>
                </div>
            </div>  
            <div class="row" v-if="props.numPlayers==2">
                <div class="col" style="text-align: center;"> 
                    <img src="../../assets/ControllersAssets/scenario2p1.png" style="width:100%; border-radius: 10px;">
                    <b-button @click="select(1)" class="button">Scenario 1</b-button>
                </div>
                <div class="col"> 
                    <img src="../../assets/ControllersAssets/scenario2p2.png" style="width:100%; border-radius: 10px;">
                    <b-button @click="select(2)" class="button">Scenario 2</b-button>
                </div>
                <div class="col"> 
                    <img src="../../assets/ControllersAssets/scenario2p3.png" style="width:100%; border-radius: 10px;">
                    <b-button @click="select(3)" class="button">Scenario 3</b-button>
                </div>
            </div>                  
        </div>
    </div>
</template>

<script>
import { defineComponent, inject, onMounted, ref } from 'vue'

export default defineComponent({
    props: {
        numPlayers: Number
    },
    setup (props, context) {

        const emitter = inject('emitter');
                
        function select(value){
            emitter.emit('scenarioSelectedControllers', {'scenario':value}); // objecte json
            context.emit('close')
        }   

        return {
            select,
            props            
        }
    }
})
</script>

<style scoped>
.popup {
	position: fixed;
	top: 0;
	left: 0;
    padding-top: 10px; /* Location of the box */

    width: 100%; /* Full width */
    height: 100%; /* Full height */

	z-index: 99;

    overflow: auto; /* Enable scroll if needed */

	background-color: rgba(0, 0, 0, 0.5);

    display: flex; 
	align-items: center;
	justify-content: center;
	
}
.popup-inner {
	background: rgba(0, 0, 0, 0);
    width: 1200px;
    height: 500px;
    display: flex; 
	align-items: center;
	justify-content: center;
    flex-direction: column;    
}

.row{
    background-color: #EDF4F2;
    padding-top: 10px;
    border-radius: 15px;
    height: 370px;
}

.button-backround{
    background-color: #EDF4F2;
    padding-top: 10px;
}
.button{
    width:100%;
    font-size: 20px;
    font-family:monospace;
    font-weight: bold;
    background-color: #973a93;
    color: #f1f437;
    border: none;
    margin-top: 10px;
}
</style>