<template>
  <button v-if="!connected" class="myButtonConnect" @click="toggle">Connect</button>
  <button v-if="connected" class="myButtonDisconnect" @click="toggle">Disconnect</button>
  <div v-if="connected" class="main">
    <Top></Top>
    <div style="display: flex; height: 50%">
      <Left></Left>
      <Right></Right>
    </div>
    <Bottom></Bottom>
  </div>  
</template>

<script>
import { defineComponent, ref, inject } from 'vue';
import Top from './components/Top.vue';
import Left from './components/Left.vue';
import Right from './components/Right.vue';
import Bottom from './components/Bottom.vue';

export default defineComponent({
  name: 'App',
  components: {
    Top,
    Left,
    Right,
    Bottom
  },
  setup () {
    let connected = ref(false)
    let client = inject('mqttClient')
    function toggle(){
      connected.value = !connected.value;
      // if(connected.value){
      //  client.publish("Connect",""); // enviem la publicació amb el topic connect i el payload buit
      // }
    }    
    return{
      toggle,
      connected,
      client
    }
  }
});
</script>

<style>
.main{
  height: 900px;
}

.myButtonConnect{
  width: 80%;
  background-color: brown;
  color: white;
  margin-left: 10%;
  margin-bottom: 1%;
}

.myButtonDisconnect{
  width: 80%;
  background-color: rgb(13, 65, 207);
  color: white;
  margin-left: 10%;
  margin-bottom: 1%;
}
</style>
