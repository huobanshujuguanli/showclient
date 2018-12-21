import request from '@/utils/request'
import { config } from '@/config/index';
export function getDeviceMapListByConditionAndPage(query) {
  return request({
    url: '/deviceMap/devicemaplistbyconditionandpage',
    method: 'get',
    params: query
  })
}
export function getDeviceMapListByCondition(query) {
  return request({
    url: '/deviceMap/devicemaplistbycondition',
    method: 'get',
    params: query
  })
}


export function editDeviceMap(data) {
    return request({
        url: '/deviceMap/editdevicemap',
        method: 'post',
        data:data
    })
}
export function deleteDeviceMapById(id) {
    return request({
        url: '/deviceMap/deletedevicemapbyid',
        method: 'post',
        params:{id}
    })
}
/**
 * 通过经纬度获得城市编码
 * @param {经纬度坐标} location 
 */
export function getCityCodeByLatAndLng(location){
  return request({
    baseURL:'/apis',
    url:'/v3/geocode/regeo',
    method:'post',
    headers:{'Content-Type':'text/x-www-form-urlencoded'},
    params:{
      key:config.amap_key,
      location:location
    }
  })
}
/**
 * 通过城市编码获得当地城市天气
 * @param {城市编码} adCode 
 */
export function getWeatherByAdCode(adCode){
  return request({
    baseURL:'/apis',
    url:'/v3/weather/weatherInfo',
    method:'get',
    headers:{'Content-Type':'text/x-www-form-urlencoded'},
    params:{
      key:config.amap_key,
      city:adCode
    }
  })
}
