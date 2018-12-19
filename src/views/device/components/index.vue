<template>
  <div class="map-container">
    <div id="map" class="map" :style="{height:mapHeight+'px'}"> </div>
      <el-dialog title="运行信息" :visible.sync="dialogFormVisible"  v-dialogDrag  :style="{height:600+'px'}"  >
        <runinfo-show></runinfo-show>
      </el-dialog>
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
        default:document.body.clientHeight-88
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

<style rel="stylesheet/scss" lang="scss">
  .map-container{
    .map{
      width: 100%;
    }
  }
</style>
