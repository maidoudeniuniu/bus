const express = require("express");
const app  = express()

app.use(express.static("./public"));//设置静态文件夹


app.listen(9000,()=>{})
