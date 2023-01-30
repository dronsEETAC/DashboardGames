<template>
  <div class="hello">
    <button @click="onClickButton" class="buttonStyle"> Click here </button>
    <h1>{{ msg }}</h1> <!-- msg es una variable -->
    <h1> self message: {{ selfMessage }}</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'; // importem ref per utilitzar variables reactives

export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: String, // rebre una variable del component pare de tipus string    
  },
  setup (){
    // let selfMessage = "my message" amb aixo la variable no canvia pk no es reactiva, es carga nomes un cop al iniciar
    let selfMessage = ref("my message")
    function onClickButton(){
      console.log("Button clicked")
      selfMessage.value = "Button clicked";
    }
    return{
      // s'han de retornar les funcions i les variables per poder ser utilitzades
      onClickButton,
      selfMessage
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .buttonStyle{
    background-color: brown;
    color: white;
  }
</style>
