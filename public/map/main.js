/*
 * @Descripttion: 
 * @version: 
 * @Author: 曾利锋[阿牛]
 * @Date: 2022-06-14 17:13:18
 * @LastEditors: 曾利锋[阿牛]
 * @LastEditTime: 2022-06-14 17:13:18
 */
/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/bd.js":
/*!*******************!*\
  !*** ./src/bd.js ***!
  \*******************/
/***/ (() => {

eval("class BDMAP{\n  constructor (options) {\n    this.$options = options;\n    this.$callback = options.callback\n    this.$callbackList = [] //回调对列表收集\n    this.$key= options.key || \"46fw9n7VDbrPzBdhFy6jP87bw2qeDFpc\"; //高德地图key\n    this.$mode = options.mode || \"auto\"\n    this.$type = options.type || \"GD\"; //模式 GD 高德  baidu 百度  tc 腾讯\n    this.$el = options.el || \"map\";  //地图domid\n    this.$initParam  = options.initParam || {} //初始化参数\n    this.$LineSearch = options.LineSearch || {} \n    this.$siteName = options.siteName || \"乐清211路\"; //线路\n    this.$color = options.color || ['#1BBC60','#ff9900','#ff0000']\n    this.$lineSearchData; //线路数据\n    this.$sitePath = options.sitePath ||  []; // 线路数据\n    this.$site = options.site || []; //站点列表\n    this.$cheSitePath = [] //渲染缓存数据\n    this.$clearMapPath = [];\n    this.$circleMap = [] // 创建圆形数据\n    this.$cheCar = [] //车辆覆盖物缓存\n    this.$siteTxt = [] // 站点名称\n    this.$siteTxtlock = -1;\n    this.$fetchList = []\n    this.$cmap;\n    this.$clearCmapTime;\n    this.$curPage = 2;\n    this.$size = 50;\n    this.$totalPage = 1\n    this.$totalLimit = options.sitePath.length\n    this.$times = 60000000 \n    this.$cmap = new BMapGL.Map(this.$el); // 创建Map实例\n    this.$cmap.centerAndZoom(new BMapGL.Point(120.85897,28.083382), 12); // 初始化地图,设置中心点坐标和地图级别\n    this.$cmap.enableScrollWheelZoom(true); // 开启鼠标滚轮缩放   \n    if(this.$mode === \"auto\"){\n      this.lineSearch(this.$siteName)\n    }else{\n      this.init()\n    }\n  }\n  init () {\n    this.drawbusLine(this.$sitePath);\n    this.drawbusCircle();\n    // this.startTime();\n  }\n  //添加数据变化\n  setSitePath (data) { \n    this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器 \n    data.forEach((item,index)=>{\n      this.$cheSitePath[index] && this.$cmap.removeOverlay(this.$cheSitePath[index]) \n      let color = this.distanceColor(item.distance / item.duration,item.distance) \n      let busPolyline = this.drawbusLineItem(this.$sitePath[index],color)\n      this.$cmap.addOverlay(busPolyline);\n      this.$cheSitePath[index] = busPolyline\n    })\n  }\n  setSiteCar (data) {\n    this.$cheCar.forEach(item=>this.$cmap.remove(item));\n    data.forEach(item=>{\n\n    })\n  }\n  lineSearch (siteName) {\n    this.$fetchList = []\n    this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器\n    this.$cmap.clearOverlays()  // 创建之前，现在清除之前覆盖物 \n    let _this = this; \n    if(!siteName) return;\n    let resetSearch = {\n      lineInfo:[{via_stops:[],path:[]}]\n    }\n    this.$lineSearchData = new BMapGL.BusLineSearch(this.$cmap,{\n      renderOptions:{map: this.$cmap,},\n      onGetBusListComplete: function(result){\n          if(result) {\n            var fstLine = result.getBusListItem(0);//获取第一个公交列表显示到map上\n            _this.$lineSearchData.getBusLine(fstLine); \n          }\n      },\n      onPolylinesSet (result) {\n        // console.log(\"onPolylinesSet\",result.points)\n        result.points.forEach((item,index)=>{\n          resetSearch.lineInfo[0].path.push({ \n            ...item.latLng\n          })\n        }) \n      },\n      onMarkersSet (result) {\n          result.forEach((item,index)=>{\n            resetSearch.lineInfo[0].via_stops.push({\n              id:index,\n              name:item._stName,\n              location:{\n                ...item.latLng\n              } \n            })\n          }) \n          _this.lineSearch_Callback(resetSearch); \n        }\n    });\n    this.$lineSearchData.getBusList(siteName); \n  } \n  lineSearch_Callback (data) {  \n    // console.log(data)\n    var lineArr = data.lineInfo;\n    var lineNum = data.lineInfo.length;\n    if (lineNum == 0) {\n    } else {\n      this.$site = lineArr[0].via_stops.map(item=>{\n        return {\n          id:item.id,\n          name:item.name,\n          lng:item.location.lng,\n          lat:item.location.lat\n        }\n      }); \n      this.$sitePath = lineArr[0].path.reduce((cur,per,index,arr)=>{\n        if(arr.length-1 == index){\n          return cur\n        }\n        cur.push([[per.lng,per.lat],[arr[index+1].lng,arr[index+1].lat]])\n        return cur\n      },[]); \n      // console.log(JSON.stringify(this.$sitePath))\n      this.$totalPage = Math.ceil(this.$sitePath.length / this.$size)\n      this.$totalLimit = this.$sitePath.length\n      this.$colorLine = Array(this.$sitePath.length).fill(\"green\");\n      this.$cheSitePath = []; // 更新缓存数据\n      this.getFetch()\n      this.drawbusLine(this.$sitePath)\n      this.drawbusCircle();\n      // //启动定时器 更新线路\n      this.startTime()  \n    }\n  }\n  startTime (time = 3000) {\n    this.$clearCmapTime = setTimeout(()=>{\n      this.startLine()\n    },time)  \n  }\n  // 缓存各个fetch记录\n  getFetch () {\n    this.$sitePath.forEach((item)=>{\n      let key = this.$key;\n      let origins = item[0][1] + \",\" +item[0][0]; \n      let destination =item[1][1] + \",\" + item[1][0];\n      // 这里为什么不加途中点，是因为这个驾车模式，和公交线路不一样的，95%一样，还是5%有可能要绕路，\n      // 业务场景例如：比如有些线路公交车可以过，私家车不能过的 \n      let str = `https://api.map.baidu.com/routematrix/v2/driving?output=json&origins=${origins}&destinations=${destination}&ak=${key}`\n      this.$fetchList.push(str) \n    })\n  }\n  startLine () { \n    let _this = this; \n    // 如果请求缓存里面没有数据，就是不执行\n    if(this.$fetchList.length < 1){\n      return\n    }\n    if(this.$curPage == this.$totalLimit-1){\n      this.$clearCmapTime && clearTimeout(this.$clearCmapTime) // 取消定时器\n      this.$curPage = 1\n      this.$clearCmapTime = setTimeout(()=>{\n        this.startLine()\n      },this.$times)\n      return\n    }\n    let str = this.$fetchList[this.$curPage -1];\n    fetchJsonp(str,{\n      method:\"get\",\n      mode:'no-cors',\n      jsonCallbackFunction:'showLocation'\n      // headers:{ Accept: 'application/json',}\n    }).then(res=>{ \n      return res.json()\n    }).then((res)=>{\n      this.$cheSitePath[this.$curPage] && this.$cmap.removeOverlay(this.$cheSitePath[this.$curPage])\n      let newItem = res.result[0]\n      let color = this.distanceColor(newItem.distance.value / newItem.duration.value,newItem.distance.value)\n      let busPolyline = this.drawbusLineItem(this.$sitePath[this.$curPage],color)\n      this.$cmap.addOverlay(busPolyline);\n      this.$cheSitePath[this.$curPage] = busPolyline\n      this.$curPage++  \n      setTimeout(()=>{\n        this.startLine()\n      },200)\n    }) \n  }\n  // 路况情况颜色\n  distanceColor(time,distance) {\n    let flag = this.$color[0];\n    let list = this.$color;\n    if (time < 3 && distance>1) {\n      flag = list[2]\n    } else if (time < 4 && distance>1) {\n      flag = list[1]\n    } else {\n      flag = list[0]\n    }\n    return flag\n  } \n  //创建绘画圆形\n  drawbusCircle (){\n    this.$circleMap.forEach(item=>{\n      this.$cmap.removeOverlay(item)\n     })\n    this.$siteTxt.forEach(item=>{\n      this.$cmap.removeOverlay(item)\n     }) \n    this.$site.forEach((item,index)=>{\n      this.drawbusCircleItem({lng:item.lng,lat:item.lat,name:item.name,index:index})\n    })\n  }\n  drawbusCircleItem (item) { \n    // let style = {\n    //   fontSize:\"12px\"\n    // }\n    // let circle = new AMap.Circle({\n    //   center: new AMap.LngLat(item.lng,item.lat),  // 圆心位置\n    //   radius: 1, // 圆半径\n    //   fillColor: '#fff',   // 圆形填充颜色\n    //   strokeColor: 'green', // 描边颜色\n    //   strokeWeight: 1, // 描边宽度\n    //   fillOpacity:1,\n    //   zIndex:100\n    // }); \n    // if(this.$siteTxtlock > -1 && this.$siteTxtlock == item.index){\n    //   style={\n    //     fontSize:\"12px\",\n    //     fontWeight:\"bold\"\n    //   }\n    // }\n    var opts = {\n      position: new BMapGL.Point(item.lng,item.lat), // 指定文本标注所在的地理位置\n      offset: new BMapGL.Size(-10, 0) // 设置文本偏移量\n    };\n    // 创建文本标注对象\n    var text = new BMapGL.Label(item.name, opts);\n\n\n    // var text = new AMap.Text({\n    //   text:item.name,\n    //   anchor:'center', // 设置文本标记锚点\n    //   draggable:false,\n    //   cursor:'pointer', \n    //   style:style,\n    //   position: [item.lng,item.lat]\n    // });\n    text.on('click',(e)=>{ \n      this.$siteTxtlock = item.index;\n      this.drawbusCircle() \n      this.forCallback(item)\n    })\n    // this.$circleMap.push(circle)\n    this.$siteTxt.push(text)\n    // circle.setMap(this.$cmap);\n    this.$cmap.addOverlay(text);  \n  }\n  callback (fn) {\n    this.$callbackList.push(fn)\n  }\n  forCallback(data) {\n    this.$callback && this.$callback(data)\n    this.$callbackList.forEach(item=>item(data))\n  }\n  // 绘画线路Polyline\n  drawbusLine () { \n    this.$sitePath.forEach((item,index)=>{\n      this.$cheSitePath[index] && this.$cmap.removeOverlay(this.$cheSitePath[index])\n      let busPolyline = this.drawbusLineItem(item);\n      this.$cmap.addOverlay(busPolyline); \n      this.$cheSitePath.push(busPolyline);\n    })\n  }\n  drawbusLineItem (arrPath,color=this.$color[0]) {\n    let data = arrPath.map(item=>{\n      return new BMapGL.Point(item[0], item[1])\n    }) \n    return new BMapGL.Polyline(data,{\n      // geodesic:true,\n      strokeColor: color,\n      strokeWeight: 8,\n      strokeOpacity: 1, \n    });   \n  }\n}\n\n//# sourceURL=webpack://temp/./src/bd.js?");

/***/ }),

/***/ "./src/gd.js":
/*!*******************!*\
  !*** ./src/gd.js ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\nclass GDMAP{\n  constructor (options) {\n    this.$options = options;\n    this.$callback = options.callback\n    this.$callbackList = [] //回调对列表收集\n    this.$key= options.key || \"84089e5b76b44cffaa5e719c60efc745\"; //高德地图key\n    this.$mode = options.mode || \"auto\"\n    this.$type = options.type || \"GD\"; //模式 GD 高德  baidu 百度  tc 腾讯\n    this.$el = options.el || \"map\";  //地图domid\n    this.$initParam  = options.initParam || {} //初始化参数\n    this.$LineSearch = options.LineSearch || {} \n    this.$siteName = options.siteName || \"乐清211路\"; //线路\n    this.$color = options.color || ['#1BBC60','#ff9900','#ff0000']\n    this.$lineSearchData; //线路数据\n    this.$sitePath = options.sitePath ||  []; // 线路数据\n    this.$site = options.site || []; //站点列表\n    this.$cheSitePath = [] //渲染缓存数据\n    this.$clearMapPath = [];\n    this.$cheCar = [] //车辆覆盖物缓存\n    this.$circleMap = [] // 创建圆形数据\n    this.$siteTxt = [] // 站点名称\n    this.$siteTxtlock = -1;\n    this.$fetchList = []\n    this.$cmap;\n    this.$clearCmapTime;\n    this.$curPage = 2;\n    this.$size = 50;\n    this.$totalPage = 1\n    if(options.sitePath){\n      this.$totalLimit = options.sitePath.length\n    } \n    this.$times = 60000000 \n    this.$cmap = new AMap.Map(this.$el, Object.assign({       \n      zoom:15,\n    },this.$initParam));\n    if(this.$mode === \"auto\"){\n      this.lineSearch(this.$siteName)\n    }else{\n      this.init()\n    }\n  }\n  init () {\n    this.drawbusLine(this.$sitePath);\n    this.drawbusCircle();\n    this.startTime();\n  }\n  //添加数据变化\n  setSitePath (data) { \n    this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器 \n    data.forEach((item,index)=>{\n      this.$cheSitePath[index] && this.$cmap.remove(this.$cheSitePath[index]) \n      let color = this.distanceColor(item.distance / item.duration,item.distance) \n      let busPolyline = this.drawbusLineItem(this.$sitePath[index],color)\n      this.$cmap.add([busPolyline]);\n      this.$cheSitePath[index] = busPolyline\n    })\n  }\n  setSiteCar (data) {\n    this.$cheCar.forEach(item=>this.$cmap.remove(item));\n    data.forEach(item=>{\n      let marker = this.marker(item)\n      this.$cheCar.push(marker)\n      this.$cmap.add(marker)\n    })\n  }\n  lineSearch (siteName) {\n    this.$clearCmapTime && clearInterval(this.$clearCmapTime) // 取消定时器\n    this.$cmap.clearMap()  // 创建之前，现在清除之前覆盖物\n    let _this = this; \n    if(!siteName) return;\n    this.$lineSearchData = new AMap.LineSearch(Object.assign(\n      {\n        pageIndex: 1,\n        city: '乐清市',\n        pageSize: 1,\n        extensions: 'all'\n      },this.$LineSearch\n    )) \n    this.$lineSearchData.search(siteName, function(status, result) {\n       if (status === 'complete' && result.info === 'OK') {\n        _this.lineSearch_Callback(result); \n       } else {\n        alert(result);\n       }\n   });\n  } \n  lineSearch_Callback (data) { \n    // console.log(data)\n    var lineArr = data.lineInfo;\n    var lineNum = data.lineInfo.length;\n    if (lineNum == 0) {\n    } else {\n      this.$site = lineArr[0].via_stops.map(item=>{\n        return {\n          id:item.id,\n          name:item.name,\n          lng:item.location.lng,\n          lat:item.location.lat\n        }\n      }); \n      this.$sitePath = lineArr[0].path.reduce((cur,per,index,arr)=>{\n        if(arr.length-1 == index){\n          return cur\n        }\n        cur.push([[per.lng,per.lat],[arr[index+1].lng,arr[index+1].lat]])\n        return cur\n      },[]); \n      console.log(JSON.stringify(this.$sitePath))\n      this.$totalPage = Math.ceil(this.$sitePath.length / this.$size)\n      this.$totalLimit = this.$sitePath.length\n      this.$colorLine = Array(this.$sitePath.length).fill(\"green\");\n      this.$cheSitePath = []; // 更新缓存数据\n      this.getFetch()\n      this.drawbusLine(this.$sitePath)\n      this.drawbusCircle();\n      //启动定时器 更新线路\n      this.startTime()  \n    }\n  }\n  startTime (time = 3000) {\n    this.$clearCmapTime = setTimeout(()=>{\n      this.startLine()\n    },time)  \n  }\n  // 缓存各个fetch记录\n  getFetch () {\n    this.$sitePath.forEach((item)=>{\n      let key = this.$key;\n      let origins = item[0][0] + \",\" +item[0][1]; \n      let destination =item[1][0] + \",\" + item[1][1];\n      // 这里为什么不加途中点，是因为这个驾车模式，和公交线路不一样的，95%一样，还是5%有可能要绕路，\n      // 业务场景例如：比如有些线路公交车可以过，私家车不能过的\n      let str = `https://restapi.amap.com/v3/direction/driving?key=${key}&origin=${origins}&destination=${destination}&extensions=base`\n      this.$fetchList.push(str) \n    })\n  }\n  startLine () { \n    if(this.$curPage == this.$totalLimit-1){\n      this.$clearCmapTime && clearTimeout(this.$clearCmapTime) // 取消定时器\n      this.$curPage = 1\n      this.$clearCmapTime = setTimeout(()=>{\n        this.startLine()\n      },this.$times)\n      return\n    }\n    let str = this.$fetchList[this.$curPage -1]\n    fetch(str,{\n      method:\"get\"\n    }).then(res=>res.json()).then((res)=>{\n      this.$cheSitePath[this.$curPage] && this.$cmap.remove(this.$cheSitePath[this.$curPage])\n      let newItem = res.route.paths[0]\n      let color = this.distanceColor(newItem.distance / newItem.duration,newItem.distance)\n      let busPolyline = this.drawbusLineItem(this.$sitePath[this.$curPage],color)\n      this.$cmap.add([busPolyline]);\n      this.$cheSitePath[this.$curPage] = busPolyline\n      this.$curPage++  \n      setTimeout(()=>{\n        this.startLine()\n      },200)\n    }) \n  }\n  // 路况情况颜色\n  distanceColor(time,distance) {\n    let flag = this.$color[0];\n    let list = this.$color;\n    if (time < 3 && distance>1) {\n      flag = list[2]\n    } else if (time < 4 && distance>1) {\n      flag = list[1]\n    } else {\n      flag = list[0]\n    }\n    return flag\n  } \n  //创建绘画圆形\n  drawbusCircle (){\n    this.$circleMap.forEach(item=>{\n      this.$cmap.remove(item)\n    })\n    this.$siteTxt.forEach(item=>{\n      this.$cmap.remove(item)\n    }) \n    this.$site.forEach((item,index)=>{\n      this.drawbusCircleItem({lng:item.lng,lat:item.lat,name:item.name,index:index})\n    })\n  }\n  drawbusCircleItem (item) { \n    let style = {\n      fontSize:\"12px\"\n    }\n    let circle = new AMap.Circle({\n      center: new AMap.LngLat(item.lng,item.lat),  // 圆心位置\n      radius: 1, // 圆半径\n      fillColor: '#fff',   // 圆形填充颜色\n      strokeColor: 'green', // 描边颜色\n      strokeWeight: 1, // 描边宽度\n      fillOpacity:1,\n      zIndex:100\n    }); \n    var text;\n    if(this.$siteTxtlock > -1 && this.$siteTxtlock == item.index){\n      text = new AMap.Marker({\n              position:[item.lng,item.lat],   // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]\n              // title: '北京',\n              size: new AMap.Size(64, 72),\n              // anchor: 'center', \n              // imageSize: new AMap.Size(20, 20),\n              zIndex:100,\n              offset: new AMap.Pixel(-32, -64),\n              icon: './site.png', // 添加 Icon 图标 URL\n            });\n    }else{\n      text = new AMap.Text({\n        text:item.name,\n        anchor:'center', // 设置文本标记锚点\n        draggable:false,\n        cursor:'pointer', \n        style:style,\n        position: [item.lng,item.lat]\n      });\n    }\n    \n    text.on('click',(e)=>{ \n      this.$siteTxtlock = item.index;\n      this.drawbusCircle() \n      this.forCallback(item)\n    })\n    this.$circleMap.push(circle)\n    this.$siteTxt.push(text)\n    circle.setMap(this.$cmap);\n    text.setMap(this.$cmap); \n  }\n  callback (fn) {\n    this.$callbackList.push(fn)\n  }\n  forCallback(data) {\n    this.$callback && this.$callback(data)\n    this.$callbackList.forEach(item=>item(data))\n  }\n  // 绘画线路Polyline\n  drawbusLine () {\n    this.$sitePath.forEach((item,index)=>{\n      this.$cheSitePath[index] && this.$cmap.remove(this.$cheSitePath[index])\n      let busPolyline =  this.drawbusLineItem(item)\n      this.$cmap.add([busPolyline]);\n      this.$cmap.setFitView();\n      this.$cheSitePath.push(busPolyline)\n    })\n  }\n  drawbusLineItem (arrPath,color=this.$color[0]) {\n    return new AMap.Polyline({\n        map: this.$cmap,\n        path: arrPath, \n        strokeColor: color,//线颜色\n        strokeOpacity: 0.8,//线透明度\n        isOutline:true,\n        outlineColor:'white',\n        showDir: true,\n        strokeWeight: 8,//线宽\n        zIndex: 100\n    });  \n  }\n  marker (item) {\n    return new AMap.Marker({\n          position: new AMap.LngLat(item.lng, item.lat),   // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]\n          // title: '北京',\n          size: new AMap.Size(32, 36),\n          anchor: 'center', \n          imageSize: new AMap.Size(20, 20),\n          zIndex:20,\n          // offset: new AMap.Pixel(0, -10),\n          icon: './busicon.png', // 添加 Icon 图标 URL\n      });\n  }\n} \n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (GDMAP);\n\n//# sourceURL=webpack://temp/./src/gd.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _gd__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./gd */ \"./src/gd.js\");\n/* harmony import */ var _bd__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bd */ \"./src/bd.js\");\n/* harmony import */ var _bd__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_bd__WEBPACK_IMPORTED_MODULE_1__);\n\n\nclass Cmap {\n  constructor (options) { \n    this.$type = options.type || 'gd' // 获取地图类型\n    this.$cmap; //地图模式\n    // 回调地址队列\n    // 场景1当前用户点击站点或者其他信息，回调回去\n    this.$callback = [] \n    if(options.type === 'gd'){\n      this.$cmap = new _gd__WEBPACK_IMPORTED_MODULE_0__[\"default\"](options)\n    }else if (options.type === 'bd') {\n      this.$cmap = new (_bd__WEBPACK_IMPORTED_MODULE_1___default())(options)\n    } \n  }\n  callback (fn) {\n    this.$cmap.callback(fn)\n  }\n}\nif(window){\n  window.Cmap = Cmap\n}  \n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Cmap);\n\n//# sourceURL=webpack://temp/./src/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;