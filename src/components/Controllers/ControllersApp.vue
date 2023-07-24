<template> 
    <h1 style="text-align: center">Dashboard for Controllers Game</h1>
    <div class ="main">
      <TopControllers></TopControllers>
      <MapsControllers></MapsControllers>
    </div>
  </template>
  
  <script>
  import { onMounted, defineComponent, ref, inject } from 'vue';
  import MapsControllers from './MapsControllers.vue';
  import TopControllers from './TopControllers.vue';
  import Swal from 'sweetalert2'
  
  export default defineComponent({
    components: {
      TopControllers,
      MapsControllers
    },
    setup () {  

      return {

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
  
  </style>
  