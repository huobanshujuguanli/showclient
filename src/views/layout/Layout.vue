<template>
  <div :class="classObj">
    <my-header class="main-header"></my-header>
    <sidebar class="main-sidebar"></sidebar>
    <div class="main-container">
      <tags-view/>
      <app-main :style="{'height':appMainHeight+'px'}"/>
    </div>
  </div>
</template>

<script>
  import { myHeader, Sidebar, AppMain, TagsView } from './components'

  export default {
    name: 'Layout',
    components: {
      myHeader,
      Sidebar,
      AppMain,
      TagsView
    },
    data() {
      return {
        appMainHeight:window.screen.height
      }
    },
    computed: {
      sidebar() {
        return this.$store.state.app.sidebar
      },
      classObj() {
        return {
          hideSidebar: !this.sidebar.opened,
          openSidebar: this.sidebar.opened
        }
      }
    },
    methods: {

    }
  }
</script>
