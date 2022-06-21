
var $cmap;
var $styles;
class QQMAP{
  constructor (options) {
    this.$options = options;
    this.$data = options.data
    this.$callback = options.callback
    this.$callbackList = [] //回调对列表收集
    this.$key= options.key || "84089e5b76b44cffaa5e719c60efc745"; //高德地图key
    this.$mode = options.mode || "auto"
    this.$type = options.type || "GD"; //模式 GD 高德  baidu 百度  tc 腾讯
    this.$el = options.el || "map";  //地图domid
    this.$initParam  = options.initParam || {} //初始化参数
    this.$LineSearch = options.LineSearch || {} 
    this.$siteName = options.siteName || "乐清211路"; //线路
    this.$color = options.color || ['#1BBC60','#ff9900','#ff0000']
    this.$lineSearchData; //线路数据
    this.$sitePath = this.$data.sitePath ||  []; // 线路数据
    this.$site = this.$data.site || []; //站点列表
    this.$cheSitePath = [] //渲染缓存数据
    this.$clearMapPath = [];
    this.$cheCar = [] //车辆覆盖物缓存
    this.$circleMap = [] // 创建圆形数据
    this.$siteTxt = [] // 站点名称
    this.$markerList = [];
    this.$siteTxtlock = -1;
    this.$polylineLayer;
    this.$markerLayer;
    this.$circleLayer;
    this.$siteLayer;
    this.$fetchList = []
    this.$cmap;
    this.$clearCmapTime;
    this.$curPage = 2;
    this.$size = 50;
    this.$totalPage = 1;
    if(this.$data.sitePath){
      this.$totalLimit = this.$data.sitePath.length
    } 
    this.$times = 60000
    this.$cmap =  $cmap = new TMap.Map(this.$el,{
      zoom:16,	//缩放级别
      center: new TMap.LatLng(28.083382,120.85897)
    });  
    this.$busicon = this.$data.busicon

    // var search = new TMap.service.Search({ pageSize: 20,cityName:"乐清市",filter:"category=基础设施,交通设施,公交车站",regionFix:true });
    // search.searchRectangle({
    //   keyword: "乐清211路",
    //   pageIndex:1,
    //   getSubpois:true,
    //   bounds: this.$cmap.getBounds(),
    // })
    // .then((result) => {
    //   console.log(JSON.stringify(result))
    //   console.log(result.data.filter(item=>item.type==1))
    // })
    // return

    if(this.$mode === "auto"){
      this.lineSearch(this.$siteName)
      this.polylineLayer();
    }else{
      this.init()
    }
    console.log(this.$data.siteIcon)
  }
  init () {
    this.styles() /// 样式定义
    this.drawbusLine(this.$sitePath);
    this.drawbusCircle();
    this.getFetch()
    this.startTime(); 
   
  }
  styles () {
    $styles = {}
    this.$color.forEach((item,index)=>{
      $styles[index+1] =  new TMap.PolylineStyle({
        'color': item, //线填充色
        'width': 8, //折线宽度
        'borderWidth': 1, //边线宽度
        'borderColor': '#FFF', //边线颜色
        'lineCap': 'round', //线端头方式
      })
    })
    
    console.log($styles)
  }
  // 创建覆盖物
  polylineLayer () {
    this.$polylineLayer = new TMap.MultiPolyline({
      map: $cmap, // 绘制到目标地图
      // 折线样式定义
      styles: {
        'style_blue': new TMap.PolylineStyle({
          color: '#3777FF', //线填充色
          width: 10, //折线宽度
          borderWidth: 0, //边线宽度
          showArrow: true,
          arrowOptions: {
            space: 70
          },
          lineCap: 'round',
        }),
      }
    });
  } 
  //添加数据变化
  setSitePath (data) { 
    this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器 
    data.forEach((item,index)=>{
      this.$cheSitePath[index] && this.$cmap.remove(this.$cheSitePath[index]) 
      let color = this.distanceColor(item.distance / item.duration,item.distance) 
      let busPolyline = this.drawbusLineItem(this.$sitePath[index],color)
      this.$cmap.add([busPolyline]);
      this.$cheSitePath[index] = busPolyline
    })
  }
  setSiteCar (data) {
    this.$cheCar.forEach(item=> this.$markerLayer.remove(item));
    this.$cheCar = [];
    data.forEach((item,index)=>{
      let id = "bus_"+index;
      this.marker({
        styleId:"bus",
        id:id,
        lng:item.lng,
        lat:item.lat
      }) 
      this.$cheCar.push(id)
      // this.marker(marker)
    })
  }
  lineSearch (siteName) {
    this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器
    this.$cmap.destroy()  // 创建之前，现在清除之前覆盖物
    let _this = this; 
    if(!siteName) return;
    this.$lineSearchData = new AMap.LineSearch(Object.assign(
      {
        pageIndex: 1,
        city: '乐清市',
        pageSize: 1,
        extensions: 'all'
      },this.$LineSearch
    )) 
    this.$lineSearchData.search(siteName, function(status, result) {
       if (status === 'complete' && result.info === 'OK') {
        _this.lineSearch_Callback(result); 
       } else {
        alert(result);
       }
   });
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
        cur.push([[per.lat,per.lng],[arr[index+1].lng,arr[index+1].lat]])
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
      let origins = item[0][1] + "," +item[0][0]; 
      let destination =item[1][1] + "," + item[1][0];
      // 这里为什么不加途中点，是因为这个驾车模式，和公交线路不一样的，95%一样，还是5%有可能要绕路，
      // 业务场景例如：比如有些线路公交车可以过，私家车不能过的 
      let str = `https://apis.map.qq.com/ws/direction/v1/driving/?key=${key}&from=${origins}&to=${destination}&output=jsonp&policy=LEAST_TIME,REAL_TRAFFIC`
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
    fetchJsonp(str,{
      method:"get",
      jsonpCallbackFunction: 'function_name_of_jsonp_response'
    }).then(res=>res.json()).then((res)=>{ 
      let newItem = res.result.routes[0];
      this.$polylineLayer && this.$polylineLayer.remove('p1_'+this.$curPage)
      let item = this.$sitePath[this.$curPage]
      let p1 = {
        id:'p1_'+this.$curPage,
        styleId:this.distanceColor(parseInt(newItem.distance / newItem.duration)),
        paths:[new TMap.LatLng(item[0][1], item[0][0]), new TMap.LatLng(item[1][1], item[1][0])]
      }   
      console.log(p1)
      this.drawbusLineItem(p1)
      this.$curPage++  
      setTimeout(()=>{
        this.startLine()
      },200)
    }) 
  }
  // 路况情况颜色
  distanceColor(time,distance) { 
    let flag = 1;
    if (time < 3 && distance>1) {
      flag = 3
    } else if (time < 4 && distance>1) {
      flag = 2
    } else {
      flag = 1
    }
    return flag
  } 
  //创建绘画圆形
  drawbusCircle (){ 
    this.clearMarker()
    this.$circleMap.forEach(item=>{
      this.$circleLayer && this.$circleLayer.remove(item)
    })
    this.$siteTxt.forEach(item=>{
      this.$siteLayer && this.$siteLayer.remove(item)
    })
    
    this.$site.forEach((item,index)=>{
      this.$siteTxt.push('t_'+index) 
      this.drawbusCircleItem(item,index) 
      if(this.$siteTxtlock > -1 && this.$siteTxtlock == index){
        this.marker(Object.assign({},item,{id:'m_0'}))
      }else{
        this.drawbusTxt(item,index)
      } 
    }) 
  }
  drawbusTxt (item,index) { 
    if(this.$siteLayer){
      this.$siteLayer.add({
        id: 't_'+index, // 点图形数据的标志信息
        styleId: 'label', // 样式id
        position: new TMap.LatLng(item.lat, item.lng), // 标注点位置
        content: item.name, // 标注文本
        properties: {
          // 标注点的属性数据
          title: 'label',
        },
      })
    }else{
      this.$siteLayer = new TMap.MultiLabel({
        id: 'label-layer',
        map:this.$cmap,
        styles: {
          label: new TMap.LabelStyle({
            color: '#333', // 颜色属性
            size: 12, // 文字大小属性
            offset: { x: 0, y: 0 }, // 文字偏移属性单位为像素
            angle: 0, // 文字旋转属性
            alignment: 'center', // 文字水平对齐属性
            verticalAlignment: 'middle', // 文字垂直对齐属性
            backgroundColor:"#fff",
            padding:'6px 10px',
            borderWidth:"1px",
            borderRadius:"5px",
            borderColor:"#000"
          }),
        },
        geometries: [
          {
            id: 't_'+index, // 点图形数据的标志信息
            styleId: 'label', // 样式id
            position: new TMap.LatLng(item.lat, item.lng), // 标注点位置
            content: item.name, // 标注文本
            properties: {
              // 标注点的属性数据
              title: 'label',
            },
          },
        ],
      });
      this.$siteLayer.on("click",(e)=>{ 
        this.$siteTxtlock = e.geometry.id.replace(/t_/g,'');
        this.drawbusCircle() 
      })
    }  
  }
  drawbusCircleItem (item,index) {  
    if(this.$circleLayer){
      this.$circleLayer.add({
        id:"c_"+index,
        styleId: 'circle',
        center: new TMap.LatLng(item.lat, item.lng),
        radius: 1,
      }) 
    }else{
      this.$circleLayer = new TMap.MultiCircle({ 
        map:this.$cmap,
        styles: { // 设置圆形样式
          'circle': new TMap.CircleStyle({
            'color': 'rgba(255,255,255,1)',
            'showBorder': true,
            'borderColor': 'rgba(41,91,255,1)',
            'borderWidth': 1
          }),
        },
        geometries: [{
          id:"c_"+index,
          styleId: 'circle',
          center: new TMap.LatLng(item.lat, item.lng),
          radius: 1,
        }],
      });
    }
    this.$circleMap.push("c_"+index)  
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
      let str = parseInt(parseInt(Math.random()*10)/4);  
      let p1 = {
        id:'p1_'+index,
        styleId:1,
        paths:[new TMap.LatLng(item[0][1], item[0][0]), new TMap.LatLng(item[1][1], item[1][0])]
      }   
      this.$polylineLayer && this.$polylineLayer.remove('p1_'+index) // 绘画之前，先删除之前的数据
      this.drawbusLineItem([p1])
    }) 
  }
  drawbusLineItem (arrPath,color=this.$color[0]) {
    if(this.$polylineLayer){  
      this.$polylineLayer.add(arrPath)
    }else{
       //创建 MultiPolyline显示折线
      this.$polylineLayer = new TMap.MultiPolyline({
        id: 'polyline-layer', //图层唯一标识
        map: $cmap,//绘制到目标地图
        //折线样式定义
        styles: $styles,
        //折线数据定义
        geometries: arrPath
      });
    }   
  }
  //创建覆盖物
  marker (item) { 
    if(!this.$markerLayer){
      this.$markerLayer =new TMap.MultiMarker({
          id: 'marker-layer',
          map: this.$cmap,
          styles: {
            "site": new TMap.MarkerStyle({
              "width": 64,
              "height": 72,
              "anchor": { x: 32, y: 64 },
              "src": this.$data.siteIcon
            }),
            "bus": new TMap.MarkerStyle({
              "width": 32,
              "height": 36,
              "anchor": { x: 32, y: 64 },
              "src": this.$data.busicon
            })
          },
      });
    }
    this.$markerLayer.add({
      id:item.id,
      styleId: item.styleId || 'site',
      position:new TMap.LatLng(item.lat, item.lng)
    }) 
  }
  clearMarker () {
    this.$markerLayer && this.$markerLayer.setMap(null)
    this.$markerLayer = null
  }
} 
window.Cmap = QQMAP
 