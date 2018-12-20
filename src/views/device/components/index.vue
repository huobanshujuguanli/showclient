<template>
  <div>
    <div  :style="{height:50+'%',width:50+'%',float:'left'}">
      <div id="map" class="map" :style="{height:mapHeight+'px'}"> </div>
      <el-dialog title="运行信息" :visible.sync="dialogFormVisible" :style="{width:100+'%'}"  v-dialogDrag    >
        <runinfo-show  :style="{height:500+'px'}"></runinfo-show>
      </el-dialog>
    </div>

    <div  id="weather" :style="{height:50+'%',width:50+'%',float:'left',background:'red'}">

    </div>
    <div  :style="{height:50+'%',width:50+'%',float:'left',background:'green'}">
    </div>
    <div  :style="{height:50+'%',width:50+'%',float:'left',background:'blue'}">
    </div>
  </div>

</template>
  <script>
  import {getDeviceMapListByCondition} from "@/api/device-map";
  import runinfo from '@/views/controller-run-info'
  export default {
    name:'map-component',
    components:{
      'runinfoShow':runinfo
    },
    props:{
      mapHeight:{
        type:Number,
        default:document.body.clientHeight/2
      }
    },
    data() {
      return {
        center: {lng: 105, lat: 34},
        mapPoints:[],
        enterpriseId:'',
        dialogFormVisible: false,
      }
    },
    mounted() {
      let map = new BMap.Map('map');
      let point = new BMap.Point(this.center.lng, this.center.lat);
      map.centerAndZoom(point, 6);
      map.enableScrollWheelZoom(true);
      map.enableDoubleClickZoom(true);
      this.loadMapData(map)
    },
    methods: {
      getlocation(){
        var map = new BMap.Map("weather");
        var point = new BMap.Point(116.331398,39.897445);
        map.centerAndZoom(point,12);
        var geolocation = new BMap.Geolocation();
        geolocation.getCurrentPosition(function(r){
          if(this.getStatus() == BMAP_STATUS_SUCCESS){
            var mk = new BMap.Marker(r.point);
            map.addOverlay(mk);
            map.panTo(r.point);
            alert('您的位置：'+r.point.lng+','+r.point.lat);
          }
          else {
            alert('failed'+this.getStatus());
          }
        });
      },
      loadMapData(map) {
        this.enterpriseId=this.$store.state.user.orgId;

        getDeviceMapListByCondition({enterpriseId:this.enterpriseId}).then((res)=>{

          this.showMapData(map,res.data.data)
        })
      },
      showMapData(map,data){

        this.mapPoints = data

        let markers = [];
        for (let i=0;i<this.mapPoints.length;i++) {
          if (this.mapPoints[i].longitude==null||this.mapPoints[i].latitude==null) {
            continue;
          }
          let points = new BMap.Point(this.mapPoints[i].longitude,this.mapPoints[i].latitude);
          let mk = new BMap.Marker(points);
          markers.push(mk);
          mk.addEventListener("click",()=>{
          this.dialogFormVisible=true;

            this.$store.state.user.deviceRunInfoNo=this.mapPoints[i].deviceNo

            /*window.open(process.env.BASE_API+'/device/index','_blank','width=700,height=350,fullscreen=1,scrollbars=0');
            let newWindow=openElectronWindow("/controller-run-info?controllerNo="+this.mapPoints[i].controllerNo,{width: 600, height: 500,title:"运行信息"})
            newWindow.on('closed', () => {
              newWindow = null
            })
            newWindow.setTitle("运行信息")*/
          })
        }
        new BMapLib.MarkerClusterer(map, {markers:markers});
      }
    }
  }
</script>


