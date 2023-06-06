<template> 
    <h1 style="text-align: center">Dashboard for Controllers Game</h1>
    <div class ="main">
      <Top></Top>
      <Maps></Maps>
    </div>
  </template>
  
  <script>
  import { onMounted, defineComponent, ref, inject } from 'vue';
  import Maps from './Maps.vue';
  import Top from './Top.vue';
  import Swal from 'sweetalert2'
  
  export default defineComponent({
    components: {
      Top,
      Maps
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
  