// class GDMAP{
//   constructor (options) {
//     this.$options = options;
//     this.$callback = options.callback
//     this.$callbackList = [] //回调对列表收集
//     this.$key= options.key || "84089e5b76b44cffaa5e719c60efc745"; //高德地图key
//     this.$mode = options.mode || "auto"
//     this.$type = options.type || "GD"; //模式 GD 高德  baidu 百度  tc 腾讯
//     this.$el = options.el || "map";  //地图domid
//     this.$initParam  = options.initParam || {} //初始化参数
//     this.$LineSearch = options.LineSearch || {} 
//     this.$siteName = options.siteName || "乐清221路"; //线路
//     this.$color = options.color || ['green','#ff9900','#ff0000']
//     this.$lineSearchData; //线路数据
//     this.$sitePath = options.sitePath ||  []; // 线路数据
//     this.$site = options.site || []; //站点列表
//     this.$cheSitePath = [] //渲染缓存数据
//     this.$clearMapPath = [];
//     this.$circleMap = [] // 创建圆形数据
//     this.$siteTxt = [] // 站点名称
//     this.$siteTxtlock = -1;
//     this.$fetchList = []
//     this.$cmap;
//     this.$clearCmapTime;
//     this.$curPage = 2;
//     this.$size = 50;
//     this.$totalPage = 1
//     this.$totalLimit = options.sitePath.length
//     this.$times = 60000000 
//     this.$cmap = new AMap.Map(this.$el, Object.assign({       
//       zoom:15,
//     },this.$initParam));
//     if(this.$mode === "auto"){
//       this.lineSearch(this.$siteName)
//     }else{
//       this.init()
//     }
//   }
//   init () {
//     this.drawbusLine(this.$sitePath);
//     this.drawbusCircle();
//     this.startTime();
//   }
//   //添加数据变化
//   setSitePath (data) { 
//     this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器 
//     data.forEach((item,index)=>{
//       this.$cheSitePath[index] && this.$cmap.remove(this.$cheSitePath[index]) 
//       let color = this.distanceColor(item.distance / item.duration,item.distance) 
//       let busPolyline = this.drawbusLineItem(this.$sitePath[index],color)
//       this.$cmap.add([busPolyline]);
//       this.$cheSitePath[index] = busPolyline
//     })
//   }
//   lineSearch (siteName) {
//     this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器
//     this.$cmap.clearMap()  // 创建之前，现在清除之前覆盖物
//     let _this = this; 
//     if(!siteName) return;
//     this.$lineSearchData = new AMap.LineSearch(Object.assign(
//       {
//         pageIndex: 1,
//         city: '乐清市',
//         pageSize: 1,
//         extensions: 'all'
//       },this.$LineSearch
//     )) 
//     this.$lineSearchData.search(siteName, function(status, result) {
//        if (status === 'complete' && result.info === 'OK') {
//         _this.lineSearch_Callback(result); 
//        } else {
//         alert(result);
//        }
//    });
//   } 
//   lineSearch_Callback (data) { 
//     // console.log(data)
//     var lineArr = data.lineInfo;
//     var lineNum = data.lineInfo.length;
//     if (lineNum == 0) {
//     } else {
//       this.$site = lineArr[0].via_stops.map(item=>{
//         return {
//           id:item.id,
//           name:item.name,
//           lng:item.location.lng,
//           lat:item.location.lat
//         }
//       }); 
//       this.$sitePath = lineArr[0].path.reduce((cur,per,index,arr)=>{
//         if(arr.length-1 == index){
//           return cur
//         }
//         cur.push([[per.lng,per.lat],[arr[index+1].lng,arr[index+1].lat]])
//         return cur
//       },[]); 
//       console.log(JSON.stringify(this.$sitePath))
//       this.$totalPage = Math.ceil(this.$sitePath.length / this.$size)
//       this.$totalLimit = this.$sitePath.length
//       this.$colorLine = Array(this.$sitePath.length).fill("green");
//       this.$cheSitePath = []; // 更新缓存数据
//       this.getFetch()
//       this.drawbusLine(this.$sitePath)
//       this.drawbusCircle();
//       //启动定时器 更新线路
//       this.startTime()  
//     }
//   }
//   startTime (time = 3000) {
//     this.$clearCmapTime = setTimeout(()=>{
//       this.startLine()
//     },time)  
//   }
//   // 缓存各个fetch记录
//   getFetch () {
//     this.$sitePath.forEach((item)=>{
//       let key = this.$key;
//       let origins = item[0][0] + "," +item[0][1]; 
//       let destination =item[1][0] + "," + item[1][1];
//       // 这里为什么不加途中点，是因为这个驾车模式，和公交线路不一样的，95%一样，还是5%有可能要绕路，
//       // 业务场景例如：比如有些线路公交车可以过，私家车不能过的
//       let str = `https://restapi.amap.com/v3/direction/driving?key=${key}&origin=${origins}&destination=${destination}&extensions=base`
//       this.$fetchList.push(str) 
//     })
//   }
//   startLine () { 
//     if(this.$curPage == this.$totalLimit-1){
//       this.$clearCmapTime && clearTimeout(this.$clearCmapTime) // 取消定时器
//       this.$curPage = 1
//       this.$clearCmapTime = setTimeout(()=>{
//         this.startLine()
//       },this.$times)
//       return
//     }
//     let str = this.$fetchList[this.$curPage -1]
//     fetch(str,{
//       method:"get"
//     }).then(res=>res.json()).then((res)=>{
//       this.$cheSitePath[this.$curPage] && this.$cmap.remove(this.$cheSitePath[this.$curPage])
//       let newItem = res.route.paths[0]
//       let color = this.distanceColor(newItem.distance / newItem.duration,newItem.distance)
//       let busPolyline = this.drawbusLineItem(this.$sitePath[this.$curPage],color)
//       this.$cmap.add([busPolyline]);
//       this.$cheSitePath[this.$curPage] = busPolyline
//       this.$curPage++  
//       setTimeout(()=>{
//         this.startLine()
//       },200)
//     }) 
//   }
//   // 路况情况颜色
//   distanceColor(time,distance) {
//     let flag = this.$color[0];
//     let list = this.$color;
//     if (time < 3 && distance>1) {
//       flag = list[2]
//     } else if (time < 4 && distance>1) {
//       flag = list[1]
//     } else {
//       flag = list[0]
//     }
//     return flag
//   } 
//   //创建绘画圆形
//   drawbusCircle (){
//     this.$circleMap.forEach(item=>{
//       this.$cmap.remove(item)
//     })
//     this.$siteTxt.forEach(item=>{
//       this.$cmap.remove(item)
//     }) 
//     this.$site.forEach((item,index)=>{
//       this.drawbusCircleItem({lng:item.lng,lat:item.lat,name:item.name,index:index})
//     })
//   }
//   drawbusCircleItem (item) { 
//     let style = {
//       fontSize:"12px"
//     }
//     let circle = new AMap.Circle({
//       center: new AMap.LngLat(item.lng,item.lat),  // 圆心位置
//       radius: 1, // 圆半径
//       fillColor: '#fff',   // 圆形填充颜色
//       strokeColor: 'green', // 描边颜色
//       strokeWeight: 1, // 描边宽度
//       fillOpacity:1,
//       zIndex:100
//     }); 
//     if(this.$siteTxtlock > -1 && this.$siteTxtlock == item.index){
//       style={
//         fontSize:"12px",
//         fontWeight:"bold"
//       }
//     }
//     var text = new AMap.Text({
//       text:item.name,
//       anchor:'center', // 设置文本标记锚点
//       draggable:false,
//       cursor:'pointer', 
//       style:style,
//       position: [item.lng,item.lat]
//     });
//     text.on('click',(e)=>{ 
//       this.$siteTxtlock = item.index;
//       this.drawbusCircle() 
//       this.forCallback(item)
//     })
//     this.$circleMap.push(circle)
//     this.$siteTxt.push(text)
//     circle.setMap(this.$cmap);
//     text.setMap(this.$cmap); 
//   }
//   callback (fn) {
//     this.$callbackList.push(fn)
//   }
//   forCallback(data) {
//     this.$callback && this.$callback(data)
//     this.$callbackList.forEach(item=>item(data))
//   }
//   // 绘画线路Polyline
//   drawbusLine () {
//     this.$sitePath.forEach((item,index)=>{
//       this.$cheSitePath[index] && this.$cmap.remove(this.$cheSitePath[index])
//       let busPolyline =  this.drawbusLineItem(item)
//       this.$cmap.add([busPolyline]);
//       this.$cmap.setFitView();
//       this.$cheSitePath.push(busPolyline)
//     })
//   }
//   drawbusLineItem (arrPath,color=this.$color[0]) {
//     return new AMap.Polyline({
//         map: this.$cmap,
//         path: arrPath, 
//         strokeColor: color,//线颜色
//         strokeOpacity: 0.8,//线透明度
//         isOutline:true,
//         outlineColor:'white',
//         showDir: true,
//         strokeWeight: 8,//线宽
//         zIndex: 100
//     });  
//   }
// }


class BDMAP{
  constructor (options) {
    this.$options = options;
    this.$callback = options.callback
    this.$callbackList = [] //回调对列表收集
    this.$key= options.key || "84089e5b76b44cffaa5e719c60efc745"; //高德地图key
    this.$mode = options.mode || "auto"
    this.$type = options.type || "GD"; //模式 GD 高德  baidu 百度  tc 腾讯
    this.$el = options.el || "map";  //地图domid
    this.$initParam  = options.initParam || {} //初始化参数
    this.$LineSearch = options.LineSearch || {} 
    this.$siteName = options.siteName || "乐清221路"; //线路
    this.$color = options.color || ['green','#ff9900','#ff0000']
    this.$lineSearchData; //线路数据
    this.$sitePath = options.sitePath ||  []; // 线路数据
    this.$site = options.site || []; //站点列表
    this.$cheSitePath = [] //渲染缓存数据
    this.$clearMapPath = [];
    this.$circleMap = [] // 创建圆形数据
    this.$siteTxt = [] // 站点名称
    this.$siteTxtlock = -1;
    this.$fetchList = []
    this.$cmap;
    this.$clearCmapTime;
    this.$curPage = 2;
    this.$size = 50;
    this.$totalPage = 1
    this.$totalLimit = options.sitePath.length
    this.$times = 60000000 
    this.$cmap = new BMapGL.Map(this.$el); // 创建Map实例
    this.$cmap.centerAndZoom(new BMapGL.Point(120.85897,28.083382), 12); // 初始化地图,设置中心点坐标和地图级别
    this.$cmap.enableScrollWheelZoom(true); // 开启鼠标滚轮缩放   
    if(this.$mode === "auto"){
      this.lineSearch(this.$siteName)
    }else{
      this.init()
    }
  }
  init () {
    this.drawbusLine(this.$sitePath);
    this.drawbusCircle();
    // this.startTime();
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
  lineSearch (siteName) {
    this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器
    this.$cmap.clearOverlays()  // 创建之前，现在清除之前覆盖物
    let _this = this; 
    if(!siteName) return;
    this.$lineSearchData = new BMapGL.BusLineSearch(this.$cmap,{
      renderOptions:{map: this.$cmap,},
      onGetBusListComplete: function(result){
          if(result) {
            console.log("1111111",result)
          }
      }
  });
  this.$lineSearchData.getBusList(siteName);

    // this.$lineSearchData = new AMap.LineSearch(Object.assign(
    //   {
    //     pageIndex: 1,
    //     city: '乐清市',
    //     pageSize: 1,
    //     extensions: 'all'
    //   },this.$LineSearch
    // )) 
  //   this.$lineSearchData.search(siteName, function(status, result) {
  //      if (status === 'complete' && result.info === 'OK') {
  //       _this.lineSearch_Callback(result); 
  //      } else {
  //       alert(result);
  //      }
  //  });
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
      console.log(JSON.stringify(this.$sitePath))
      this.$totalPage = Math.ceil(this.$sitePath.length / this.$size)
      this.$totalLimit = this.$sitePath.length
      this.$colorLine = Array(this.$sitePath.length).fill("green");
      this.$cheSitePath = []; // 更新缓存数据
      this.getFetch()
      this.drawbusLine(this.$sitePath)
      this.drawbusCircle();
      //启动定时器 更新线路
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
      let key = this.$key;
      let origins = item[0][0] + "," +item[0][1]; 
      let destination =item[1][0] + "," + item[1][1];
      // 这里为什么不加途中点，是因为这个驾车模式，和公交线路不一样的，95%一样，还是5%有可能要绕路，
      // 业务场景例如：比如有些线路公交车可以过，私家车不能过的
      let str = `https://restapi.amap.com/v3/direction/driving?key=${key}&origin=${origins}&destination=${destination}&extensions=base`
      this.$fetchList.push(str) 
    })
  }
  startLine () { 
    if(this.$curPage == this.$totalLimit-1){
      this.$clearCmapTime && clearTimeout(this.$clearCmapTime) // 取消定时器
      this.$curPage = 1
      this.$clearCmapTime = setTimeout(()=>{
        this.startLine()
      },this.$times)
      return
    }
    let str = this.$fetchList[this.$curPage -1]
    fetch(str,{
      method:"get"
    }).then(res=>res.json()).then((res)=>{
      this.$cheSitePath[this.$curPage] && this.$cmap.remove(this.$cheSitePath[this.$curPage])
      let newItem = res.route.paths[0]
      let color = this.distanceColor(newItem.distance / newItem.duration,newItem.distance)
      let busPolyline = this.drawbusLineItem(this.$sitePath[this.$curPage],color)
      this.$cmap.add([busPolyline]);
      this.$cheSitePath[this.$curPage] = busPolyline
      this.$curPage++  
      setTimeout(()=>{
        this.startLine()
      },200)
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
      this.$cmap.remove(item)
    })
    this.$siteTxt.forEach(item=>{
      this.$cmap.remove(item)
    }) 
    this.$site.forEach((item,index)=>{
      this.drawbusCircleItem({lng:item.lng,lat:item.lat,name:item.name,index:index})
    })
  }
  drawbusCircleItem (item) { 
    // let style = {
    //   fontSize:"12px"
    // }
    // let circle = new AMap.Circle({
    //   center: new AMap.LngLat(item.lng,item.lat),  // 圆心位置
    //   radius: 1, // 圆半径
    //   fillColor: '#fff',   // 圆形填充颜色
    //   strokeColor: 'green', // 描边颜色
    //   strokeWeight: 1, // 描边宽度
    //   fillOpacity:1,
    //   zIndex:100
    // }); 
    // if(this.$siteTxtlock > -1 && this.$siteTxtlock == item.index){
    //   style={
    //     fontSize:"12px",
    //     fontWeight:"bold"
    //   }
    // }
    var opts = {
      position: new BMapGL.Point(item.lng,item.lat), // 指定文本标注所在的地理位置
      offset: new BMapGL.Size(0, 0) // 设置文本偏移量
    };
    // 创建文本标注对象
    var text = new BMapGL.Label(item.name, opts);


    // var text = new AMap.Text({
    //   text:item.name,
    //   anchor:'center', // 设置文本标记锚点
    //   draggable:false,
    //   cursor:'pointer', 
    //   style:style,
    //   position: [item.lng,item.lat]
    // });
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
      this.$cheSitePath[index] && this.$cmap.remove(this.$cheSitePath[index])
      let busPolyline =  this.drawbusLineItem(item)
      this.$cmap.addOverlay(busPolyline);
      // this.$cmap.setFitView();
      this.$cheSitePath.push(busPolyline)
    })
  }
  drawbusLineItem (arrPath,color=this.$color[0]) {
    let data = arrPath.map(item=>{
      return new BMapGL.Point(item[0], item[1])
    })
    return new BMapGL.Polyline(data,{
      strokeColor: color,
      strokeWeight: 8,
      strokeOpacity: 1
    });  
 


  //   {
  //     map: this.$cmap,
  //     path: arrPath, 
  //     strokeColor: color,//线颜色
  //     strokeOpacity: 0.8,//线透明度
  //     isOutline:true,
  //     outlineColor:'white',
  //     showDir: true,
  //     strokeWeight: 8,//线宽
  //     zIndex: 100
  // }
  }
}

function Cmap (options) {
  if(options.type == "GD"){
    window.Cmap = GDMAP
  }else if (options.type == "BD") {
    window.Cmap = BDMAP
  }
}

Cmap({
  type:"BD"
}) 