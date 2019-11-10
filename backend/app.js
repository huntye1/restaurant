const express = require("express");
const cookieParser = require("cookie-parser");
const dbp = require("./dbPromise");
const cors = require("cors");
const userAccountMiddleware = require("./userAccountMiddleware");
const restaurantMiddleware = require("./restaurantMiddleware");
const path = require('path');

const app = express();



let db;
(async function () {
  dbp.then(p => {
    db = p
  })
})();

global.db = db; // 连接数据库


app.use(cors({
  origin: true,
  maxAge: 86400,
  credentials: true,
}))


app.use((req, res, next) => {
  console.log(req.method, req.url); // 记录连接请求
  next()
})

app.use(express.static(path.join( __dirname ,"/build/")));// 设置静态文件夹
app.use("/uploads", express.static(path.join( __dirname , "/uploads/")));// 设置静态文件夹
app.use(cookieParser("secret")); //cookie 解析
app.use(express.urlencoded({ //url 解析中间件
  extended: true
}));
app.use(express.json());

app.use("/api", userAccountMiddleware);
app.use("/api", restaurantMiddleware);


module.exports = app;
