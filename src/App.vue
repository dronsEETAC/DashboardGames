<template>
  <div style="display: flex; justify-content: center;">
    <b-button v-if = "!connected" class = "myButtonConnect" style="margin-bottom: 3%;" @click = "toggle" variant="success">Enter</b-button>
    <b-button v-if = "connected" class = "myButtonConnect" @click = "toggle" variant="danger">Exit</b-button>
  </div>  
  <h1 style="text-align: center" v-if="!connected">Dashboard for Controllers Game</h1>
  <div v-if = "connected" class ="main">
    <Top></Top>
    <Maps></Maps>
  </div>
</template>

<script>
import { onMounted, defineComponent, ref, inject } from 'vue';
import Maps from './components/Maps.vue';
import Top from './components/Top.vue';
import Swal from 'sweetalert2'

export default defineComponent({
  name: 'App',
  components: {
    Top,
    Maps
  },
  setup () {
    let connected = ref(false);
    const emitter = inject('emitter');
    
    function toggle () {
      connected.value = !connected.value
    }

    return {
      toggle,
      connected  
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

</style>
