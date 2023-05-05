<script lang="ts" setup>
//
</script>

<template>
  <div class="one" draggable="false">
    one
    <!-- <div class="item" v-for="item in 5" :key="item"></div> -->
  </div>
</template>

<style lang="scss" scoped>
.one {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: antiquewhite;
  font-size: 48px;
  // pointer-events: none;
}
.item {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100px;
  background-color: aqua;
  // pointer-events: none;
}
</style>
