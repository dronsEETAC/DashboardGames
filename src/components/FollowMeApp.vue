<template>
    <div style="text-align: center; margin-bottom: 40px; margin-top: 20px;">
      <h2>Dashboard for Follow Game</h2>
    </div>    
    <div style="display:flex; justify-content: center;">
      <b-button v-if="!connected" variant="info" @click="connect" style="margin-left: 5%; margin-right: 5%; margin-bottom: 5px; width:70%">Connect</b-button>
      <b-button v-if="connected" variant="success" style="margin-left: 5%; margin-right: 5%; margin-bottom: 5px; width:70%">Connected</b-button>
      <b-button v-if="!flying" variant="info" @click="takeoff" style="margin-left: 5%; margin-right: 5%; margin-bottom: 5px; width:70%" :disabled="!connected">Take off</b-button>
      <b-button v-if="flying" variant="success" style="margin-left: 5%; margin-right: 5%; margin-bottom: 5px; width:70%">Flying...</b-button>
      <b-button v-if="!returning" variant="info" @click="rtl" style="margin-left: 5%; margin-right: 5%; margin-bottom: 5px; width:70%" :disabled="!flying">Return to Launch</b-button>
      <b-button v-if="returning" variant="success" style="margin-left: 5%; margin-right: 5%; margin-bottom: 5px; width:70%">Returning...</b-button>
    </div>
    <div v-if="flying && !returning">
      <h2>Now following: {{ followingName }}</h2>
    </div>
    <div style="display: flex">
      <div style="width:80%; margin-left: 10px; margin-right: 5px;">
        <MapsFollowMe @connected="connected = true" @flying="flying = true" @returning="returning = true" @onHearth="resetButtons()"></MapsFollowMe>
      </div>      
      <div style="width:20%; margin-left: 5px; margin-right: 10px; margin-top: 20px;">
        <table class="myTable">
          <tr>
            <th>
              Players:
            </th>
          </tr>
          <tr v-for="(name, index) in players" :key="index">
            <td>
              {{ name }}
            </td>
          </tr>
        </table>
      </div>      
    </div>
  </template>
  
  <script>
  import { onMounted, defineComponent, inject, ref } from 'vue';
  import Swal from 'sweetalert2'
  import MapsFollowMe from './MapsFollowMe'
  
  export default defineComponent({
    components: {
        MapsFollowMe
    },   

    setup () {
      const emitter = inject('emitter');
      let client = inject('mqttClient');
      let connected = ref(false);
      let flying = ref(false);
      let returning = ref(false);

      let players = ref([])
      let followingName = ref("")


      onMounted (() => {

        client.subscribe("+/dashboardFollowme/#");

        emitter.on('following', (index) => {
          followingName.value = players.value[index]
        })

        client.on('message', (topic, message) => {

          if(topic=="mobileApp/dashboardFollowme/username"){
            let success = InputUsername(message.toString());
            let newTopic = 'dashboardFollowme/mobileApp/'+message.toString()+'/create';                   
            client.publish(newTopic, success);            
          }

          if(topic=="mobileApp/dashboardFollowme/sendList"){
            client.publish('dashboardFollowme/mobileApp/updateList', JSON.stringify(players.value))            
          }


        })
      })

      function connect(){
        if(players.value.length < 2){
          Swal.fire("There must be at least 2 players to start")
        }
        else{
          client.publish('dashboardFollowme/autopilotService/connect');
        }        
      }
  
      function takeoff(){
        client.publish('dashboardFollowme/autopilotService/armAndTakeoff')
      }  
      
      function rtl(){
        client.publish('dashboardFollowme/autopilotService/returnToLaunch')
      }

      function resetButtons(){
        connected.value = true;
        flying.value = false;
        returning.value = false;
      }

      function InputUsername(username){  
        let nameTaken = false;
        for(var i = 0; i<players.value.length; i++){
          if(username == players.value[i]){
            nameTaken = true;
          }
        }   
        if(!nameTaken){
          players.value.push(username);
          emitter.emit('newPlayer',username);
          return "ok"
        } 
        else{
          return "error"
        }   
      }
  
      return {
        connect,
        takeoff,
        rtl,
        players,
        resetButtons,
        connected,
        flying,
        returning,
        followingName
      }
    }
  });
  </script>
  
  <style>
    .main {
      height: 1000px;    
      margin-left: 5px;
      margin-right: 5px;
    }
    .myButtonConnect {
      width : 900px;
      color : white;
      margin-top: 1%;
      margin-bottom: 1%;
    }
    .myTable {
      border-collapse: collapse;
      border: 1px solid;
      width: 100%
    }

    th, td {
      padding-left: 15px;
      padding-top: 10px;
      padding-bottom: 10px;
      text-align: left;
    }

    th {
      background-color: #59c1d3;
      color: black;
    }

    tr:nth-child(even) {background-color: #f2f2f2;}
  
  </style>
  