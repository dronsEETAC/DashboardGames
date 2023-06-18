<template>
  <div style="display: flex; justify-content: center;">
    <div style="width:80%;">
      <div v-if="!connected" class="row" style="text-align: center;">
        <h2 style="margin-top: 5%; margin-bottom: 5%;">What game do you want to play?</h2>
      </div>
      <div v-if = "!connected" class="row">
        <b-button style="margin-bottom: 3%; height: 100px; font-size: large;" @click = "toggle('controllers')" variant="success">Controllers Game</b-button>
      </div>
      <div v-if = "!connected" class="row">
        <b-button style="margin-bottom: 3%; height: 100px; font-size: large;" @click = "toggle('followme')" variant="success">Follow Me Game</b-button>
      </div>    
      <div v-if = "connected" class="row">
        <b-button style="width:900px; margin-bottom:2%; margin-left: 8%" @click = "toggle('home')" variant="danger">Exit</b-button>
      </div>
    </div> 
  </div>
  
  <div v-if = "mode=='controllers'" class ="main">
    <ControllersApp></ControllersApp>
  </div>
  <div v-if="mode=='followme'">
    <FollowMeApp></FollowMeApp>
  </div>
</template>

<script>
import { onMounted, defineComponent, ref, inject } from 'vue';
import ControllersApp from './components/ControllersApp.vue';
import FollowMeApp from './components/FollowMeApp.vue';
import Swal from 'sweetalert2'

export default defineComponent({
  name: 'App',
  components: {
    ControllersApp,
    FollowMeApp
  },
  setup () {
    let connected = ref(false);
    const emitter = inject('emitter');
    let waypoints = [[41.2762634, 1.9887789],[41.2765063, 1.9884315],[41.2763148, 1.9882317],[41.2763632, 1.9891490]]
    let mode = ref('home')

    function toggle (game) {
      console.log(game);
      connected.value = !connected.value;
      mode.value = game;
    }

    return {
      toggle,
      connected,
      mode
    }
  }
});
</script>

<style>

</style>
