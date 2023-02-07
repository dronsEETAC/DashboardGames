<template>
    <div class="popup">
        <div class="popup-inner">
            <div style="display:flex">
                <div id="map"></div>
                <div id="wpTable">
                    <b-table :items="waypoints">                        
                    </b-table>
                </div>
            </div>  
            <div style="display:flex; margin-left:20%"> 
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="load" variant="primary" size="lg">Load</b-button>
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="save" variant="info" size="lg">Save</b-button>
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="clear" variant="warning" size="lg">Clear</b-button>
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="close" variant="danger" size="lg">Close</b-button>  
            </div>
                      
        </div>
        
    </div>
</template>

<script>
import {ref, onMounted } from 'vue'
import leaflet from 'leaflet'
// https://medium.com/spemer/using-axios-in-vue-js-17f186756a8b
import axios from 'axios'
import Swal from 'sweetalert2'

export default {
    setup (props,context) {

        let map;
        let count = 0;
        let waypoints = ref([]);
        let popup = leaflet.popup();
        let tmpLine = undefined;

        onMounted (() => {
            
             map = leaflet.map('map').setView([41.276486, 1.9886], 19); //coordenadas del campus, es posa en un objecte amb id 'map' que posem a la div, el 19 i el maxZoom es per allunyar i apropar
             //leaflet
             /* leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                 maxZoom: 19,
                 attribution: '© OpenStreetMap'
             }).addTo(map);  */
             
            // MapBox
            let token = "pk.eyJ1Ijoiam9hbmEtb3AiLCJhIjoiY2xkdTRtOHhmMDJjaDN2bXY0Zjl3b2pqeCJ9.6zfF7e0G7vK8Vyy4YE8mxw";
            leaflet.tileLayer('https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token='+token, {
                 maxZoom: 23,
                 attribution: 'MapBox'
             }).addTo(map);
            map.on("click",onMapClick); // associem el event click a la funcio onMapClick
            map.on("mousemove",onMapOver); // passar el ratoli per sobre el mapa
            map.on("contextmenu",onRightClick); //context menu es el click del boto dret del ratoli
        })

        function close(){
            context.emit('close');            
        }

        function onMapClick(e){
            count = count + 1;
            console.log(e.latlng); //e -> event
            if(count>1){
                let last = waypoints.value[waypoints.value.length-1]; //agafo l'ultim waypoint
                let distance = last.distanceTo(e.latlng).toFixed(0)/1000;
                let midpoint = new leaflet.LatLng((last.lat + e.latlng.lat)/2, (last.lng + e.latlng.lng)/2); //punt mig entre dos waypoints
                let wp = leaflet.marker(midpoint, {opacity:0.01}).addTo(map).bindTooltip(distance.toString(),  { // opacitat baixa pk el marcador no es vegi
                            permanent: true,
                            direction: 'center',
                            className: "my_labels"
                         }); //distancia entre waypoints
                //utilitzar per a moure linees amb waypoint
                /* wp.on('dragend', function(event){ 
                    var marker = event.target;
                    var position = marker.getLatLng();
                    console.log ('moving to ', position)
                }); */
            }     

            waypoints.value.push(e.latlng);
            if (waypoints.value.length > 1){ // quan estigui al segon waypoint    
                leaflet.polyline(waypoints.value, {color: 'red'}).addTo(map);
            }
            leaflet.marker(e.latlng, {draggable:true}).addTo(map).bindTooltip(count.toString(),  {
                            permanent: true,
                            direction: 'center',
                            className: "my_labels"
                        }); //numero de waypoint
            
            
        }

        function onMapOver(e){
            if (count> 0){ // si ja tinc almenys un waypoint
                let last = waypoints.value[waypoints.value.length-1]; //agafo l'ultim waypoint
                let distance = last.distanceTo(e.latlng).toFixed(0)/1000; //funcio calcula la distancia
                
                let midpoint = new leaflet.LatLng((last.lat + e.latlng.lat)/2, (last.lng + e.latlng.lng)/2); //punt mig entre dos waypoints
                // finestra que s'obre amb la distancia
                popup 
                .setLatLng(midpoint) // esta on estigui el mouse
                .setContent( distance.toString()) // el que ensenya
                .openOn(map);
                if(tmpLine!=undefined){
                    tmpLine.remove(map); //borrem la linea anterior abans de dibuixar la nova, pk no es quedi tot ple de linees
                }
                tmpLine = leaflet.polyline([last,e.latlng], {color: 'red'}).addTo(map); //guardo la linea
            }
        }

        function onRightClick(e){
            leaflet.polyline(waypoints.value, {color: 'green'}).addTo(map); // dibuixem el poligon de color verd, es dona per acabar el pla de vol
        }

        function clear(){
            count = 0;
            waypoints.value = [];
            map.eachLayer((layer) => { //recorre el mapa per anar borrant tot el que hem ficat, pero només si son waypoints o lines
                if(layer['_latlng']!=undefined) //waypoint
                    layer.remove();
                if(layer['_path']!=undefined) //line
                    layer.remove();
            });
        }

        function save(){

            Swal.fire({
                title: "Save flight plan?",
                text: "Are you sure? You won't be able to revert this!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Yes, save flight plan!"
            }).then((result)=>{
                if(result.value){ //confirmed
                    let data = JSON.stringify(waypoints.value);
                    axios.post("http://localhost:4000/data",data,{
                        headers: {
                            "Content-type":"application/json"
                        }
                    }).then(response => {
                        Swal.fire('Done!');
                        context.emit('close')
                    });                    
                }
            })
        }

        function load(){
            axios.get("http://localhost:4000/data").then(response => {
                let n = response.data.length;
                if(n>0){
                    waypoints.value = response.data[n-1];
                    response.data[n-1].forEach(wp => {
                        leaflet.marker(wp).addTo(map);                        
                    });
                }
            })
        }

        return {
            close,
            onMapClick,
            onMapOver,
            onRightClick,
            clear,
            save,
            load,
            map,
            count,
            waypoints,
            popup,
            tmpLine
        }
    }
}
</script>

<style>
.popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
  
	z-index: 99;
	background-color: rgba(0, 0, 0, 0.2);
	
	display: flex; 
	align-items: center;
	justify-content: center;
	
}
.popup-inner {
    background: #FFF;
    padding: 32px;
    width: 1900px;
    height: 900px;
}

#map {  
    width: 80%;
    height: 600px;
    border-style: solid;
}

.my_labels{
    background-color: yellow;
}
</style>