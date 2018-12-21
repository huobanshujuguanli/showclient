<template>
  <div>
    <div :style="{height:50+'%',width:50+'%',float:'left'}">
      <div id="map" class="map" :style="{height:mapHeight+10+'px',top:'10px',left:'10px'}"></div>
    </div>

    <div id="weather" class="weather" name="el-zoom-in-top" v-show="flag">
      <h4>城市：{{lives.province+lives.city}}</h4>
      <h5>温度：{{lives.temperature+"℃"}}</h5>
      <h5>天气：{{lives.weather}}</h5>
      <h5>风向：{{lives.winddirection}}</h5>
      <h5>风力：{{lives.windpower+"级"}}</h5>
      <h5>空气湿度：{{lives.humidity+"%RH"}}</h5>
    </div>
    <div v-show="flag" class="run_info_div" :style="{height:mapHeight/2+'px'}">
      <runinfo-show class="runInfoShow"></runinfo-show>
    </div>
    <div v-show="flag" id="myChart" :style="{height:mapHeight/2+'px'}"></div>
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
      default: document.body.clientHeight - 130
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
      var myChart = this.$echarts.init(dom);
      var app = {};
      var option = null;
      function randomData() {
        now = new Date(+now + oneDay);
        value = value + Math.random() * 21 - 10;
        return {
          name: now.toString(),
          value: [
            [now.getFullYear(), now.getMonth() + 1, now.getDate()].join("/"),
            Math.round(value)
          ]
        };
      }

      var data = [];
      var now = +new Date(1997, 9, 3);
      var oneDay = 24 * 3600 * 1000;
      var value = Math.random() * 1000;
      for (var i = 0; i < 1000; i++) {
        data.push(randomData());
      }

      option = {
        title: {
          text: "实时数据"
        },
        tooltip: {
          trigger: "axis",
          formatter: function(params) {
            params = params[0];
            var date = new Date(params.name);
            return (
              date.getDate() +
              "/" +
              (date.getMonth() + 1) +
              "/" +
              date.getFullYear() +
              " : " +
              params.value[1]
            );
          },
          axisPointer: {
            animation: false
          }
        },
        xAxis: {
          type: "time",
          splitLine: {
            show: false
          }
        },
        yAxis: {
          type: "value",
          boundaryGap: [0, "100%"],
          splitLine: {
            show: false
          }
        },
        series: [
          {
            name: "模拟数据",
            type: "line",
            showSymbol: false,
            hoverAnimation: false,
            data: data
          }
        ]
      };

      setInterval(function() {
        for (var i = 0; i < 5; i++) {
          data.shift();
          data.push(randomData());
        }

        myChart.setOption({
          series: [
            {
              data: data
            }
          ]
        });
      }, 1000);
      if (option && typeof option === "object") {
        myChart.setOption(option, true);
      }
    }
  }
};
</script>

<style>
.weather {
  width: 200px;
  height: 300px;
  top: 15px;
  left: 15px;
  position: absolute;
  z-index: 9999;
  background-color: transparent;
}
.run_info_div {
  float: right;
  width: 47.5%;
  margin-top: 10px;
  margin-right: 15px;
}
.runInfoShow {
  height: 100%;
  right: 15px;
  background-color: #f5f5f5;
  overflow-x: hidden;
  overflow-y: scroll;
}
.runInfoShow::-webkit-scrollbar {
  display: none;
}
#myChart {
  width: 47.5%;
  background-color: #f5f5f5;
  float: right;
  margin-top: 10px;
  margin-right: 15px;
}
</style>

