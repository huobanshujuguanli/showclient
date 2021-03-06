import Vue from 'vue'
import Router from 'vue-router'
import Layout from '../views/layout/Layout'
Vue.use(Router)

export const constantRouterMap = [
  {
    path: '/',
    redirect: '/login',
    hidden: true
  },
  {path: '/login',component: () => import('../views/login/index'),hidden: true},
  {
    path:'/home',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('../views/device/device-map'),
        name: 'home',
        meta: { title: '地图分布',icon: 'map',noCache: true}
      }
    ]
  },
  {
    path:'/device-index' ,
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('../views/device/'),
        name: 'home',
        meta: { title: '展示设备',icon: 'list', noCache: true}
      }
    ]
  }

]
export default new Router({
  mode: 'history',
  base:__dirname,
  routes:constantRouterMap
})
