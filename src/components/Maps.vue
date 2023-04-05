<template>
    <div style="margin-top: 2%;">
        <div>
            <h3 v-if="showTitle" style="text-align: center; margin-bottom: 20px;">Add section for player: {{ players[actualPlayer] }}</h3>
            <div style="display:flex">
                <div id="map"></div>
                <div id="wpTable">
                    <b-table :items="waypoints">                        
                    </b-table>
                </div>
            </div>  
            <div style="display:flex; margin-left:20%"> 
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="save" variant="success" size="lg">Save</b-button>
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="clear" variant="warning" size="lg">Clear</b-button>
            </div>
                      
        </div>
        
    </div>
</template>

<script>
import {ref, onMounted, inject } from 'vue'
import leaflet from 'leaflet'
// https://medium.com/spemer/using-axios-in-vue-js-17f186756a8b
import axios from 'axios'
import Swal from 'sweetalert2'
import * as turf from '@turf/turf';

export default {
    setup (props,context) {

        let map;
        let count = 0;
        let waypoints = ref([]);
        let popup = leaflet.popup();
        let tmpLine = undefined;
        let players = ref([]);
        const emitter = inject('emitter');
        let client = inject('mqttClient');
        let tmpLineClick = undefined;
        let actualPlayer = ref(0);
        let droneLabLimits = [[41.2764151, 1.9882914],[41.2762170, 1.9883551],[41.2763733, 1.9890491],[41.2765582, 1.9889881]];
        let playersPolygons = [];
        let playersPolygonsCoord = [];
        let showTitle = ref(false);
        let waypointsCoord = [];
        let sectorsLines = [];
        let playerColors = ['blue', 'red', 'green', 'yellow'];
        

        onMounted (() => {
            
            map = leaflet.map('map').setView([41.276386992722706, 1.988712064955474], 19); //coordenadas del campus, es posa en un objecte amb id 'map' que posem a la div, el 19 i el maxZoom es per allunyar i apropar
                          
            // MapBox
            let token = "pk.eyJ1Ijoiam9hbmEtb3AiLCJhIjoiY2xkdTRtOHhmMDJjaDN2bXY0Zjl3b2pqeCJ9.6zfF7e0G7vK8Vyy4YE8mxw";
            leaflet.tileLayer('https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token='+token, {
                 maxZoom: 21,
                 minZoom: 20,
                 attribution: 'MapBox'
             }).addTo(map);
            map.on("click",onMapClick); // associem el event click a la funcio onMapClick
            map.on("mousemove",onMapOver); // passar el ratoli per sobre el mapa
            map.on("contextmenu",onRightClick); //context menu es el click del boto dret del ratoli

            let droneLabPolygon = leaflet.polygon(droneLabLimits, {color: 'white'}).addTo(map);

            emitter.on('players', (data) => {
                players.value = data.players;
                showTitle.value = true;
            })
        })

        function onMapClick(e){            
            if(inside([e.latlng.lat, e.latlng.lng], droneLabLimits) && actualPlayer.value!=3 && players.value.length>0){
            /* let a = true;
            if(a){ */
                let insidePlayer = false;
                for(let i = 0; i<actualPlayer.value; i++){
                    if(inside([e.latlng.lat, e.latlng.lng], playersPolygonsCoord[i])){
                        insidePlayer = true;
                    }
                }
                if(insidePlayer == false){
                    count = count + 1;     
                    waypoints.value.push(e.latlng);
                    waypointsCoord.push([e.latlng.lat, e.latlng.lng]);
                    if (waypoints.value.length > 1){ // quan estigui al segon waypoint    
                        sectorsLines.push(leaflet.polyline(waypoints.value, {color: 'red'}).addTo(map));                
                    }
                    if (waypoints.value.length > 2){ // 3r waypoint
                        if(tmpLineClick!=undefined){
                            tmpLineClick.remove(map); 
                        }
                        tmpLineClick = leaflet.polyline([waypoints.value[0], waypoints.value[waypoints.value.length-1]], {color: 'red'}).addTo(map);
                    } 
                    
                }                
            }                  
            
        }

        function onMapOver(e){
            if (count> 0){ // si ja tinc almenys un waypoint
                let last = waypoints.value[waypoints.value.length-1]; //agafo l'ultim waypoint
                let distance = last.distanceTo(e.latlng).toFixed(0)/1000; //funcio calcula la distancia
                                
                if(tmpLine!=undefined){
                    tmpLine.remove(map); //borrem la linea anterior abans de dibuixar la nova, pk no es quedi tot ple de linees
                }
                tmpLine = leaflet.polyline([last,e.latlng], {color: 'red'}).addTo(map); //guardo la linea
            }
        }

        function onRightClick(e){
           if(actualPlayer.value!=3 && players.value.length>0){                     
            /* let a = true;
            if(a){ */
                let color;
                if(actualPlayer.value == 0){
                    color = 'blue';                
                }
                else if(actualPlayer.value == 1){
                    color = 'red';
                }  
                if(waypoints.value.length>=4){                    
                    if(!polygonsIntersect()){        
                        playersPolygons.push(leaflet.polygon(waypoints.value, {color: color}).addTo(map));
                        playersPolygonsCoord.push([waypointsCoord]);
                        if(actualPlayer.value == 2){
                            playersPolygonsCoord[3] = [droneLabLimits,playersPolygonsCoord[0][0],playersPolygonsCoord[1][0], playersPolygonsCoord[2][0]];
                            playersPolygons.push(leaflet.polygon(playersPolygonsCoord[3], {color: 'yellow'}).addTo(map));
                            playersPolygons.push(leaflet.polygon(playersPolygonsCoord[0], {color: 'blue'}).addTo(map));
                            playersPolygons.push(leaflet.polygon(playersPolygonsCoord[1], {color: 'red'}).addTo(map));
                            playersPolygons.push(leaflet.polygon(playersPolygonsCoord[2], {color: 'green'}).addTo(map))
                        }                    
                        actualPlayer.value = actualPlayer.value + 1;
                    }
                    else{
                        Swal.fire("Sectors can't intersect")
                        for(let i = 0; i<sectorsLines.length; i++){
                            sectorsLines[i].remove(map);
                        }
                        tmpLineClick.remove(map);
                    }    
                                        
                    count = 0;
                    waypoints.value = [];
                    waypointsCoord = [];
                    tmpLine.remove(map);
                    tmpLine = undefined; 
                    sectorsLines = [];  
                }
                else{
                    Swal.fire("sectors must have at least four points");
                }
                                                     
            }
            
        }

        function clear(){
            count = 0;
            waypoints.value = [];
            actualPlayer.value = 0;
            playersPolygons = [];
            sectorsLines = []; 
            waypointsCoord = [];
            map.eachLayer((layer) => { //recorre el mapa per anar borrant tot el que hem ficat, pero només si son waypoints o lines
                if(layer['_latlng']!=undefined) //waypoint
                    layer.remove();
                if(layer['_path']!=undefined) //line
                    layer.remove();
            });
        }

        function save(){

            Swal.fire({
                title: "Save sectors?",
                text: "Are you sure? You won't be able to revert this!",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Yes!"
            }).then((result)=>{
                if(result.value){ //confirmed                    
                    for(let i = 0; i<players.value.length; i++){
                        let topic = "dashboardControllers/mobileApp/"+players.value[i]+"/sector";
                        let message = sectorToJSON(playersPolygonsCoord[i], i);
                        client.publish(topic, message);
                    }                                      
                }
            })
        }

        function sectorToJSON(sectorsPlayer, indexColor){
            let waypoint;
            let sectorJSON = {
                sector: [],
                color: playerColors[indexColor]
            }
            for(let i = 0; i<sectorsPlayer.length; i++){ //sectors
                let sectorArray = [];
                for(let j = 0; j<sectorsPlayer[i].length; j++){ //waypoints
                    waypoint = {
                        lat: sectorsPlayer[i][j][0],
                        long: sectorsPlayer[i][j][1]
                    }
                    sectorArray.push(waypoint);
                }
                sectorJSON.sector.push(sectorArray);
            }    

            return JSON.stringify(sectorJSON)
        }

        function inside(point, vs) {
            // ray-casting algorithm
            
            var x = point[0], y = point[1];
            
            var inside = false;
            for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                var xi = vs[i][0], yi = vs[i][1];
                var xj = vs[j][0], yj = vs[j][1];
                
                var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) { 
                    inside = !inside;
                }
            }
            
            return inside;
        }

        function polygonsIntersect(){
            let intersecting = false;
            let newWaypoints = Array.from(waypointsCoord);
            let newPolygonCoord;
            newWaypoints.push(waypointsCoord[0])
            for(let i = 0; i<actualPlayer.value; i++){
                let pol1 = turf.polygon([newWaypoints]);
                newPolygonCoord = Array.from(playersPolygonsCoord[i][0]);
                newPolygonCoord.push(playersPolygonsCoord[i][0][0]);
                let pol2 = turf.polygon([newPolygonCoord]);
                var intersection = turf.intersect(pol1, pol2);
                if(intersection!=null){
                    intersecting = true;
                }
            }            
            newWaypoints = null;
            newPolygonCoord = null;
            return intersecting
        }


        return {
            onMapClick,
            onMapOver,
            onRightClick,
            clear,
            save,
            map,
            count,
            waypoints,
            popup,
            tmpLine,
            players,
            actualPlayer,
            showTitle
        }
    }
}
</script>

<style>

#map {  
    width: 80%;
    height: 600px;
    border-style: solid;
}

.my_labels{
    background-color: yellow;
}
</style>