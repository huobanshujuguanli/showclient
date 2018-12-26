<template>
  <div :style="{width:100 + '%'}">
    <div :style="{height:300+'px',width:100+'%',float:'right'} " class="myChart" >
        <div id="weather" class="weather" >
          <iframe name="weather_inc" src="http://i.tianqi.com/index.php?c=code&id=13" width="650" height="221" frameborder="0" marginwidth="0" marginheight="0" scrolling="no"></iframe></div>
        <div class="run_info_div" :style="">
          <runinfo-show class="runInfoShow"></runinfo-show>
        </div>
    </div>
    <div :style="{width:100 + '%'}">
       <div :style="{height:420+'px',width:50+'%',float:'left'}">
         <div id="map" class="map" :style="{height:mapHeight+'px'}"></div>
       </div>
       <div :style="{height:420+'px',width:50+'%',float:'right'}">
         <div  id="myChart"  class="myChart" :style="{height:280+'px',width:100 + '%'}"></div>
         <div  id="barChart" class="myChart" :style="{height:280+'px',width:100 + '%'}"></div>
       </div>
   </div>






  </div>
</template>
  <script>
import {
  getDeviceMapListByCondition,
  getCityCodeByLatAndLng,
  getWeatherByAdCode
} from "@/api/device-map";
import runinfo from "@/views/controller-run-info";
import { config } from "@/config/index";
export default {
  name: "map-component",
  components: {
    runinfoShow: runinfo
  },
  props: {
    mapHeight: {
      type: Number,
      default: window.screen.height - 60
    },
    mapWidth: {
      type: Number,
      default: document.body.clientWidth - 130
    }
  },
  data() {
    return {
      center: { lng: 105, lat: 34 },
      mapPoints: [],
      enterpriseId: "",
      dialogFormVisible: false,
      flag: false,
      weatherLives: null,
      lives: {
        province: "",
        city: "",
        weather: "", //天气
        temperature: "", //气温
        winddirection: "", //风向
        windpower: "", //风力
        humidity: "", //空气湿度
        reporttime: "" //数据发布时间
      }
    };
  },
  mounted() {
    let map = new BMap.Map("map");
    let point = new BMap.Point(this.center.lng, this.center.lat);
    map.centerAndZoom(point, 6);
    map.enableScrollWheelZoom(true);
    map.enableDoubleClickZoom(true);
    this.loadMapData(map);
    this.drawLine();
  },
  methods: {
    getlocation() {
      //定位方法
      var map = new BMap.Map("weather");
      var point = new BMap.Point(116.331398, 39.897445);
      map.centerAndZoom(point, 12);
      var geolocation = new BMap.Geolocation();
      geolocation.getCurrentPosition(function(r) {
        if (this.getStatus() == BMAP_STATUS_SUCCESS) {
          var mk = new BMap.Marker(r.point);
          map.addOverlay(mk);
          map.panTo(r.point);
          alert("您的位置：" + r.point.lng + "," + r.point.lat);
        } else {
          alert("failed" + this.getStatus());
        }
      });
    },
    loadMapData(map) {
      this.enterpriseId = this.$store.state.user.orgId;

      getDeviceMapListByCondition({ enterpriseId: this.enterpriseId }).then(
        res => {
          this.showMapData(map, res.data.data);
        }
      );
    },
    showMapData(map, data) {
      this.mapPoints = data;
      let markers = [];
      for (let i = 0; i < this.mapPoints.length; i++) {
        if (
          this.mapPoints[i].longitude == null ||
          this.mapPoints[i].latitude == null
        ) {
          continue;
        }
        let points = new BMap.Point(
          this.mapPoints[i].longitude,
          this.mapPoints[i].latitude
        );
        let mk = new BMap.Marker(points);
        markers.push(mk);
        mk.addEventListener("click", () => {
          this.dialogFormVisible = true;
          this.flag = true;
          let location = points.lng + "," + points.lat;
          this.getWeatherInfo(location);
          this.$store.state.user.deviceRunInfoNo = this.mapPoints[i].deviceNo;
        });
      }
      new BMapLib.MarkerClusterer(map, { markers: markers });
    },
    getWeatherInfo(location) {
      //获得天气信息
      console.log(location);
      getCityCodeByLatAndLng(location).then(res => {
        let adcode = res.data.regeocode.addressComponent.adcode;
        getWeatherByAdCode(adcode).then(response => {
          const data = response.data.lives[0];
          this.weatherLives = data;
          this.lives.province = data.province;
          this.lives.city = data.city;
          this.lives.temperature = data.temperature;
          this.lives.weather = data.weather;
          this.lives.winddirection = data.winddirection;
          this.lives.windpower = data.windpower;
          this.lives.humidity = data.humidity;
          this.lives.reporttime = data.reporttime;
        });
    });
    },
    drawLine() {
      //绘制报表
      var dom = document.getElementById("myChart");
      let dom2 = document.getElementById("barChart");
      var myChart = this.$echarts.init(dom);
      let myChart2 = this.$echarts.init(dom2);
      let optionBar=null;
      optionBar = {
        title: {
          text: "报警统计"
        },
        color: ["#3398DB"],
        tooltip: {
          trigger: "axis",
          axisPointer: {
// 坐标轴指示器，坐标轴触发有效
            type: "shadow" // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true
        },
        xAxis: [
          {
            type: "category",
            data: [
              "燃烧器故障",
              "超压",
              "排烟温度高",
              "燃气泄漏",
              "极限低水位"
            ],
            axisTick: {
              alignWithLabel: true
            }
          }
        ],
        yAxis: [
          {
            type: "value"
          }
        ],
        series: [
          {
            name: "累计次数",
            type: "bar",
            barWidth: "60%",
            data: [5, 3, 7, 6, 9]
          }
        ]
      };
      var app = {};
      let option = null;
      option = {
        title: {
          text: "运行信息"
        },
        tooltip: {
          trigger: "axis"
        },
        legend: {
          data: ["排烟温度", "出水温度", "回水温度", "启炉压力", "停炉压力"]
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true
        },
        /*toolbox: {
          feature: {
            saveAsImage: {}
          }
        },*/
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        },
        yAxis: {
          type: "value"
        },
        series: [
          {
            name: "排烟温度",
            type: "line",
            stack: "℃",
            data: [120, 132, 101, 134, 90, 230, 210]
          },
          {
            name: "出水温度",
            type: "line",
            stack: "℃",
            data: [220, 182, 191, 234, 290, 330, 310]
          },
          {
            name: "回水温度",
            type: "line",
            stack: "℃",
            data: [150, 232, 201, 154, 190, 330, 410]
          },
          {
            name: "启炉压力",
            type: "line",
            stack: "MPa",
            data: [320, 332, 301, 334, 390, 330, 320]
          },
          {
            name: "停炉压力",
            type: "line",
            stack: "MPa",
            data: [820, 932, 901, 934, 1290, 1330, 1320]
          }
        ]
      };
      if (
        option &&
        typeof option === "object" &&
        (optionBar && typeof optionBar === "object")
      ) {
        myChart.setOption(option, true);
        myChart2.setOption(optionBar, true);
      };
    }
  }
};
</script>

<style>
.weather {
  width:44%;
  float: left;
  margin: 44px;

}
.run_info_div {
  float: right;
  width: 50%;
  height: 300px;

}
.runInfoShow {
  height: 100%;

  background-color: #f5f5f5;
  overflow-x: hidden;
  overflow-y: scroll;
}
.runInfoShow::-webkit-scrollbar {
  display: none;
}
.myChart {
  background-color: #f5f5f5;

}
</style>

