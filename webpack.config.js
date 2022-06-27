/*
 * @Descripttion: 
 * @version: 
 * @Author: 曾利锋[阿牛]
 * @Date: 2022-06-14 16:33:41
 * @LastEditors: 曾利锋[阿牛]
 * @LastEditTime: 2022-06-27 13:56:59
 */
const path = require('path');
module.exports = {
  mode: "development",
  //打包入口文件路径
  entry: './src/index.js',
  //path打包出口路径，filename写打包后文件名
  output: {
    path: path.resolve(__dirname, './anbustime/dist'),
    filename: 'main.js',
    library: {
      name: 'anbustime',
      type: 'umd',
    },
  },
  //定义一些规则
  module: {
    //数组里每个元素为一个规则
    rules: [   
      {
        test:/\.(png|jpg|jpeg|gif)$/,
        use:[
          'file-loader'
        ]
      },
      {
        test:/\.js$/,
        use:{
           loader:'babel-loader',
           options:{ //用babel-loader 把es6 --> es5
              presets:[
                 '@babel/preset-env'
              ],
              plugins:[
                 '@babel/plugin-proposal-class-properties'
              ]
           }
        }
      }
    ]
  }
}