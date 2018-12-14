<template>
  <div class="app-container">
    <!--设备列表-->
    <el-table :data="list" v-loading="listLoading" element-loading-text="给我一点时间" border fit highlight-current-row style="width: 120%" @row-contextmenu="openTableMenu">
      <el-table-column align="left" :show-overflow-tooltip="true" label="设备编号">
        <template slot-scope="scope">
          <span>{{scope.row.deviceNo}}</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true"  label="所属客户">
        <template slot-scope="scope">
          <span v-for="item in customerOption" v-if="scope.row.deviceSuffix.substring(0,5)==item.value">{{item.label}}</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true" label="设备类型">
        <template slot-scope="scope">
          <span>{{scope.row.deviceType}}</span>
        </template>
      </el-table-column>>
      <el-table-column align="left" :show-overflow-tooltip="true"  label="创建时间">
        <template slot-scope="scope">
          <span>{{scope.row.importDatetime}}</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true"  label="地址">
        <template slot-scope="scope">
          <span v-if="scope.row.province||scope.row.city||scope.row.district||scope.row.street">{{scope.row.province}}{{scope.row.city}}{{scope.row.district}}{{scope.row.street}}</span><span v-else>无</span>
        </template>
      </el-table-column>
    </el-table>
    <el-row class="app-query">
      <el-row>
        <el-button @click="handleCreate" type="primary" icon="el-icon-edit">新增</el-button>
      </el-row>
    </el-row>
    <menu-context ref="menuContext">
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
        <el-form :rules="rules" ref="deviceFormData" :model="deviceFormData" label-position="right" label-width="80px" style='width: 90%; margin-left:15px;'>
          <el-row>
            <el-col :span="12">
              <el-form-item label="设备编号" prop="deviceNo">
                <el-input v-model="deviceFormData.deviceNo"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属企业" prop="enterpriseId">
                <el-select clearable class="filter-item" v-model="deviceFormData.enterpriseId"  style="width: 100%;">
                  <el-option v-for="item in enterpriseOption" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="设备类型" prop="deviceType">
                <el-select class="filter-item" v-model="deviceFormData.deviceType"  style="width: 100%">
                  <el-option v-for="item in deviceTypeOption" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建时间" prop="importDatetime">
                <el-date-picker type="datetime" v-model="deviceFormData.importDatetime" :default-value="new Date()" style="width: 100%;" default-time="00:00:00"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="地址" prop="address">
                <el-input v-model="deviceFormData.address" readonly></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <el-row style=" overflow-x: hidden;">
          <div id="product_map" :style="{width:mapWidth+'px',height:mapHeight+'px'}" class="product_map"></div>
        </el-row>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="updateData" v-if="deviceFormData.id">确认</el-button>
          <el-button type="primary" @click="insertManyData" v-else>确认</el-button>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
  import {fuelArray,mediumArray} from '@/utils/common'
  import {formatDateTime} from '@/utils/date'
  import {pad} from '@/utils/common'
  import {getDeviceListByConditionAndPage,insertManyDevice,updateManyDeviceNo,editDevice,deleteDeviceById} from '@/api/device'
  import {getEnterpriseListByCondition} from '@/api/enterprise'
  import {getCustomerOrEnterpriseList} from '@/api/token-dict'
  import {getDeviceTypeList} from '@/api/device-type'
  import {getDeviceMapListByConditionAndPage} from '@/api/device-map'
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
    name: 'product_map',
    data() {
      const validateEnterpriseFun = (rule, value, callback) => {
        if (!value) {
          callback(new Error('所属企业不能为空'))
        } else {
          callback()
        }
      }
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
        mapWidth:document.body.clientWidth,
        mapHeight:document.body.clientHeight-88,
        list: null,
        listQuery: {
          total:50,
          pageNum:1,
          pageSize:5,
          deviceNo:null,
          enterpriseId:this.$store.state.user.orgId,
          deviceType:null,
          importDatetime:null,
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
          controllerNo:'',
          isSell:1,//售出的状态
          boilerCustomerId:null,
          boilerCustomerName:null,
          saleDate:'',
          saleAddress:'',
          id:'',
          deviceNo:'',
          enterpriseId:'',
          deviceType:'',
          importDatetime:'',
          longitude:'',
          latitude:'',
          province:'',
          city:'',
          district:'',
          street:'',
          address: ''
        },
        rules: {
          enterpriseId: [{required: true,trigger: 'blur',validator: validateEnterpriseFun }],
          deviceType: [{required: true,  trigger: 'blur',validator: validateDeviceTypeFun }],
          deviceNo: [{required: true, trigger: 'blur',validator: validateDeviceNoFun}],
          importDatetime: [{ required: true, message: '创建时间不能为空', trigger: 'blur' }],
          address: [{ required: true,trigger: 'blur', message: '售出地址不能为空' }]
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
        encryptionFormData:{
          encryptionDeviceStr:''
        },
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
    mounted() {
      // 百度地图API功能
      let map = new BMap.Map("product_map");
      let centerPoint = new BMap.Point(110, 38);
      map.centerAndZoom(centerPoint,4.5);
      map.enableScrollWheelZoom(true);
      map.enableInertialDragging();
      map.enableContinuousZoom();
      let size = new BMap.Size(10, 20);
      map.addControl(new BMap.CityListControl({
        anchor: BMAP_ANCHOR_TOP_LEFT,
        offset: size,
      }));
      this.loadMap(map)
      this.selectPoint(map)
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
      initCustomerList(){
        let customerOption=[]
        getCustomerOrEnterpriseList(2).then(data=>{
          data.data.data.forEach(item=>{
            customerOption.push({value:item.code+"",label:item.name})
          })
          this.customerOption=customerOption
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
      handleFilter() {
        this.listQuery.pageNum = 1
        this.getList()
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
          enterpriseId:'',
          media:'',
          power:'',
          deviceType:'',
          status:0,
          runStatus:0,
          importDatetime:new Date(),
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
          this.$refs['deviceFormData'].clearValidate()
        })
      },
      handleEncryptionDevice(row) {
        this.encryptionFormData = Object.assign({}, row) // copy obj
        this.dialogEncryptionFormVisible = true
        this.$nextTick(() => {
          this.$refs['encryptionForm'].clearValidate()
        })
      },
      handleGenerateQRCode(){
        this.qRCodeFormData.startSuffix=''
        this.qRCodeFormData.endSuffix=''
        this.dialogQRCodeFormVisible = true
        this.$nextTick(() => {
          this.$refs['qRCodeForm'].clearValidate()
        })
      },
      handleUpdate(row) {
        this.deviceFormData = Object.assign({}, row)
        if(this.deviceFormData.saleDatetime){
          this.deviceFormData.saleDatetime=new Date(this.deviceFormData.saleDatetime)
        }
        if(this.deviceFormData.importDatetime){
          this.deviceFormData.importDatetime=new Date(this.deviceFormData.importDatetime)
        }
        this.dialogStatus = 'update'
        this.dialogFormVisible = true
        this.$nextTick(() => {
          this.$refs['deviceFormData'].clearValidate()
        })
      },
      encryptionDevice() {
        if(this.encryptionFormData.encryptionDeviceStr){
          let data=filter_array(this.encryptionFormData.encryptionDeviceStr.split("\n"))
          let deviceList=[];
          data.forEach(item=>{
            deviceList.push({deviceSuffix:item.substring(0,item.indexOf("-")),deviceNo:item.substring(item.indexOf("-")+1,item.length)})
          })
          updateManyDeviceNo(deviceList).then(data=>{
            this.dialogEncryptionFormVisible = false
            this.$message({
              message: data.data.msg,
              type: 'success'
            });
            this.getList()
          })
        }else{

        }
      },
      generateQRCode(){
        this.$refs.qRCodeForm.validate(valid => {
          if (valid) {
            this.dialogQRCodeFormVisible = false
            window.open(process.env.BASE_API+'/device/generateqrcode?startSuffix='+this.qRCodeFormData.startSuffix+'&endSuffix='+this.qRCodeFormData.endSuffix, "_blank");
          } else {
            return false
          }
        })
      },
      calculateStartSuffixAndEndSuffix(){
        if(this.deviceFormData.startDeviceSuffix&&this.deviceFormData.startDeviceSuffix.length==10){
          this.deviceFormData.endDeviceSuffix=this.deviceFormData.startDeviceSuffix.substring(0,5)+pad(Number(this.deviceFormData.startDeviceSuffix.substring(5,10))+50,5)
        }
      },
      dealDate(){
        if(this.deviceFormData.saleDatetime){
          this.deviceFormData.saleDatetime=formatDateTime(this.deviceFormData.saleDatetime,"yyyy-MM-dd hh:mm:ss")
        }
        if(this.deviceFormData.importDatetime){
          this.deviceFormData.importDatetime=formatDateTime(this.deviceFormData.importDatetime,"yyyy-MM-dd hh:mm:ss")
        }
      },
      insertManyData(){
        this.$refs.deviceFormData.validate(valid => {
          if (valid) {
            this.dealDate()
            let deviceNoPrefix=this.deviceFormData.startDeviceSuffix.substring(0,5)
            let startNum=Number(this.deviceFormData.startDeviceSuffix.substring(5,10))
            let endNum=Number(this.deviceFormData.endDeviceSuffix.substring(5,10))
            delete this.deviceFormData.startDeviceSuffix
            delete this.deviceFormData.endDeviceSuffix
            let deviceList=[];
            while (startNum<=endNum){
              let deviceFormData=Object.assign({}, this.deviceFormData)
              deviceFormData.areaId=100101001
              deviceFormData.manufacturerId=1
              deviceFormData.devicePrefix=1
              deviceFormData.deviceSuffix=deviceNoPrefix+pad(startNum,5)
              deviceFormData.deviceNo=deviceNoPrefix+pad(startNum,5)
              deviceList.push(deviceFormData)
              startNum++
            }
            insertManyDevice(deviceList).then(data=>{
              this.dialogFormVisible = false
              this.$message({
                message: data.data.msg,
                type: 'success'
              });
              this.getList()
            })
          } else {
            return false
          }
        })
      },
      updateData(){
        this.$refs.deviceFormData.validate(valid => {
          this.dealDate()
          editDevice(this.deviceFormData).then(data=>{
            this.dialogFormVisible = false
            this.$message({
              message: "成功",
              type: 'success'
            });
            this.getList()
          })
        })
      },
      handleDelete(row) {
        this.$confirm('确认删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          deleteDeviceById(row.id).then(data=>{
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
      loadMap(map){
        let productMapData=JSON.parse(this.deviceFormData)
        this.deviceFormData.id=productMapData.id
        this.deviceFormData.deviceNo=productMapData.deviceNo
        this.deviceFormData.longitude=productMapData.longitude
        this.deviceFormData.latitude=productMapData.latitude
        this.deviceFormData.province=productMapData.province
        this.deviceFormData.city=productMapData.city
        this.deviceFormData.district=productMapData.district
        this.deviceFormData.street=productMapData.street
        let province=productMapData.province||"";
        let city=productMapData.city||"";
        let district=productMapData.district||"";
        let street=productMapData.street||"";
        let saleAddrss=province+city+district+street
        this.deviceFormData.address=saleAddrss==0?"":saleAddrss
        let selectPoint = new BMap.Point(this.deviceFormData.longitude, this.deviceFormData.latitude);
        let marker = new BMap.Marker(selectPoint);
        marker.addEventListener("click",()=>{
          let newWindow=openElectronWindow("/controller-run-info?controllerNo="+this.productMapData.controllerNo,{width: 600, height: 500})
          newWindow.on('closed', () => {
            newWindow = null
          })
        })
        map.addOverlay(marker);
      },
      selectPoint(map){
        let menu = new BMap.ContextMenu();
        let self=this;
        let longitude;
        let latitude;
        map.addEventListener("rightclick", function(e){
          longitude=e.point.lng
          latitude=e.point.lat
        });
        let txtMenuItem = [
          {
            text:'标注',
            callback:function(e){
              clearMapData()
              self.deviceFormData.longitude=longitude
              self.deviceFormData.latitude=latitude
              let selectPoint = new BMap.Point(self.deviceFormData.longitude, self.deviceFormData.latitude);
              let marker = new BMap.Marker(selectPoint);
              map.addOverlay(marker);
              let geoc = new BMap.Geocoder();
              geoc.getLocation(selectPoint, function (rs) {
                let addComp = rs.addressComponents;
                if(addComp.province&&addComp.city&&addComp.district){
                  self.deviceFormData.province=addComp.province;
                  self.deviceFormData.city=addComp.city;
                  self.deviceFormData.district=addComp.district;
                  self.deviceFormData.saleAddress=addComp.province+addComp.city+addComp.district
                }
                if(addComp.street){
                  self.deviceFormData.street=addComp.street;
                  self.deviceFormData.saleAddress+=addComp.street
                }
              });
            }
          },
          {
            text:'清除',
            callback:function(){
              clearMapData()
            }
          }
        ]
        function clearMapData() {
          map.clearOverlays();
          self.deviceFormData.longitude=''
          self.deviceFormData.latitude=''
          self.deviceFormData.province=''
          self.deviceFormData.city=''
          self.deviceFormData.district=''
          self.deviceFormData.street=''
          self.deviceFormData.saleAddress=''
        }
        for(let i=0; i < txtMenuItem.length; i++){
          menu.addItem(new BMap.MenuItem(txtMenuItem[i].text,txtMenuItem[i].callback,100));
        }
        map.addContextMenu(menu);
      },
    }
  }
</script>
<style>
  .el-button+.el-button {
    margin-left: 0px;
  }
</style>
