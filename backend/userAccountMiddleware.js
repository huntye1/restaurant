const express = require('express');
const dbp = require("./dbPromise")


let db;
(async function () {
  dbp.then(p => {
    db = p
  })
})();

const app = express.Router();

app.post("/login", (async (req, res, next) => {
  let userinfo = req.body;
  console.log(userinfo);
  let user = await db.get("SELECT * FROM users WHERE password=? AND name=?", userinfo.password, userinfo.username);
  if (user) {
    if (userinfo.remember) { 
      res.cookie("userid", user.id);
    } else {
      if (req.cookies.userid) {
        res.clearCookie("userid");
      }
    }
    res.json({
      code: 1,
      user,
    })
  } else {
    res.json({
      code: 0,
      msg: "用户名或密码错误！"
    });
  }
}));


//获取餐厅信息
app.get("/userinfo", async (req, res, next) => {
  let id = req.cookies.userid;
  let user = await db.get("SELECT id,name,title FROM users WHERE id=?", id);
  if (user) {
    res.json({
      code: 1,
      user,
    })
  } else {
    res.status(404).json({
      code: 0,
      msg: "不存在此用户"
    })
  }
})

app.get("/logout", (req, res, next) => {
  res.clearCookie("userid");
  res.json({
    code: 1,
    msg:"登出成功"
  })
})

//注册
app.post("/register", async (req, res, next) => {
  let registerInfo = req.body;
  //数据库检验是否已经注册过了
  let user = await db.get("SELECT * FROM users WHERE name=?", registerInfo.name);
  if (user) {
    res.json({
      code: 0,
      msg: "用户名已存在"
    })
  } else {
    await db.run("INSERT INTO users (name,email,password,title) VALUES(?,?,?,?)", registerInfo.name, registerInfo.email, registerInfo.password, registerInfo.title); //需要为密码加密   真正产品中还会加入盐值（随机字符拼接）
    res.json({
      code: 1,
      msg: "注册成功"
    })
  }
})
module.exports = app;
