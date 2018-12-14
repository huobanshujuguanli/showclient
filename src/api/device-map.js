import request from '@/utils/request'
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
