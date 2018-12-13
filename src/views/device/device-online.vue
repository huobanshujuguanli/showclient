<template>
  <div class="app-container">
    <el-row class="app-query">
      <el-input clearable v-model="listQuery.deviceSuffix" placeholder="设备编号"  style="width: 500px;"></el-input>
      <el-button  type="primary" icon="el-icon-search" @click="handleFilter">查询</el-button>
      <!--<el-button  type="primary" icon="el-icon-circle-plus-outline" @click="handleGenerateQRCode">生成二维码</el-button>-->
    </el-row>

    <el-table :data="list" v-loading="listLoading" element-loading-text="给我一点时间" border fit highlight-current-row style="width: 120%" @row-contextmenu="openTableMenu">
      <el-table-column align="left" :show-overflow-tooltip="true" label="设备编号">
        <template slot-scope="scope">
          <span>{{scope.row.deviceSuffix}}</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true"  label="所属客户">
        <template slot-scope="scope">
          <span>{{scope.row.customerName}}</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true" label="设备类型">
        <template slot-scope="scope">
          <span>{{scope.row.deviceType}}</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true" label="燃料">
        <template slot-scope="scope">
          <span v-if="scope.row.power!=null">
            <span v-for="item in fuelArray"  v-if="scope.row.power===item.value">{{item.label}}</span>
          </span>
          <span v-else>无</span>
        </template>
      </el-table-column>
      <el-table-column align="left" :show-overflow-tooltip="true" label="介质">
        <template slot-scope="scope">
          <span v-if="scope.row.media!=null">
            <span v-for="item in mediumArray"  v-if="scope.row.media===item.value">{{item.label}}</span>
          </span>
          <span v-else>无</span>
        </template>
      </el-table-column>


    </el-table>
    <menu-context ref="menuContext">
      <menu-context-item @click="handleUpdate">编辑</menu-context-item>
      <menu-context-item @click="handleDelete">删除</menu-context-item>
    </menu-context>
    <div class="pagination-container">
      <el-pagination
        background
        @current-change="handleCurrentChange"
        :current-page=pageNum
        :page-size=5
        layout="total,  prev, pager, next, jumper"
        :total=onlineList.length>
      </el-pagination>
    </div>
    <div class="el-dialog-device">
      <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="40%">
        <el-form ref="deviceFormData" :model="deviceFormData" label-position="right" label-width="80px" style='width: 90%; margin-left:15px;'>
          <el-row>
            <el-col :span="12">
              <el-form-item label="燃料">
                <el-select clearable class="filter-item" v-model="deviceFormData.power"  style="width: 100%">
                  <el-option v-for="item in fuelArray" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="介质">
                <el-select clearable class="filter-item" v-model="deviceFormData.media"  style="width: 100%">
                  <el-option v-for="item in mediumArray" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="设备类型">
                <el-select class="filter-item" v-model="deviceFormData.deviceType"  style="width: 100%">
                  <el-option v-for="item in deviceTypeOption" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="deviceFormData.id">
              <el-form-item label="是否销售">
                <el-select class="filter-item" v-model="deviceFormData.status"  style="width: 100%">
                  <el-option v-for="item in isOrNotArray" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="是否运行">
                <el-select class="filter-item" v-model="deviceFormData.runStatus"  style="width: 100%">
                  <el-option v-for="item in isOrNotArray" :key="item.value" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="deviceFormData.id">
              <el-form-item label="售出时间">
                <el-date-picker type="datetime" v-model="deviceFormData.saleDatetime" style="width: 100%;" default-time="00:00:00"></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="editData">确认</el-button>
        </div>
      </el-dialog>

    </div>
  </div>
</template>

<script>
  import {fuelArray,mediumArray} from '@/utils/common'
  import {formatDateTime} from '@/utils/date'
  import {getDeviceListByEnterpriseIdAndPage,editDevice,deleteDeviceById,getDeviceListByDeviceNo} from '@/api/device'
  import {getCustomerListByEnterpriseId} from '@/api/token-dict'
  import {getDeviceTypeList} from '@/api/device-type'
  import Vue from 'vue'
  import axios from 'axios'
  axios.defaults.baseURL = "http://output.sdcsoft.com.cn";
  Vue.prototype.$axios = axios;
  axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
  import qs from 'qs';
  Vue.prototype.qs = qs;
  export default {
    data() {
      return {
        list: null,
        pageNum:1,
        pageSize:5,
        listQuery: {
          deviceSuffix:null,
          customerNo:null,
          enterpriseId:this.$store.state.user.orgId,
          status:null,
          runStatus:null,
          /*      onlineStates:null,*/
          saleDatetime:null
        },
        customerOption:[],
        isOrNotArray:[
          {value:1,label:'是'},
          {value:0,label:'否'}
        ],
        /*   isOrbool:[
             {value:1,label:'✔'},
             {value:0,label:''}
           ],*/
        /*✖*/
        deviceTypeOption:[],
        textMap: {
          update: '编辑',
          create: '新增'
        },
        fuelArray:fuelArray,
        mediumArray:mediumArray,
        dialogStatus: '',
        dialogFormVisible: false,
        deviceFormData: {
          id:'',
          media:'',
          power:'',
          deviceType:'',
          status:1,
          runStatus:1,
          /*  onlineStates:0,*/
          saleDatetime:''
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
        deviceNoList:[],
        onlineList:[],
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
    mounted() {
      this.timerTask();
      /*    this.initCustomerList()
          this.initDeviceTypeList()*/
      /*    setInterval(this.timer, 5000);*/
    },
    methods: {
      /*   initCustomerList(){
           let customerOption=[]
           getCustomerListByEnterpriseId(this.listQuery.enterpriseId).then(data=>{
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
         },*/
      openTableMenu(row, event) {
        this.$refs.menuContext.openTableMenu(row,event);
      },
      handleFilter() {
        this.pageNum = 1
        var len = this.onlineList.length;
        var searchList = [];
        for(var i=0;i<len;i++){
          if(this.onlineList[i].indexOf(this.listQuery.deviceSuffix)>=0){
            searchList.push(this.onlineList[i]);
          }
        }
        this.onlineList=[];
        this.onlineList=searchList;

        this.getList()
      },
      getList() {
        let deviceNos = [];
        let startIndex = (this.pageNum-1)*5;
        let endIndex = this.pageNum*5-1;
        this.onlineList.filter(function (e,index) {
           if(index >= startIndex && index <= endIndex){
             deviceNos.push(e);
           }
        });
        this.listLoading=true;
        getDeviceListByDeviceNo(deviceNos).then(data => {
            this.list=data.data.data
            this.listLoading = false
        })
      },
      timerTask: function () {

        this.$axios({
          method: "get",
          url: "/device/online",// 这里填写请求数据的路径
        })
          .then(res => {
            this.deviceNoList=this.$store.state.user.deviceNoList;
            for(var i = 0;i < res.data.length; i++) {
              if(this.deviceNoList.indexOf(res.data[i])!=-1){
                this.onlineList.push(res.data[i]);
              }
              this.listLoading = false;
            }
            this.getList();
          }, err => {
            console.log(err)
          })
      },

      resetTemp() {
        this.deviceFormData = {
          id:'',
          media:'',
          power:'',
          deviceType:'',
          status:1,
          runStatus:1,
          /*  onlineStates:0,*/
          saleDatetime:''
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
      handleGenerateQRCode(){
        this.qRCodeFormData.startSuffix=''
        this.qRCodeFormData.endSuffix=''
        this.dialogQRCodeFormVisible = true
        this.$nextTick(() => {
          this.$refs['qRCodeForm'].clearValidate()
        })
      },
      handleUpdate(row) {
        this.deviceFormData = Object.assign({}, row) // copy obj
        if(this.deviceFormData.saleDatetime){
          this.deviceFormData.saleDatetime=new Date(this.deviceFormData.saleDatetime)
        }else{
          this.deviceFormData.saleDatetime=new Date()
        }
        this.dialogStatus = 'update'
        this.dialogFormVisible = true
        this.$nextTick(() => {
          this.$refs['deviceFormData'].clearValidate()
        })
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
      editData(){
        this.$refs.deviceFormData.validate(valid => {
          if (valid) {
            this.deviceFormData.saleDatetime=formatDateTime(this.deviceFormData.saleDatetime,"yyyy-MM-dd hh:mm:ss")
            editDevice(this.deviceFormData).then(data=>{
              this.dialogFormVisible = false
              this.$message({
                message: "成功",
                type: 'success'
              });
             // this.getList()
            })
          } else {
            return false
          }
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

      handleCurrentChange(val) {
        this.pageNum = val
        console.log(this.pageNum);
        this.getList()
      }
    }
  }
</script>
