<template>
    <div class="leftStyle">
        <div>
            <b-button style ="width:20%; margin:1%; margin-left:20%"  @click="startVideoStream" variant="success">
                    Start video frame 
            </b-button>
            <b-button style ="width:20%; margin:1%" @click="stopVideoStream" variant="warning">
                    Stop video frame 
            </b-button>
            </div>
            <div  style ="width:70%">
            <canvas style="margin-left:20%; width: 400px; height: 300px; border-style: solid;" id= "output"></canvas>
        </div> 
    </div>
</template>

<script>
import { defineComponent, inject, onMounted } from 'vue'

export default defineComponent({
    setup () {
        let client = inject("mqttClient");        
        onMounted(()=>{
            client.on('message', (topic,message) => {
                if(topic=="videoFrame"){
                    const img = new Image();
                    img.src = "data:image/jpg;base64,"+message; //objecte tipo Image on li coloquem la imatge rebuda pel payload, el tag es per identificar el tipus de imatge
                    const canvas = document.getElementById('output');  //gracies al id podem obtenir el canvas
                    const context = canvas.getContext('2d');  // afegirem la imatge en el canvas    
                    img.onload = () => {          
                        context.drawImage(
                            img,
                            0,
                            0,
                            img.width,
                            img.height,
                            0,
                            0,
                            canvas.width,
                            canvas.height
                            );  
                    };
                }
            })
        })
        function startVideoStream(){
            client.publish("StartVideoStream");
            client.subscribe("videoFrame");
        }
        function stopVideoStream(){
            client.publish("StopVideoStream");
        }
        return {
            client,
            startVideoStream,
            stopVideoStream
        }
    }
})
</script>

<style scoped>
    .leftStyle{
        border-style: solid;
        border-color: yellow;
        width: 50%;
    }
</style>