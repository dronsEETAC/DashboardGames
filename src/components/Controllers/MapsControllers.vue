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
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="nextPlayer" variant="info" size="lg" :disabled="nextPlayerDisabled" v-if="sectorsButtonsShowing">Next Player</b-button>
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="save" variant="success" size="lg" :disabled="buttonFinishDisabled" v-if="sectorsButtonsShowing">Finish</b-button>
                <b-button style="width:20%; margin-left:1%; margin-top:5%" @click="clear" variant="warning" size="lg" :disabled="buttonsDisabled" v-if="sectorsButtonsShowing">Clear</b-button>
                <b-button style="width:60%; margin-left:1%; margin-top:5%" @click="finishPractice" variant="danger" size="lg" v-if="finishPracticeButtonShowing">Finish Practice</b-button>
                <b-button style="width:60%; margin-left:1%; margin-top:5%" @click="startFlying" variant="success" size="lg" v-if="startFlyingButtonShowing">Start Flying</b-button>
                <b-button style="width:60%; margin-left:1%; margin-top:5%" variant="warning" size="lg" v-if="flying">Flying...</b-button>
                <b-button style="width:60%; margin-left:1%; margin-top:5%" variant="info" size="lg" v-if="home">Home</b-button>
            </div>                      
        </div> 
        <ScenariosControllers v-if="scenariosShowing" @close="scenariosShowing=false" :numPlayers="numPlayers"></ScenariosControllers>       
    </div>
</template>

<script>
import {ref, onMounted, inject } from 'vue'
import leaflet from 'leaflet'
import Swal from 'sweetalert2'
import * as turf from '@turf/turf';
import ScenariosControllers from './ScenariosControllers.vue'

export default {
    components: {
        ScenariosControllers
    },

    setup (props, context) {
       
        const emitter = inject('emitter');
        let client = inject('mqttClient');
        
        //Map painting Variables
        let map;
        let popup = leaflet.popup();
        let tmpLine = undefined;
        let tmpLineClick = undefined; 
        let waypoints = ref([]);
        let playersPolygons = [];
        let playersPolygonsCoord = [];
        let showTitle = ref(false);
        let waypointsCoord = [];
        let sectorsLines = [];
        let playerColors = ['blue', 'red', 'green', 'yellow'];

        // State Variables
        let count = 0;
        let players = ref([]);
        let actualPlayer = ref(0);
        let buttonsDisabled = ref(true);
        let buttonFinishDisabled = ref(true);
        let nextPlayerDisabled = ref(true);
        let actualPlayerPolygon = [];
        let creatingScenario = ref(false);
        let selectScenarioButtonDisabled = ref(true);
        let createScenarioButtonDisabled = ref(true); 
        let sectorsButtonsShowing = ref(true);   
        let finishPracticeButtonShowing = ref(false);
        let startFlyingButtonShowing = ref(false);    
        let scenario;
        let scenariosShowing = ref(false);
        let numPlayers = ref(0);
        let flying = ref(false);
        let home = ref(false);

        let interval;
        let direction;

        // Drone Painting Variables
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

        //Scenario Variables
        let finalBasePolygon;

        let droneLabLimits = [[41.27643580, 1.98821960],[41.27619490, 1.98833760],[41.27636320, 1.98911820],[41.27658190, 1.98901760]];
        //let droneLabLimits = [[41.2764151, 1.9882914],[41.2762170, 1.9883551],[41.2763733, 1.9890491],[41.2765582, 1.9889881]];

        let scenario4p1 = [[[[41.2763662, 1.9891155],[41.2764831, 1.9890632],[41.2764156, 1.9886917],[41.2762886, 1.9887453]]], //player 1
                        [[[41.2764831, 1.9890632],[41.2764156, 1.9886917],[41.2765134, 1.9886555],[41.2765769, 1.9890149]]], //player 2
                        [[[41.2764156, 1.9886917],[41.2762886, 1.9887453],[41.2762029, 1.9883443],[41.2763350, 1.9882773]]], //player 3
                        [[[41.2765134, 1.9886555],[41.2764156, 1.9886917],[41.2763350, 1.9882773],[41.2764307, 1.9882330]]]]; //player 4

        let scenario4p2 = [[[[41.2763702, 1.9891101],[41.2765748, 1.9890122],[41.2765416, 1.9888271],[41.2763319, 1.9889250]]],
                        [[[41.2765416, 1.9888271],[41.2763319, 1.9889250],[41.2762967, 1.9887520],[41.2765083, 1.9886461]]],
                        [[[41.2762967, 1.9887520],[41.2765083, 1.9886461],[41.2764720, 1.9884396],[41.2762443, 1.9885428]]],
                        [[[41.2764720, 1.9884396],[41.2762443, 1.9885428],[41.2762049, 1.9883497],[41.2764327, 1.9882303]]]];

        let scenario4p3 = [[[[41.2765759, 1.9890162],[41.2765043, 1.9890457],[41.2764761, 1.9888848],[41.2765466, 1.9888526]],[[41.2764821, 1.9885053],[41.2763309, 1.9885804],[41.2763088, 1.9884530],[41.2764095, 1.9884034],[41.2763793, 1.9882572],[41.2764307, 1.9882397]]],
                        [[[41.2765043, 1.9890457],[41.2764851, 1.9889331],[41.2763450, 1.9889881],[41.2763692, 1.9891061]],[[41.2765083, 1.9886340],[41.2762886, 1.9887225],[41.2762594, 1.9886085],[41.2764821, 1.9885053]]],
                        [[[41.2764851, 1.9889331],[41.2764761, 1.9888848],[41.2765466, 1.9888526],[41.2765083, 1.9886340],[41.2763803, 1.9886823],[41.2764358, 1.9889532]],[[41.2762594, 1.9886085],[41.2763309, 1.9885804],[41.2763088, 1.9884530],[41.2762362, 1.9884959]]],
                        [[[41.2763450, 1.9889881],[41.2764358, 1.9889532],[41.2763803, 1.9886823],[41.2762886, 1.9887225]],[[41.2762362, 1.9884959],[41.2764095, 1.9884034],[41.2763793, 1.9882572],[41.2762039, 1.9883457]]]]

        let scenario3p1 = [[[[41.2763672, 1.9891101],[41.2764771, 1.9890578],[41.2764095, 1.9886796],[41.2762916, 1.9887426]]],
                        [[[41.2764771, 1.9890578],[41.2764095, 1.9886796],[41.2765063, 1.9886434],[41.2765738, 1.9890122]]],
                        [[[41.2765063, 1.9886434],[41.2764317, 1.9882384],[41.2762150, 1.9883484],[41.2762916, 1.9887426]]]];
        
        let scenario3p2 = [[[[41.2763692, 1.9891074],[41.2765738, 1.9890109],[41.2765295, 1.9887695],[41.2763219, 1.9888781]]],
                        [[[41.2765295, 1.9887695],[41.2763219, 1.9888781],[41.2762644, 1.9886193],[41.2764831, 1.9885173]]],
                        [[[41.2762644, 1.9886193],[41.2764831, 1.9885173],[41.2764307, 1.9882411],[41.2762130, 1.9883457]]]];

        let scenario3p3 = [[[[41.2763702, 1.9891074],[41.2764539, 1.9890685],[41.2764035, 1.9888285],[41.2763198, 1.9888647]],[[41.2762735, 1.9886702],[41.2763985, 1.9886327],[41.2763642, 1.9884530],[41.2763118, 1.9884771],[41.2762725, 1.9883081],[41.2762090, 1.9883470]]],
                        [[[41.2765738, 1.9890149],[41.2765063, 1.9890444],[41.2764569, 1.9888124],[41.2765325, 1.9887775]],[[41.2764962, 1.9885817],[41.2763985, 1.9886327],[41.2763642, 1.9884530],[41.2764156, 1.9884302],[41.2763813, 1.9882545],[41.2764297, 1.9882344]]],
                        [[[41.2765063, 1.9890444],[41.2764539, 1.9890685],[41.2764035, 1.9888285],[41.2763198, 1.9888647],[41.2762735, 1.9886702],[41.2764962, 1.9885817],[41.2765325, 1.9887775],[41.2764569, 1.9888124]],[[41.2764156, 1.9884302],[41.2763813, 1.9882545],[41.2762725, 1.9883081],[41.2763118, 1.9884771]]]];

        let scenario2p1 = [[[[41.2763662, 1.9891155],[41.2764831, 1.9890632],[41.2764156, 1.9886917],[41.2762886, 1.9887453]],[[41.2765134, 1.9886555],[41.2764156, 1.9886917],[41.2763350, 1.9882773],[41.2764307, 1.9882330]]],
                        [[[41.2764831, 1.9890632],[41.2764156, 1.9886917],[41.2765134, 1.9886555],[41.2765769, 1.9890149]],[[41.2764156, 1.9886917],[41.2762886, 1.9887453],[41.2762029, 1.9883443],[41.2763350, 1.9882773]]]];

        let scenario2p2 = [[[[41.2763733, 1.9890994],[41.2765728, 1.9890122],[41.2765043, 1.9886300],[41.2762906, 1.9887400]]],
                        [[[41.2765043, 1.9886300],[41.2762906, 1.9887400],[41.2762150, 1.9883537],[41.2764277, 1.9882411]]]];

        let scenario2p3 = [[[[41.2763712, 1.9891047],[41.2765043, 1.9890390],[41.2764630, 1.9888379],[41.2763340, 1.9889022]],[[41.2765335, 1.9888043],[41.2764801, 1.9884959],[41.2762574, 1.9885844],[41.2762896, 1.9887145],[41.2764267, 1.9886555],[41.2764630, 1.9888379]],[[41.2763702, 1.9882679],[41.2764035, 1.9884114],[41.2763098, 1.9884516],[41.2762735, 1.9883135]]],
                        [[[41.2765043, 1.9890390],[41.2764630, 1.9888379],[41.2765335, 1.9888043],[41.2765708, 1.9890109]],[[41.2764630, 1.9888379],[41.2763340, 1.9889022],[41.2762896, 1.9887145],[41.2764267, 1.9886555]],[[41.2764801, 1.9884959],[41.2762574, 1.9885844],[41.2762080, 1.9883510],[41.2762735, 1.9883135],[41.2763098, 1.9884516],[41.2764035, 1.9884114],[41.2763702, 1.9882679],[41.2764287, 1.9882330]]]];

        let finalBase = [[41.2763471, 1.9882880],[41.2763209, 1.9883001],[41.2763249, 1.9883336],[41.2763541, 1.9883242]];
        
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
            paintDrone();
            finalBasePolygon = leaflet.polygon(finalBase, {color: '#D301F9', fillColor: '#D301F9', fillOpacity: 0.5}).addTo(map);

            emitter.on('playersControllers', (data) => {
                players.value = data.players;
                numPlayers.value = players.value.length;
                showTitle.value = true;
                buttonsDisabled.value = false;
                selectScenarioButtonDisabled.value = false;
                createScenarioButtonDisabled.value = false;
            })

            emitter.on('scenarioSelectedControllers', (data) => {
                scenario = data.scenario;
                paintScenario();                
                selectScenarioButtonDisabled.value = true;
            })
            
            client.subscribe("mobileApp/dashboardControllers/disconnect");
            client.subscribe("mobileApp/dashboardControllers/direction");
            client.subscribe("mobileApp/dashboardControllers/drop");
            client.subscribe("autopilotService/mobileApp/telemetryInfo");

            client.on('message', (topic, message) => {
                console.log(topic)
                if(topic=="autopilotService/mobileApp/telemetryInfo"){                    
                    let telemetryInfo = JSON.parse(message);
                    console.log(telemetryInfo);
                    practicePointLat = telemetryInfo.lat;
                    practicePointLong = telemetryInfo.lon;
                    practicePoint = [practicePointLat, practicePointLong];
                    paintDrone();
                    buttonsDisabled.value = true;
                    selectScenarioButtonDisabled.value = true;
                    createScenarioButtonDisabled.value = true;                                        
                    if(playersPolygonsCoord.length>0){
                        let insidePlayer = false;
                        for(let i = 0; i<numPlayers.value; i++){
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
                    if(telemetryInfo.state == 'onHearth'){
                        home.value = true;
                        flying.value = false;
                    }
                    if(telemetryInfo.state == 'flying'){
                        flying.value = true;
                        home.value = false;
                    }
                    
                }
                else if(topic == "mobileApp/dashboardControllers/direction"){
                    direction = message;                    
                }
                else if(topic == "mobileApp/dashboardControllers/drop"){
                    if(inside(practicePoint,finalBase)){
                        Swal.fire("Mission Accomplished! :)")
                    }
                    else{
                        Swal.fire("Mission failed... :(")
                    }                    
                    client.publish('dashboardControllers/mobileApp/drop','')                    
                }
                else if(topic == "mobileApp/dashboardControllers/disconnect"){
                    clear();
                    players.value = [];
                    numPlayers.value = 0;
                    client.publish('mobileApp/autopilotService/disconnect');
                    client.publish('dashboardControllers/mobileApp/disconnect');
                    //client.unsubscribe("autopilotService/mobileApp/telemetryInfo");
                    selectScenarioButtonDisabled.value = true;
                    createScenarioButtonDisabled.value = true;
                }
            })
        })

        

        function onMapClick(e){       
            console.log(actualPlayer.value)
            console.log(numPlayers.value)    
           if(inside([e.latlng.lat, e.latlng.lng], droneLabLimits) && actualPlayer.value<numPlayers.value-1 && players.value.length>1 && creatingScenario.value == true){
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
                                
                if(tmpLine!=undefined){
                    tmpLine.remove(map); //borrem la linea anterior abans de dibuixar la nova, pk no es quedi tot ple de linees
                }
                tmpLine = leaflet.polyline([last,e.latlng], {color: 'red'}).addTo(map); //guardo la linea
            }
        }

        function onRightClick(){
            if(actualPlayer.value<numPlayers.value-1 && players.value.length>1  && creatingScenario.value == true){                     
            /* let a = true;
            if(a){ */
                let color;                
                if(waypoints.value.length>=4){                    
                    if(!polygonsIntersect()){        
                        if(actualPlayer.value == 0){
                            nextPlayerDisabled.value = false;                                    
                        }                         
                        playersPolygons.push(leaflet.polygon(waypoints.value, {color: playerColors[actualPlayer.value]}).addTo(map));                        
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
            createScenario.value = false;
            selectScenarioButtonDisabled.value = false;
            createScenarioButtonDisabled.value = false;
            buttonFinishDisabled.value = true;
            map.eachLayer((layer) => { //recorre el mapa per anar borrant tot el que hem ficat, pero només si son waypoints o lines
                if(layer['_latlng']!=undefined) //waypoint
                    layer.remove();
                if(layer['_path']!=undefined) //line
                    layer.remove();
            });
            leaflet.polygon(droneLabLimits, {color: 'white'}).addTo(map);
        }

        function nextPlayer(){
            actualPlayer.value = actualPlayer.value + 1;            
            playersPolygonsCoord.push(actualPlayerPolygon);
            nextPlayerDisabled.value = true;            
            if(actualPlayer.value == numPlayers.value-1){
                actualPlayerPolygon = [droneLabLimits];                
                for(let i = 0; i<numPlayers.value-1; i++){                                
                    for(let j = 0; j<playersPolygonsCoord[i].length ; j++){
                        actualPlayerPolygon.push(playersPolygonsCoord[i][j])    
                    }
                }
                playersPolygonsCoord.push(actualPlayerPolygon);
                playersPolygons.push(leaflet.polygon(playersPolygonsCoord[numPlayers.value-1], {color: playerColors[actualPlayer.value]}).addTo(map));
                for(let i = 0; i<numPlayers.value-1; i++){
                    playersPolygons.push(leaflet.polygon(playersPolygonsCoord[i], {color: playerColors[i]}).addTo(map));
                }
                finalBasePolygon.remove(map);
                leaflet.polygon(finalBase, {color: '#D301F9', fillColor: '#D301F9', fillOpacity: 0.5}).addTo(map);               
                buttonFinishDisabled.value = false;
                Swal.fire('Sector set for player: '+players.value[actualPlayer.value]);   
            }
            else{
                Swal.fire('Set sectors for player: '+players.value[actualPlayer.value]);   
            }              

            actualPlayerPolygon = [];
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
                        let topic = "dashboardControllers/mobileApp/"+players.value[i]+"/startPractice";
                        let last = false;
                        if(i==players.value.length -1){
                            last = true;
                        }
                        console.log(creatingScenario.value);
                        let message = sectorToJSON(playersPolygonsCoord[i], i, !creatingScenario.value, last);
                        console.log(message);
                        client.publish(topic, message);                                           
                    }  
                    startMoving()   
                    
                    creatingScenario.value = false;
                    buttonsDisabled.value = true;
                    selectScenarioButtonDisabled.value = true;
                    createScenarioButtonDisabled.value = true;
                    buttonFinishDisabled.value = true;
                    sectorsButtonsShowing.value = false;
                    finishPracticeButtonShowing.value = true;                                    
                }
            })
        }

        function sectorToJSON(sectorsPlayer, indexColor, predeterminedScenario, last){
            let waypoint;
            let sectorJSON = {
                sector: [],
                color: playerColors[indexColor],
                scenario: predeterminedScenario,
                last: last,
                dronePosition: practicePoint
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

        function selectScenario(){
            createScenarioButtonDisabled.value = true;
            scenariosShowing.value = true;
        }

        function createScenario(){
            creatingScenario.value = true;
            selectScenarioButtonDisabled.value = true;
            Swal.fire('Set sectors for player: '+players.value[actualPlayer.value]);
        }

        function paintScenario(){
            if(numPlayers.value == 4){
                if(scenario == '1'){
                    playersPolygonsCoord = Array.from(scenario4p1);
                }
                else if(scenario == '2'){
                    playersPolygonsCoord = Array.from(scenario4p2);
                }   
                else{
                    playersPolygonsCoord = Array.from(scenario4p3);
                }
            }
            else if(numPlayers.value == 3){
                if(scenario == '1'){
                    playersPolygonsCoord = Array.from(scenario3p1);
                }
                else if(scenario == '2'){
                    playersPolygonsCoord = Array.from(scenario3p2);
                }   
                else{
                    playersPolygonsCoord = Array.from(scenario3p3);
                }
            }
            else if(numPlayers.value == 2){
                if(scenario == '1'){
                    playersPolygonsCoord = Array.from(scenario2p1);
                }
                else if(scenario == '2'){
                    playersPolygonsCoord = Array.from(scenario2p2);
                }   
                else{
                    playersPolygonsCoord = Array.from(scenario2p3);
                }
            }
                     
            for(let i = 0; i<numPlayers.value; i++){
                playersPolygons.push(leaflet.polygon(playersPolygonsCoord[i], {color: playerColors[i]}).addTo(map));
            } 
            finalBasePolygon.remove(map);
            leaflet.polygon(finalBase, {color: '#D301F9', fillColor: '#D301F9', fillOpacity: 0.5}).addTo(map);
            buttonFinishDisabled.value = false;
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

        
        function paintDrone(){
            quitDronePainting();
            
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
        

        function startMoving(){
            interval = setInterval(() => {
                movePoint();
            }, 1000);
        }

        function stopMoving(){
            clearInterval(interval);
        }

        const R = 6378.1;
        const d1 = 0.0005;
        const d2 = 0.001;
        const d3 = 0.00075;
        let d;

        function movePoint(){
            let bearing = null;
            if (direction == "North"){
                bearing = 0;
                d = d1;
            }
            else if (direction == "South"){
                bearing = Math.PI;
                d = d1;
            }
            else if (direction == "East"){
                bearing = Math.PI/2;
                d = d2;
            }
            else if (direction == "West"){
                bearing = 3*Math.PI/2;
                d = d2;
            }
            else if (direction == "NorthWest"){
                bearing = 7*Math.PI/4;
                d = d3;
            }
            else if (direction == "NorthEast"){
                bearing = Math.PI/4;
                d = d3;
            }
            else if (direction == "SouthWest"){
                bearing = 5*Math.PI/4;
                d = d3;
            }
            else if (direction == "SouthEast"){
                bearing = 3*Math.PI/4;
                d = d3;
            }
            if (bearing != null){             

                let lat = practicePointLat*Math.PI/180;
                let lon = practicePointLong*Math.PI/180;

                practicePointLat = (Math.asin(
                    Math.sin(lat) * Math.cos(d / R)
                    + Math.cos(lat) * Math.sin(d / R) * Math.cos(bearing)
                ))*180/Math.PI;

                practicePointLong = (lon + Math.atan2(
                    Math.sin(bearing) * Math.sin(d / R) * Math.cos(lat),
                    Math.cos(d / R) - Math.sin(lat) * Math.sin(practicePointLat),
                ))*180/Math.PI;
                
            }
            if(inside([practicePointLat, practicePointLong], droneLabLimits)){
                practicePoint = [practicePointLat, practicePointLong];
                paintDrone();
                const message = {
                    lat: practicePointLat,
                    lon: practicePointLong
                }
                let messageJSON = JSON.stringify(message);
                client.publish("dashboardControllers/mobileApp/position", messageJSON)
            }
            
       }       

       function quitDronePainting(){
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
       }

       function finishPractice(){
        stopMoving();
        finishPracticeButtonShowing.value = false;
        startFlyingButtonShowing.value = true;
        client.publish('dashboardControllers/mobileApp/finishPractice','');        
        quitDronePainting();
       }

       function startFlying(){
        client.publish('dashboardControllers/mobileApp/startFlying','');
        client.subscribe('autopilotService/mobileApp/telemetryInfo');
        startFlyingButtonShowing.value = false;
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
            selectScenarioButtonDisabled,
            createScenarioButtonDisabled,
            scenariosShowing,
            numPlayers,
            finishPractice,
            sectorsButtonsShowing,
            finishPracticeButtonShowing,
            startFlying,
            startFlyingButtonShowing,
            flying,
            home
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