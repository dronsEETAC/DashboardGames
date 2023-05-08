<template>
    <div style="margin-top: 2%;">
        <div style="display:flex; margin-left:10%; margin-bottom: 5%;"> 
            <b-button style="width:40%; margin-top:5%" @click="selectScenario" variant="info" size="lg" :disabled="selectScenarioButtonDisabled">Select Scenario</b-button>
            <b-button style="width:40%; margin-left:2%; margin-top:5%" @click="createScenario" variant="info" size="lg" :disabled="createScenarioButtonDisabled">Create Scenario</b-button>
        </div>
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
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="nextPlayer" variant="info" size="lg" :disabled="nextPlayerDisabled">Next Player</b-button>
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="save" variant="success" size="lg" :disabled="buttonFinishDisabled">Finish</b-button>
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="clear" variant="warning" size="lg" :disabled="buttonsDisabled">Clear</b-button>
            </div>
                      
        </div>
        <Scenarios v-if="showScenarios" @close="showScenarios=false"></Scenarios>
    </div>
</template>

<script>
import {ref, onMounted, inject } from 'vue'
import leaflet from 'leaflet'
// https://medium.com/spemer/using-axios-in-vue-js-17f186756a8b
import axios from 'axios'
import Swal from 'sweetalert2'
import * as turf from '@turf/turf';
import Scenarios from './Scenarios.vue'

export default {
    components:{
        Scenarios
    },
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
        let droneLabLimits = [[41.27643580, 1.98821960],[41.27619490, 1.98833760],[41.27636320, 1.98911820],[41.27658190, 1.98901760]];
        //let droneLabLimits = [[41.2764151, 1.9882914],[41.2762170, 1.9883551],[41.2763733, 1.9890491],[41.2765582, 1.9889881]];
        let playersPolygons = [];
        let playersPolygonsCoord = [];
        let showTitle = ref(false);
        let waypointsCoord = [];
        let sectorsLines = [];
        let playerColors = ['blue', 'red', 'green', 'yellow'];
        let buttonsDisabled = ref(true);
        let buttonFinishDisabled = ref(true);
        let nextPlayerDisabled = ref(true);
        let actualPlayerPolygon = [];
        let creatingScenario = ref(false);
        let showScenarios = ref(false);
        let selectScenarioButtonDisabled = ref(true);
        let createScenarioButtonDisabled = ref(true);
        let scenario;

        let drone;
        let northLine;
        let southLine;
        let westLine;
        let eastLine;
        let practicePointLat = 41.2765003;
        let practicePointLong = 1.9889760;
        let practicePoint = [practicePointLat, practicePointLong];
        let northPoint;
        let southPoint;
        let eastPoint;
        let westPoint;
        let northIcon = leaflet.divIcon({className: 'mylabel', html: "<div style='width: 50;'><b style='color:yellow; margin-left: 2px;'>N</b></div>"});
        let southIcon = leaflet.divIcon({className: 'mylabel', html: "<div style='width: 50;'><b style='color:yellow; margin-left: 2px;'>S</b></div>"});
        let eastIcon = leaflet.divIcon({className: 'mylabel', html: "<div style='width: 50;'><b style='color:yellow;'>E</b></div>"});
        let westIcon = leaflet.divIcon({className: 'mylabel', html: "<div style='width: 50;'><b style='color:yellow;'>W</b></div>"});
        let northLabel;
        let southLabel;
        let eastLabel;
        let westLabel;

        let scenario1 = [[[[41.2763662, 1.9891155],[41.2764831, 1.9890632],[41.2764156, 1.9886917],[41.2762886, 1.9887453]]], //player 1
                        [[[41.2764831, 1.9890632],[41.2764156, 1.9886917],[41.2765134, 1.9886555],[41.2765769, 1.9890149]]], //player 2
                        [[[41.2764156, 1.9886917],[41.2762886, 1.9887453],[41.2762029, 1.9883443],[41.2763350, 1.9882773]]], //player 3
                        [[[41.2765134, 1.9886555],[41.2764156, 1.9886917],[41.2763350, 1.9882773],[41.2764307, 1.9882330]]]]; //player 4

        let scenario2 = [[[[41.2763702, 1.9891101],[41.2765748, 1.9890122],[41.2765416, 1.9888271],[41.2763319, 1.9889250]]],
                        [[[41.2765416, 1.9888271],[41.2763319, 1.9889250],[41.2762967, 1.9887520],[41.2765083, 1.9886461]]],
                        [[[41.2762967, 1.9887520],[41.2765083, 1.9886461],[41.2764720, 1.9884396],[41.2762443, 1.9885428]]],
                        [[[41.2764720, 1.9884396],[41.2762443, 1.9885428],[41.2762049, 1.9883497],[41.2764327, 1.9882303]]]];

        let scenario3 = [[[[41.2765759, 1.9890162],[41.2765043, 1.9890457],[41.2764761, 1.9888848],[41.2765466, 1.9888526]],[[41.2764821, 1.9885053],[41.2763309, 1.9885804],[41.2763088, 1.9884530],[41.2764095, 1.9884034],[41.2763793, 1.9882572],[41.2764307, 1.9882397]]],
                        [[[41.2765043, 1.9890457],[41.2764851, 1.9889331],[41.2763450, 1.9889881],[41.2763692, 1.9891061]],[[41.2765083, 1.9886340],[41.2762886, 1.9887225],[41.2762594, 1.9886085],[41.2764821, 1.9885053]]],
                        [[[41.2764851, 1.9889331],[41.2764761, 1.9888848],[41.2765466, 1.9888526],[41.2765083, 1.9886340],[41.2763803, 1.9886823],[41.2764358, 1.9889532]],[[41.2762594, 1.9886085],[41.2763309, 1.9885804],[41.2763088, 1.9884530],[41.2762362, 1.9884959]]],
                        [[[41.2763450, 1.9889881],[41.2764358, 1.9889532],[41.2763803, 1.9886823],[41.2762886, 1.9887225]],[[41.2762362, 1.9884959],[41.2764095, 1.9884034],[41.2763793, 1.9882572],[41.2762039, 1.9883457]]]]

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
                buttonsDisabled.value = false;
                selectScenarioButtonDisabled.value = false;
                createScenarioButtonDisabled.value = false;
            })

            emitter.on('scenarioSelected', (data) => {
                scenario = data.scenario;
                paintScenario();                
                selectScenarioButtonDisabled.value = true;
            })
            
            client.subscribe("mobileApp/dashboardControllers/disconnect");

            client.on('message', (topic, message) => {
                if(topic=="autopilotService/mobileApp/telemetryInfo"){
                    let telemetryInfo = JSON.parse(message);
                    practicePointLat = telemetryInfo.lat;
                    practicePointLong = telemetryInfo.lon;
                    practicePoint = [practicePointLat, practicePointLong];
                    paintDrone();
                    buttonsDisabled.value = true;
                    selectScenarioButtonDisabled.value = true;
                    createScenarioButtonDisabled.value = true;
                    if(playersPolygonsCoord.length>0){
                        let insidePlayer = false;
                        for(let i = 0; i<4; i++){
                            for(let j = 0; j<playersPolygonsCoord[i].length; j++){
                                if(inside([practicePointLat, practicePointLong], playersPolygonsCoord[i][j])){
                                    insidePlayer = true;
                                }
                            }                        
                        }
                        if(insidePlayer == false){
                            client.publish("mobileApp/autopilotService/returnToLaunch","");
                        }
                    }
                    
                }
                else if(topic == "mobileApp/dashboardControllers/disconnect"){
                    clear();
                    players.value = [];
                    client.publish('mobileApp/autopilotService/disconnect');
                    client.publish('dashboardControllers/mobileApp/disconnect');
                    client.unsubscribe("autopilotService/mobileApp/telemetryInfo")
                }
            })
        })

        function paintDrone(){
            if(drone!=undefined){
                drone.remove(map);
            }
            if(northLine!=undefined){
                northLine.remove(map);
            }
            if(southLine!=undefined){
                southLine.remove(map);
            }
            if(eastLine!=undefined){
                eastLine.remove(map);
            }
            if(westLine!=undefined){
                westLine.remove(map);
            }
            if(northLabel!=undefined){
                northLabel.remove(map);
            }
            if(southLabel!=undefined){
                southLabel.remove(map);
            }
            if(eastLabel!=undefined){
                eastLabel.remove(map);
            }
            if(westLabel!=undefined){
                westLabel.remove(map);
            }
            
            drone = leaflet.circle(practicePoint, 0.8, {stroke: false, fill: true, fillColor: "red", fillOpacity: 1}).addTo(map);
            northPoint = [practicePointLat + 0.00003, practicePointLong + 0];
            southPoint = [practicePointLat - 0.00003, practicePointLong + 0];
            eastPoint = [practicePointLat + 0, practicePointLong + 0.00004];
            westPoint = [practicePointLat + 0, practicePointLong - 0.00004];
            northLine = leaflet.polyline([practicePoint, northPoint], {color: 'red'}).addTo(map);
            southLine = leaflet.polyline([practicePoint, southPoint], {color: 'red'}).addTo(map);
            eastLine = leaflet.polyline([practicePoint, eastPoint], {color: 'red'}).addTo(map);
            westLine = leaflet.polyline([practicePoint, westPoint], {color: 'red'}).addTo(map);
            northLabel = leaflet.marker( northPoint, {
                icon: northIcon
            }).addTo(map);
            southLabel = leaflet.marker( southPoint, {
                icon: southIcon
            }).addTo(map);
            eastLabel = leaflet.marker( eastPoint, {
                icon: eastIcon
            }).addTo(map);
            westLabel = leaflet.marker( westPoint, {
                icon: westIcon
            }).addTo(map);
       }

        function onMapClick(e){           
           if(inside([e.latlng.lat, e.latlng.lng], droneLabLimits) && actualPlayer.value!=3 && players.value.length>3 && creatingScenario.value == true){
            /* let a = true;
            if(a){  */
                let insidePlayer = false;
                for(let i = 0; i<actualPlayer.value; i++){
                    for(let j = 0; j<playersPolygonsCoord[i].length; j++){
                        if(inside([e.latlng.lat, e.latlng.lng], playersPolygonsCoord[i][j])){
                            insidePlayer = true;
                        }
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
            if(actualPlayer.value!=3 && players.value.length>3  && creatingScenario.value == true){                     
            /* let a = true;
            if(a){ */
                let color;                
                if(waypoints.value.length>=4){                    
                    if(!polygonsIntersect()){        
                        if(actualPlayer.value == 0){
                            color = 'blue'; 
                            nextPlayerDisabled.value = false;                                    
                        }
                        else if(actualPlayer.value == 1){
                            color = 'red';
                        }  
                        else if(actualPlayer.value == 2){
                            color = 'green';
                        }                         
                        playersPolygons.push(leaflet.polygon(waypoints.value, {color: color}).addTo(map));                        
                        actualPlayerPolygon.push(waypointsCoord);                                      
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
                    nextPlayerDisabled.value = false;                   
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
            actualPlayerPolygon = [];
            playersPolygonsCoord = [];
            map.eachLayer((layer) => { //recorre el mapa per anar borrant tot el que hem ficat, pero només si son waypoints o lines
                if(layer['_latlng']!=undefined) //waypoint
                    layer.remove();
                if(layer['_path']!=undefined) //line
                    layer.remove();
            });
            leaflet.polygon(droneLabLimits, {color: 'white'}).addTo(map);
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
                        let message = sectorToJSON(playersPolygonsCoord[i], i, !creatingScenario.value);
                        console.log(message);
                        client.publish(topic, message);
                        client.subscribe('autopilotService/mobileApp/telemetryInfo');
                        creatingScenario.value = false;
                        buttonsDisabled.value = true;
                        selectScenarioButtonDisabled.value = true;
                        createScenarioButtonDisabled.value = true;
                        buttonFinishDisabled.value = true;
                    }                                      
                }
            })
        }

        function sectorToJSON(sectorsPlayer, indexColor, predeterminedScenario){
            let waypoint;
            let sectorJSON = {
                sector: [],
                color: playerColors[indexColor],
                scenario: predeterminedScenario
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
            console.log(newWaypoints);
            let newPolygonCoord;
            newWaypoints.push(waypointsCoord[0]);
            let pol1 = turf.polygon([newWaypoints]);
            for(let i = 0; i<actualPlayer.value; i++){
                console.log("dins");
                for(let j = 0; j<playersPolygonsCoord[i].length; j++){                    
                    newPolygonCoord = Array.from(playersPolygonsCoord[i][j]);
                    newPolygonCoord.push(playersPolygonsCoord[i][j][0]);                    
                    let pol2 = turf.polygon([newPolygonCoord]);
                    let intersection = turf.intersect(pol1, pol2);
                    if(intersection!=null){
                        intersecting = true;
                    }
                }                                
            }     
            for(let j = 0; j<actualPlayerPolygon.length; j++){
                newPolygonCoord = Array.from(actualPlayerPolygon[j]);
                newPolygonCoord.push(actualPlayerPolygon[j][0]);                    
                let pol2 = turf.polygon([newPolygonCoord]);
                let intersection = turf.intersect(pol1, pol2);
                if(intersection!=null){
                    intersecting = true;
                }
            }

            newWaypoints = null;
            newPolygonCoord = null;
            return intersecting
        }

        function nextPlayer(){
            actualPlayer.value = actualPlayer.value + 1;            
            playersPolygonsCoord.push(actualPlayerPolygon);
            nextPlayerDisabled.value = true;            
            if(actualPlayer.value == 3){
                actualPlayerPolygon = [droneLabLimits];                
                for(let i = 0; i<3; i++){                                
                    for(let j = 0; j<playersPolygonsCoord[i].length ; j++){
                        actualPlayerPolygon.push(playersPolygonsCoord[i][j])    
                    }
                }
                playersPolygonsCoord.push(actualPlayerPolygon);
                playersPolygons.push(leaflet.polygon(playersPolygonsCoord[3], {color: 'yellow'}).addTo(map));
                playersPolygons.push(leaflet.polygon(playersPolygonsCoord[0], {color: 'blue'}).addTo(map));
                playersPolygons.push(leaflet.polygon(playersPolygonsCoord[1], {color: 'red'}).addTo(map));
                playersPolygons.push(leaflet.polygon(playersPolygonsCoord[2], {color: 'green'}).addTo(map));                
                buttonFinishDisabled.value = false;
                Swal.fire('Sector set for player: '+players.value[actualPlayer.value]);   
            }
            else{
                Swal.fire('Set sectors for player: '+players.value[actualPlayer.value]);   
            }              

            actualPlayerPolygon = [];
        }

        function selectScenario(){
            showScenarios.value = true;
            createScenarioButtonDisabled.value = true;
        }

        function createScenario(){
            creatingScenario.value = true;
            selectScenarioButtonDisabled.value = true;
        }

        function paintScenario(){
            if(scenario == '1'){
                playersPolygonsCoord = Array.from(scenario1);
            }
            else if(scenario == '2'){
                playersPolygonsCoord = Array.from(scenario2);
            }   
            else{
                playersPolygonsCoord = Array.from(scenario3);
            }         
            
            playersPolygons.push(leaflet.polygon(playersPolygonsCoord[0], {color: 'blue'}).addTo(map));
            playersPolygons.push(leaflet.polygon(playersPolygonsCoord[1], {color: 'red'}).addTo(map));
            playersPolygons.push(leaflet.polygon(playersPolygonsCoord[2], {color: 'green'}).addTo(map));
            playersPolygons.push(leaflet.polygon(playersPolygonsCoord[3], {color: 'yellow'}).addTo(map));

            buttonFinishDisabled.value = false;
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
            showTitle,
            buttonsDisabled,
            nextPlayer,
            nextPlayerDisabled,
            buttonFinishDisabled,
            selectScenario,
            createScenario,
            showScenarios,
            selectScenarioButtonDisabled,
            createScenarioButtonDisabled
        }
    }
}
</script>

<style>

#map {  
    width: 80%;
    height: 600px;
    border-style: solid;
    z-index: 1;
}

.my_labels{
    background-color: yellow;
}
</style>