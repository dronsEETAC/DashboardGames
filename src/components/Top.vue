<template>
    <div class="topStyle">
        <h3 style="text-align: center; margin-top: 2%; margin-bottom: 2%;"> Players </h3>
        <div class="row" style="text-align: center; margin-top: 5%; margin-bottom: 2%;">
            <div class="col">
                <h5>{{ players[0] }}</h5>
            </div>
            <div class="col">
                <h5>{{ players[1] }}</h5>
            </div>
            <div class="col">
                <h5>{{ players[2] }}</h5>
            </div>
            <div class="col">
                <h5>{{ players[3] }}</h5>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, inject, onMounted } from 'vue' // ref per les variables que canvien, inject per 
// https://www.npmjs.com/package/vue-sweetalert2
import Swal from 'sweetalert2'

export default defineComponent({
    components:{
    },
    setup (props, context) {
        let client = inject('mqttClient');
        const emitter = inject('emitter');
        let numPlayers = 0;
        let maxPlayers = ref(false);
        let players = ref([]);


        onMounted(() => {
            client.subscribe('mobileApp/dashboardControllers/username');

            client.on('message', (topic, message) => {
                if(topic=='mobileApp/dashboardControllers/username'){                    
                    let success = InputUsername(message.toString());
                    let newTopic = 'mobileApp/dashboardControllers/'+message.toString()+'/create'
                    console.log(newTopic)
                    client.publish(newTopic, success);                    
                }
                else if(topic == "mobileApp/dashboardControllers/disconnect"){
                    players.value = [];
                    maxPlayers.value = false;
                    numPlayers = 0;                    
                }
            })
        })
      
        function InputUsername(username){  
            let nameTaken = false;
            for(var i = 0; i<players.value.length; i++){
                if(username == players.value[i]){
                    nameTaken = true;
                }
            }   
            if(!nameTaken){
                players.value.push(username);
                numPlayers = numPlayers + 1;
                if(numPlayers == 4){
                    maxPlayers.value = true;   
                    emitter.emit('players', {'players': players.value});          
                }
                return "ok"
            } 
            else{
                return "error"
            }      
            
        }

        return {           
            InputUsername,  
            client,
            maxPlayers,
            players
        }
    }
})
</script>

<style scoped>
.topStyle{
    border-style: solid;
    border-color: rgb(0, 0, 0);
    border-radius: 20px;
    height: 22%;
    margin-bottom: 10px;
}
</style>