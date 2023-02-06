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
        <div style="display:flex">
            <div  style ="width:70%">
                <canvas style="margin-left:20%; width: 400px; height: 300px; border-style: solid;" id= "output"></canvas>
            </div> 
            <div class ="buttonColumn">
                <b-button style =" margin:1%" @click="mode = 'gray'" variant="info">
                    Gray </b-button>
                <b-button style ="margin:1%" @click="mode = 'canny'" variant="success">
                    Canny </b-button>
                <b-button style ="margin:1%" @click="mode = 'normal'" variant="warning">
                    Normal </b-button>
            </div>
       </div>
    </div>
</template>

<script>
import { defineComponent, inject, onMounted, ref } from 'vue'
import * as cv from 'opencv.js'

export default defineComponent({
    setup () {
        let client = inject("mqttClient");  
        let mode = ref('normal');      
        onMounted(()=>{
            client.on('message', (topic,message) => {
                if(topic=="videoFrame"){
                    const img = new Image();
                    img.src = "data:image/jpg;base64,"+message; //objecte tipo Image on li coloquem la imatge rebuda pel payload, el tag es per identificar el tipus de imatge
                    /*
                    const canvas = document.getElementById('output');  // gracies al id podem obtenir el canvas
                    const context = canvas.getContext('2d');  // afegirem la imatge en el canvas    
                    */
                    img.onload = () => {          
                    // video normal

                    //     context.drawImage(
                    //         img,
                    //         0,
                    //         0,
                    //         img.width,
                    //         img.height,
                    //         0,
                    //         0,
                    //         canvas.width,
                    //         canvas.height
                    //         );  
                    // };

                    // video amb processat
                        let dst;
                        if (mode.value == 'normal')
                            dst = cv.imread (img);
                        if (mode.value == 'gray') { //convertir a blanc i negre
                            let mat = cv.imread (img); //llegir imatge
                            dst = new cv.Mat();
                            cv.cvtColor (mat, dst, cv.COLOR_RGB2GRAY,0); // posar imatge a la destinació modificada
                            mat.delete()
                            }
                        if (mode.value == 'canny') {
                            let mat = cv.imread (img);
                            dst = new cv.Mat();
                            cv.cvtColor (mat, dst, cv.COLOR_RGB2GRAY,0);
                            cv.Canny(mat, dst, 50, 100, 3, false);
                            mat.delete()
                        }
                        cv.imshow ('output',dst); // coloca la imatge al canvas, el mateix que feiem abans pero amb opencv
                    }
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
            mode,
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
    .buttonColumn {
        display: flex;
        justify-content: center;
        flex-direction: column;
        padding-top: 20px;
        width: 20%;
        border: 2px solid red;
        padding: 10px;
        border-radius: 25px;
        margin-left: 5%
    }
</style>