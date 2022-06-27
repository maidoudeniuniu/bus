/*
 * @Descripttion: 
 * @version: 
 * @Author: 曾利锋[阿牛]
 * @Date: 2022-06-14 16:29:06
 * @LastEditors: 曾利锋[阿牛]
 * @LastEditTime: 2022-06-27 11:40:45
 */
var GDMAP = require("./gd");
var BDMAP = require("./bd");
var QQMAP = require("./qq");
class Cmap {
  constructor (options) { 
    this.$type = options.type || 'gd' // 获取地图类型
    this.$cmap; //地图模式
    // 回调地址队列
    // 场景1当前用户点击站点或者其他信息，回调回去
    this.$callback = [];
    this.isFileer(options) 
    if(options.type === 'gd'){
      this.$cmap = new GDMAP(options)
    }else if (options.type === 'bd') {
      this.$cmap = new BDMAP(options)
    } else if (options.type === 'qq') {
      this.$cmap = new QQMAP(options)
    } else {
      this.$cmap = new GDMAP(options)
    }  
  }
  success (fn) {
    this.$cmap.success(fn)
  }
  //过滤需要的元素
  isFileer (options) {
    //判断过滤
    if(!options.key){
      throw new Error('地图key 没有填写');
      return
    }
    if(!options.city){
      throw new Error('查询当前城市没有填写');
      return
    }
    if(!options.center){
      throw new Error('center 设置中心点没有设置');
      return
    } 
  }
  setSitePath (data) {
    console.log("---------setSitePath-----------")
    if(!this.$cmap){
      throw new Error('地图没有加载完成');
      return
   }
    this.$cmap.setSitePath(data)
  }
  setSiteCar (data) {
    console.log("---------setSitePath-----------")
    if(!this.$cmap){
       throw new Error('地图没有加载完成');
       return
    }
    this.$cmap.setSiteCar(data)
  }
  lineSearch (sitename) {
    this.$cmap.lineSearch(sitename)
  }
  callback (fn) {
    this.$cmap.callback(fn)
  }
}
if(window){
  window.Cmap = Cmap
} 
module.exports = Cmap;