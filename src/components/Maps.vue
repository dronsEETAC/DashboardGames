<template>
    <div class="popup">
        <div class="popup-inner">
            <div id="map"></div>
            <b-button style="width:20%; margin-left:20%" @click="close" variant="danger" size="lg">Close</b-button>
        </div>
    </div>
</template>

<script>
import {ref, onMounted } from 'vue'
import leaflet from 'leaflet'

export default {
    setup (props,context) {

        let map;

        onMounted (() => {
             map = leaflet.map('map').setView([41.276486, 1.9886], 19); //coordenadas del campus, es posa en un objecte amb id 'map' que posem a la div, el 19 i el maxZoom es per allunyar i apropar
             leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                 maxZoom: 19,
                 attribution: '© OpenStreetMap'
             }).addTo(map);             
        })

        function close(){
            context.emit('close');
        }

        return {
            close
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
</style>