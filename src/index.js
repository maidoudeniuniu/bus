import GDMAP from './gd';
import BDMAP from './bd';
import QQMAP from './qq'
class Cmap {
  constructor (options) { 
    this.$type = options.type || 'gd' // 获取地图类型
    this.$cmap; //地图模式
    // 回调地址队列
    // 场景1当前用户点击站点或者其他信息，回调回去
    this.$callback = [] 
    if(options.type === 'gd'){
      this.$cmap = new GDMAP(options)
    }else if (options.type === 'bd') {
      this.$cmap = new BDMAP(options)
    } else if (options.type === 'qq') {
      this.$cmap = new QQMAP(options)
    } 
  }
  callback (fn) {
    this.$cmap.callback(fn)
  }
}
if(window){
  window.Cmap = Cmap
}  
export default Cmap