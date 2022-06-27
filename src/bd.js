class BDMAP{
  constructor (options) {
    this.$options = options;
    this.$callback = options.callback
    this.$callbackList = [] //回调对列表收集
    this.$key= options.key || "46fw9n7VDbrPzBdhFy6jP87bw2qeDFpc"; //高德地图key
    this.$severKey= options.severKey || ""; //服务端key
    this.$mode = options.mode || "auto"
    this.$center = options.center
    this.$version = options.version || "1.0"
    this.$type = options.type || "GD"; //模式 GD 高德  baidu 百度  tc 腾讯
    this.$el = options.el || "map";  //地图domid
    this.$initParam  = options.initParam || {} //初始化参数
    this.$LineSearch = options.LineSearch || {} 
    this.$siteName = options.siteName || "乐清211路"; //线路
    this.$color = options.color || ['#1BBC60','#ff9900','#ff0000']
    this.$lineSearchData; //线路数据
    this.$sitePath = options.sitePath ||  []; // 线路数据
    this.$cheSitePath = [] //渲染缓存数据
    this.$site = options.site || []; //站点列表 
    this.$clearMapPath = [];
    this.$circleMap = [] // 创建圆形数据
    this.$cheCar = [] //车辆覆盖物缓存
    this.$siteTxt = [] // 站点名称
    this.$siteTxtlock = -1;
    this.$fetchList = []
    this.$cmap;
    this.$clearCmapTime;
    this.$curPage = 2;
    this.$size = 50;
    this.$totalPage = 1;
    this.$success = options.success // 初始化成功回调
    if(options.sitePath){
      this.$totalLimit = options.sitePath.length
    } 
    this.$times = 60000;
    this.createElement().then(()=>{
      this.$cmap = new BMapGL.Map(this.$el); // 创建Map实例
      this.$cmap.centerAndZoom(new BMapGL.Point(this.$center[0],this.$center[1]), 12); // 初始化地图,设置中心点坐标和地图级别
      this.$cmap.enableScrollWheelZoom(true); // 开启鼠标滚轮缩放   
      if(this.$mode === "auto"){
        this.lineSearch(this.$siteName)
      }else{
        this.init()
      } 
      this.$success && this.$success()
    })
   
  }
  init () {
    this.drawbusLine(this.$sitePath);
    this.drawbusCircle();
    // this.startTime();
  }
  createElement () {
    //console.log("初始化百度地图脚本...");
    const AK = this.$key
    const V = this.$version
    const BMap_URL = "https://api.map.baidu.com/api?type=webgl&v="+ V +"&ak="+ AK +"&s=1&callback=onBMapCallback";
    return new Promise((resolve, reject) => {
        // 如果已加载直接返回
        if(typeof BMapGL !== "undefined") {
          resolve();
          return true;
        }
        // 百度地图异步加载回调处理
        window.onBMapCallback = function () {
          console.log("百度地图脚本初始化成功...");
          resolve();
        };
        // 插入script脚本
        let scriptNode = document.createElement("script");
        scriptNode.setAttribute("type", "text/javascript");
        scriptNode.setAttribute("src", BMap_URL);
        document.body.appendChild(scriptNode);
    });
  }
  //添加数据变化
  setSitePath (data) { 
    this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器 
    data.forEach((item,index)=>{
      this.$cheSitePath[index] && this.$cmap.removeOverlay(this.$cheSitePath[index]) 
      let color = this.distanceColor(item.distance / item.duration,item.distance) 
      let busPolyline = this.drawbusLineItem(this.$sitePath[index],color)
      this.$cmap.addOverlay(busPolyline);
      this.$cheSitePath[index] = busPolyline
    })
  }
  setSiteCar (data) {
    console.log("setSiteCar",data)
    this.$cheCar.forEach(item=>this.$cmap.removeOverlay(item));
    data.forEach(item=>{
      let marker = this.marker(item)
      this.$cheCar.push(marker)
      this.$cmap.addOverlay(marker)
    })
  }
  lineSearch (siteName) {
    this.$fetchList = []
    this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器
    this.$cmap.clearOverlays()  // 创建之前，现在清除之前覆盖物 
    let _this = this; 
    if(!siteName) return;
    let resetSearch = {
      lineInfo:[{via_stops:[],path:[]}]
    }
    this.$lineSearchData = new BMapGL.BusLineSearch(this.$cmap,{
      renderOptions:{map: this.$cmap,},
      onGetBusListComplete: function(result){
          if(result) {
            var fstLine = result.getBusListItem(0);//获取第一个公交列表显示到map上
            _this.$lineSearchData.getBusLine(fstLine); 
          }
      },
      onPolylinesSet (result) {
        // console.log("onPolylinesSet",result.points)
        result.points.forEach((item,index)=>{
          resetSearch.lineInfo[0].path.push({ 
            ...item.latLng
          })
        }) 
      },
      onMarkersSet (result) {
          result.forEach((item,index)=>{
            resetSearch.lineInfo[0].via_stops.push({
              id:index,
              name:item._stName,
              location:{
                ...item.latLng
              } 
            })
          }) 
          _this.lineSearch_Callback(resetSearch); 
        }
    });
    this.$lineSearchData.getBusList(siteName); 
  } 
  lineSearch_Callback (data) {  
    // console.log(data)
    var lineArr = data.lineInfo;
    var lineNum = data.lineInfo.length;
    if (lineNum == 0) {
    } else {
      this.$site = lineArr[0].via_stops.map(item=>{
        return {
          id:item.id,
          name:item.name,
          lng:item.location.lng,
          lat:item.location.lat
        }
      }); 
      this.$sitePath = lineArr[0].path.reduce((cur,per,index,arr)=>{
        if(arr.length-1 == index){
          return cur
        }
        cur.push([[per.lng,per.lat],[arr[index+1].lng,arr[index+1].lat]])
        return cur
      },[]); 
      // console.log(JSON.stringify(this.$sitePath))
      this.$totalPage = Math.ceil(this.$sitePath.length / this.$size)
      this.$totalLimit = this.$sitePath.length
      this.$colorLine = Array(this.$sitePath.length).fill("green");
      this.$cheSitePath = []; // 更新缓存数据
      this.getFetch()
      this.drawbusLine(this.$sitePath)
      this.drawbusCircle();
      // //启动定时器 更新线路
      this.startTime()  
    }
  }
  startTime (time = 3000) {
    this.$clearCmapTime = setTimeout(()=>{
      this.startLine()
    },time)  
  }
  // 缓存各个fetch记录
  getFetch () {
    this.$sitePath.forEach((item)=>{
      let key = this.$severKey;
      let origins = item[0][1] + "," +item[0][0]; 
      let destination =item[1][1] + "," + item[1][0];
      // 这里为什么不加途中点，是因为这个驾车模式，和公交线路不一样的，95%一样，还是5%有可能要绕路，
      // 业务场景例如：比如有些线路公交车可以过，私家车不能过的 
      let str = `https://api.map.baidu.com/routematrix/v2/driving?output=json&origins=${origins}&destinations=${destination}&ak=${key}`
      this.$fetchList.push(str) 
    })
  }
  startLine () { 
    let _this = this; 
    // 如果请求缓存里面没有数据，就是不执行
    if(this.$fetchList.length < 1){
      return
    }
    if(this.$curPage == this.$totalLimit-1){
      this.$clearCmapTime && clearTimeout(this.$clearCmapTime) // 取消定时器
      this.$curPage = 1
      this.$clearCmapTime = setTimeout(()=>{
        this.startLine()
      },this.$times)
      return
    }
    let str = this.$fetchList[this.$curPage -1];
    fetchJsonp(str,{
      method:"get",
      mode:'no-cors',
      jsonCallbackFunction:'showLocation'
      // headers:{ Accept: 'application/json',}
    }).then(res=>{ 
      return res.json()
    }).then((res)=>{
      if(res.status == 0){
        this.$cheSitePath[this.$curPage] && this.$cmap.removeOverlay(this.$cheSitePath[this.$curPage])
        let newItem = res.result[0]
        let color = this.distanceColor(newItem.distance.value / newItem.duration.value,newItem.distance.value)
        let busPolyline = this.drawbusLineItem(this.$sitePath[this.$curPage],color)
        this.$cmap.addOverlay(busPolyline);
        this.$cheSitePath[this.$curPage] = busPolyline
        this.$curPage++  
        setTimeout(()=>{
          this.startLine()
        },1000)
      }else{
        console.log(res.message)
      } 
    }) 
  }
  // 路况情况颜色
  distanceColor(time,distance) {
    let flag = this.$color[0];
    let list = this.$color;
    if (time < 3 && distance>1) {
      flag = list[2]
    } else if (time < 4 && distance>1) {
      flag = list[1]
    } else {
      flag = list[0]
    }
    return flag
  } 
  //创建绘画圆形
  drawbusCircle (){
    this.$circleMap.forEach(item=>{
      this.$cmap.removeOverlay(item)
     })
    this.$siteTxt.forEach(item=>{
      this.$cmap.removeOverlay(item)
     }) 
    setTimeout(()=>{
      this.$site.forEach((item,index)=>{ 
        this.drawbusCircleItem({lng:item.lng,lat:item.lat,name:item.name,index:index})
      })
    },100)
  }
  drawbusCircleItem (item) {
    var opts = {
      position: new BMapGL.Point(item.lng,item.lat), // 指定文本标注所在的地理位置
      offset: new BMapGL.Size(-10, 0) // 设置文本偏移量
    }; 
    var text; 
    if(this.$siteTxtlock > -1 && this.$siteTxtlock == item.index){
      text = new BMapGL.Marker(new BMapGL.Point(item.lng, item.lat));
    }else{
      text = new BMapGL.Label(item.name, opts); 
    }
    text.on('click',(e)=>{ 
      this.$siteTxtlock = item.index;
      this.drawbusCircle() 
      this.forCallback(item)
    })
    // this.$circleMap.push(circle) 
    this.$siteTxt.push(text)
    // circle.setMap(this.$cmap);
    this.$cmap.addOverlay(text);  
  }
  callback (fn) {
    this.$callbackList.push(fn)
  }
  forCallback(data) {
    this.$callback && this.$callback(data)
    this.$callbackList.forEach(item=>item(data))
  }
  // 绘画线路Polyline
  drawbusLine () { 
    this.$sitePath.forEach((item,index)=>{
      this.$cheSitePath[index] && this.$cmap.removeOverlay(this.$cheSitePath[index])
      let busPolyline = this.drawbusLineItem(item);
      this.$cmap.addOverlay(busPolyline); 
      this.$cheSitePath.push(busPolyline);
    })
  }
  drawbusLineItem (arrPath,color=this.$color[0]) {
    let data = arrPath.map(item=>{
      return new BMapGL.Point(item[0], item[1])
    }) 
    return new BMapGL.Polyline(data,{
      // geodesic:true,
      strokeColor: color,
      strokeWeight: 8,
      strokeOpacity: 1, 
    });   
  }
  //覆盖物
  marker (item) {
    let markerIcon = {}
    var point = new BMapGL.Point(item.lng, item.lat);
    if(this.$busiconData && this.$busiconData.icon){
      var myIcon = new BMapGL.Icon(this.$busiconData.icon, new BMapGL.Size(this.$busiconData.size[0], this.$busiconData.size[1]));
      markerIcon.icon = myIcon
    }
    return new BMapGL.Marker(point,markerIcon); 
  }
}

module.exports = BDMAP;