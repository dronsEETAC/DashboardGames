<template>
    <div>
      <b-button variant="info" @click="arm">Connect</b-button>
      <b-button variant="success" @click="takeoff">Take off</b-button>
      <b-button variant="warning" @click="goToWaypoint">Go to waypoint</b-button>
      <b-button variant="danger" @click="rtl">RTL</b-button>
    </div>
  </template>
  
  <script>
  import { onMounted, defineComponent, ref, inject } from 'vue';
  import Swal from 'sweetalert2'
  
  export default defineComponent({
    

    setup () {
      const emitter = inject('emitter');
      let client = inject('mqttClient');
      let waypoints = [[41.2763088, 1.9882518],[41.2764448, 1.9882049],[41.2765214, 1.9886005],[41.2765960, 1.9890350],[41.2764952, 1.9890685],[41.2763571, 1.9891343],[41.2762735, 1.9887453],[41.2761858, 1.9883336],[41.2763692, 1.9885804],[41.2764201, 1.9892127],[41.2764861, 1.9880600],[41.2762412, 1.9885468]]
      let index = 0;
      let droneLabLimits = [[41.2762029, 1.9883457],[41.2764307, 1.9882290],[41.2765738, 1.9890122],[41.2763682, 1.9891074]]; //començo vaig a l'esquerra, dalt esquerra, dalt dreta, baix dreta
      //recta 1: y = mx + n; 41.2762049 = m1.9883443 + n; 41.2764327= m1.9882290 + n; -0,0002278 = 0,0001153m; m = -1,9757155247181266261925; n = 37,34825779800520381613191;
      
      let recta01m = (droneLabLimits[0][0]-droneLabLimits[1][0])/(droneLabLimits[0][1]-droneLabLimits[1][1]);
      let recta01n = droneLabLimits[0][0] - recta01m*droneLabLimits[0][1];

      let recta12m = (droneLabLimits[1][0]-droneLabLimits[2][0])/(droneLabLimits[1][1]-droneLabLimits[2][1]);
      let recta12n = droneLabLimits[1][0] - recta12m*droneLabLimits[1][1];

      let recta23m = (droneLabLimits[2][0]-droneLabLimits[3][0])/(droneLabLimits[2][1]-droneLabLimits[3][1]);
      let recta23n = droneLabLimits[2][0] - recta23m*droneLabLimits[2][1];

      let recta30m = (droneLabLimits[3][0]-droneLabLimits[0][0])/(droneLabLimits[3][1]-droneLabLimits[0][1]);
      let recta30n = droneLabLimits[3][0] - recta30m*droneLabLimits[3][1];

      function arm(){
        client.publish('dashboardFollowme/autopilotService/connect');
      }
  
      function takeoff(){
        client.publish('dashboardFollowme/autopilotService/armAndTakeoff')
      }
  
      function goToWaypoint(){    
                     
        let waypoint = waypoints[index];
        let newRectam;
        let newRectan;
        let sector;
        let intersectionWaypoint;
        let newlat;
        let newlon;
        if(waypoint[0]<(recta01m*waypoint[1]+recta01n)){
          if(waypoint[0]>(recta12m*waypoint[1]+recta12n)){
            sector = 2;
            intersectionWaypoint = droneLabLimits[1];
          }
          else if(waypoint[0]<(recta30m*waypoint[1]+recta30n)){
            sector = 8;
            intersectionWaypoint = droneLabLimits[0];
          }
          else{
            sector = 1;
            newRectam = -1/recta01m;
            newRectan = waypoint[0]-newRectam*waypoint[1];
            newlon = (newRectan-recta01n)/(recta01m-newRectam);
            newlat = recta01m*newlon + recta01n;
            intersectionWaypoint = [newlat, newlon];
          }
        }
        else if(waypoint[0]>(recta23m*waypoint[1]+recta23n)){
          if(waypoint[0]>(recta12m*waypoint[1]+recta12n)){
            sector = 4;
            intersectionWaypoint = droneLabLimits[2];
          }
          else if(waypoint[0]<(recta30m*waypoint[1]+recta30n)){
            sector = 6;
            intersectionWaypoint = droneLabLimits[3];
          }
          else{
            sector = 5;
            newRectam = -1/recta23m;
            newRectan = waypoint[0]-newRectam*waypoint[1];
            newlon = (newRectan-recta23n)/(recta23m-newRectam);
            newlat = recta23m*newlon + recta23n;
            intersectionWaypoint = [newlat, newlon];
          }
        }
        else if(waypoint[0]>(recta12m*waypoint[1]+recta12n)){
          sector = 3;
          newRectam = -1/recta12m;
          newRectan = waypoint[0]-newRectam*waypoint[1];
          newlon = (newRectan-recta12n)/(recta12m-newRectam);
          newlat = recta12m*newlon + recta12n;
          intersectionWaypoint = [newlat, newlon];
        }
        else if(waypoint[0]<(recta30m*waypoint[1]+recta30n)){
          sector = 7;
          newRectam = -1/recta30m;
          newRectan = waypoint[0]-newRectam*waypoint[1];
          newlon = (newRectan-recta30n)/(recta30m-newRectam);
          newlat = recta30m*newlon + recta30n;
          intersectionWaypoint = [newlat, newlon];
        }
        else if(inside(waypoint, droneLabLimits)){
          sector = 0;
          intersectionWaypoint = waypoint;
        }
        else {
          sector = -1;
        }

        if(sector!=-1){
          let heading;
          if(sector!=0){
            let headingCos = (180/Math.PI)*Math.acos((waypoint[0]-intersectionWaypoint[0])/Math.sqrt(Math.pow((waypoint[0]-intersectionWaypoint[0]),2)+Math.pow((waypoint[1]-intersectionWaypoint[1]),2)));
            let headingSin = (180/Math.PI)*Math.asin((waypoint[1]-intersectionWaypoint[1])/Math.sqrt(Math.pow((waypoint[0]-intersectionWaypoint[0]),2)+Math.pow((waypoint[1]-intersectionWaypoint[1]),2)));
            
            if(waypoint[1]-intersectionWaypoint[1] > 0){ // 0 a 180
              heading = headingCos;
            }
            else if(waypoint[1]-intersectionWaypoint[1] < 0){ // 180 a 360
              heading = 360 - headingCos;
            } 
          }
          else{
            heading = 0;
          }
          

          let waypointJSON = {    
            waypoint:{
              lat: intersectionWaypoint[0],
              lon: intersectionWaypoint[1]
            },   
            heading: heading           
          }
          client.publish('dashboardFollowme/autopilotService/goToWaypoint',JSON.stringify(waypointJSON))
          console.log(waypointJSON);     
          console.log(sector);     
        }
        index = index + 1;
        

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

        function rtl(){
          client.publish('dashboardFollowme/autopilotService/connect')
        }
  
      return {
        arm,
        takeoff,
        goToWaypoint,
        rtl
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
    .myButtonConnect {
      width : 900px;
      color : white;
      margin-top: 1%;
      margin-bottom: 1%;
    }
  
  </style>
  