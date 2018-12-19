<template>
  <div class="app-container">
    <el-row class="app-query">
      <el-input clearable v-model="listQuery.deviceNo" placeholder="设备编号"  style="width: 500px;"></el-input>
      <el-button  type="primary" icon="el-icon-search" @click="handleFilter">查询</el-button>
      <el-button @click="handleCreate" type="primary" icon="el-icon-edit">新增</el-button>
    </el-row>
    <!--设备列表-->
    <el-table :data="list" v-loading="listLoading" element-loading-text="给我一点时间" border fit highlight-current-row style="width: 120%" @row-contextmenu="openTableMenu">
      <el-table-column align="left" :show-overflow-tooltip="true" label="设备编号">
        <template slot-scope="scope">
          <span>{{scope.row.deviceNo}}</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true"  label="所属企业">
        <template slot-scope="scope">
          <span v-for="item in enterpriseOption" v-if="item.value==scope.row.enterpriseId">{{item.label}}</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true" label="设备类型">
        <template slot-scope="scope">
          <span>{{scope.row.deviceType}}</span>
        </template>
      </el-table-column>>
      <el-table-column align="left" :show-overflow-tooltip="true"  label="创建时间">
        <template slot-scope="scope">
          <span v-if="scope.row.createDateTime">{{scope.row.createDateTime}}</span>
          <span v-if="scope.row.createDateTime==null">无</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true"  label="地址">
        <template slot-scope="scope">
          <span v-if="scope.row.address">{{scope.row.address}}</span><span v-else>无</span>
        </template>
      </el-table-column>
    </el-table>
    <menu-context ref="menuContext">
      <menu-context-item @click="handleUpdate">编辑</menu-context-item>
      <menu-context-item @click="handleDelete">删除</menu-context-item>
    </menu-context>
    <!--分页-->
    <div class="pagination-container">
      <el-pagination background @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="listQuery.pageNum" :page-sizes="[5,10,15,20]" :page-size="listQuery.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="listQuery.total">
      </el-pagination>
    </div>
    <!--设备新增dialog-->
    <div class="el-dialog-device">
      <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="40%">
        <el-form :rules="rules" ref="deviceData" :model="deviceFormData" label-position="right" label-width="80px" style='width: 90%; margin-left:15px;'>
          <el-row>
            <el-col :span="12">
              <el-form-item label="设备编号" prop="deviceNo">
                <el-input v-model="deviceFormData.deviceNo"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="设备类型" prop="deviceType">
                <el-select class="filter-item" v-model="deviceFormData.deviceType"  style="width: 100%">
                  <el-option v-for="item in deviceTypeOption" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="创建时间" prop="createDateTime">
                <el-date-picker v-model="deviceFormData.createDateTime" type="datetime" :default-time="new Date()" default-time="00:00:00" style="width: 100%"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-form-item label="设备地址"></el-form-item>
          </el-row>
        </el-form>
        <el-row style=" overflow-x: hidden;">
          <baidu-map class="bm-view" :center="center" :zoom="zoom" :scroll-wheel-zoom="true" ak="http://api.map.baidu.com/api?v=2.0&ak=eqPZV35edaZZGefOIopjLNqTSj4qI89Y" ref="allMap" @ready="mapReady" @click="getClickInfo">
            <bm-city-list anchor="BMAP_ANCHOR_TOP_LEFT"></bm-city-list>
          </baidu-map>
        </el-row>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="updateData">确认</el-button>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
  import {formatDateTime} from '@/utils/date'
  import {getEnterpriseListByCondition} from '@/api/enterprise'
  import {getDeviceTypeList} from '@/api/device-type'
  import {getDeviceMapListByConditionAndPage,editDeviceMap,deleteDeviceMapById} from '@/api/device-map'
  import {BaiduMap,BmCityList,BmScale,BmNavigation,BmOverviewMap,BmMarker,BmControl,BmView,BmAutoComplete,BmLocalSearch} from 'vue-baidu-map'
  /* 正数、负数、和小数*/
  function validateDeviceNo(textval) {
    const urlregex = /^[0-9]\d{9}$/
    return urlregex.test(textval)
  }
  /**
   * 过滤JS数组中的空值,假值等(es6语法)
   * @param array 需要过滤的数组
   * @returns {Array} []
   */
  function filter_array(array) {
    return array.filter(item=>item);
  }
  export default {
    name: 'deviceMap',
    components:{
      BaiduMap,
      BmCityList,
      BmScale,
      BmNavigation,
      BmOverviewMap,
      BmMarker,
      BmControl,
      BmView,
      BmAutoComplete,
      BmLocalSearch
    },
    data() {
      const validateDeviceTypeFun = (rule, value, callback) => {
        if (!value) {
          callback(new Error('设备类型不能为空'))
        }else{}
        callback()
      }
      const validateDeviceNoFun = (rule, value, callback) => {
        if (!value) {
          callback(new Error('编号不能为空'))
        } else if(!validateDeviceNo(value)) {
          callback(new Error('格式不正确（10位数的正整数，包括0）'))
        }else{}
        callback()
      }
      return {
        //百度地图
        center:{lng:0,lat:0},
        zoom:3,
        //设置定位
        locDialog:false,
        mapWidth:100,
        mapHeight:100,
        list: null,
        listQuery: {
          total:50,
          pageNum:1,
          pageSize:5,
          deviceNo:null,
          enterpriseId:this.$store.state.user.orgId,
          deviceType:null,
          createDateTime:formatDateTime(new Date(),"yyyy-MM-dd hh:mm:ss"),
          address:null
        },
        enterpriseOption:[],
        customerOption:[],
        isOrNotArray:[
          {value:1,label:'是'},
          {value:0,label:'否'}
        ],
        deviceTypeOption:[],
        textMap: {
          update: '编辑',
          create: '新增'
        },
        dialogStatus: '',
        dialogFormVisible: false,
        deviceFormData: {
          saleDate:'',
          deviceNo:'',
          enterpriseId:this.$store.state.user.orgId,
          deviceType:'',
          createDateTime:formatDateTime(new Date(),"yyyy-MM-dd hh:mm:ss"),
          longitude:'',
          latitude:'',
          province:'',
          city:'',
          district:'',
          street:'',
          address:'',
        },
        rules: {
          deviceType: [{required: true,  trigger: 'blur',validator: validateDeviceTypeFun }],
          deviceNo: [{required: true, trigger: 'blur',validator: validateDeviceNoFun}],
          createDateTime: [{ required: true, message: '创建时间不能为空', trigger: 'blur' }]
        },
        dialogQRCodeFormVisible:false,
        qRCodeFormData:{
          startSuffix:'',
          endSuffix:''
        },
        qRCodeRules: {
          startSuffix: [
            { required: true, message: '开始编号不能为空', trigger: 'blur' }
          ],
          endSuffix: [
            { required: true, message: '结束编号不能为空', trigger: 'blur' }
          ]
        },
        dialogEncryptionFormVisible:false,
        listLoading:false
      }
    },
    filters: {
      statusFilterLabel(status,dictaryList){
        return dictaryList.filter(item => {
          return item.value==status
        })
      }
    },
    created() {
      this.getList()
      this.initEnterpriseList()
      this.initDeviceTypeList()
    },
    methods: {
      initEnterpriseList(){
        let enterpriseOption=[]
        getEnterpriseListByCondition().then(data=>{
          data.data.data.forEach(item=>{
            enterpriseOption.push({value:item.id,label:item.enterpriseName})
          })
          this.enterpriseOption=enterpriseOption
        })
      },
      initDeviceTypeList(){
        let deviceTypeOption=[]
        getDeviceTypeList().then(data=>{
          data.data.data.forEach(item=>{
            deviceTypeOption.push({value:item.deviceType,label:item.deviceType})
          })
          this.deviceTypeOption=deviceTypeOption
        })
      },
      openTableMenu(row, event) {
        this.$refs.menuContext.openTableMenu(row,event);
      },
      getList() {
        this.listLoading = true
        getDeviceMapListByConditionAndPage(this.listQuery).then(response => {
          const data=response.data.data
          this.list=data.list
          this.listQuery.total=data.total
          this.listQuery.pageNum=data.pageNum
          this.listQuery.pageSize=data.pageSize
          this.listLoading = false
        })
      },
      resetTemp() {
        this.deviceFormData = {
          id:'',
          enterpriseId:this.$store.state.user.orgId,
          media:'',
          power:'',
          deviceType:'',
          status:0,
          runStatus:0,
          createDateTime:new Date(),
          startDeviceSuffix:'',
          endDeviceSuffix:'',
          /*onlineStates:0*/
        }
      },
      handleCreate() {
        this.resetTemp()
        this.dialogStatus = 'create'
        this.dialogFormVisible = true
        this.$nextTick(() => {
          this.$refs['deviceData'].clearValidate()
        })
      },
      dealDate(){
        if(this.deviceFormData.createDateTime){
          this.deviceFormData.createDateTime=formatDateTime(this.deviceFormData.createDateTime,"yyyy-MM-dd hh:mm:ss")
        }
      },

      updateData(){
        this.$refs.deviceData.validate(valid => {
          this.dealDate()
          editDeviceMap(this.deviceFormData).then(data=>{
            this.dialogFormVisible = false
            this.$message({
              message: "成功",
              type: 'success'
            });
            this.getList()
          })
        })
      },
      handleFilter() {
        this.listQuery.pageNum = 1
        this.getList()
      },
      handleUpdate(row) { //编辑功能
        this.deviceFormData = Object.assign({}, row) // copy obj
        if(this.deviceFormData.createDateTime){
          this.deviceFormData.createDateTime=new Date(this.deviceFormData.createDateTime)
        }else{
          this.deviceFormData.createDateTime=new Date()
        }
        this.dialogStatus = 'update'
        this.dialogFormVisible = true
        this.$nextTick(() => {
          this.$refs['deviceData'].clearValidate()
        })
      },
      handleDelete(row) { //删除功能
        this.$confirm('确认删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          deleteDeviceMapById(row.id).then(data=>{
            this.$message({
              message: '删除成功',
              type: 'success'
            });
            this.list.splice(this.list.indexOf(row), 1)
          })
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          });
        });
      },
      handleSizeChange(val) {
        this.listQuery.pageSize = val
        this.getList()
      },
      handleCurrentChange(val) {
        this.listQuery.pageNum = val
        this.getList()
      },      
      mapReady ({BMap, map}) {  // 百度地图
        this.center.lng = 116.404;
        this.center.lat = 39.915;
        this.zoom = 15;
        window.map = map;   //将map变量存储在全局
      },      
      getClickInfo (e) {  // 地图点击事件
        map.clearOverlays();
        let self = this
        let selectPoint = new BMap.Point(e.point.lng,e.point.lat)
        let marker = new BMap.Marker(selectPoint)
        map.addOverlay(marker)
        let geoc = new BMap.Geocoder();
        geoc.getLocation(selectPoint,function (rs) {
          let addComp = rs.addressComponents
          if(addComp.province&&addComp.city&&addComp.district){
            self.deviceFormData.province = addComp.province;
            self.deviceFormData.city = addComp.city;
            self.deviceFormData.district = addComp.district;
            self.deviceFormData.address = addComp.province+addComp.city+addComp.district
            if (addComp.street) {
              self.deviceFormData.street = addComp.street
              self.deviceFormData.address += addComp.street
            }
          }
        })
        self.deviceFormData.longitude = e.point.lng
        self.deviceFormData.latitude = e.point.lat
      }
    }
  }
</script>
<style>
  .el-button+.el-button {
    margin-left: 0px;
  }
  .bm-view {
    width: 100%;
    height:400px;
  }
</style>
