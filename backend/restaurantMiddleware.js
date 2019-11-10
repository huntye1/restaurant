const express = require('express');
const dbp = require("./dbPromise");
const multer = require("multer");
const mime = require("mime");
const { orderIO, foodIO } = require("./socketIO");


let db;
(async function () {
  dbp.then(p => {
    db = p
  })
})();

app = express.Router();


//扫码后 根据地址获取 餐厅信息  桌面信息等
//deskinfo/rid/:rid/did/:did
app.get("/deskinfo/restaurant/:rid/desk/:did", async (req, res, next) => {
  let rid = req.params.rid; // 餐厅id
  let did = req.params.did; // 桌面id
  let restaurantInfo = await db.get(`
    SELECT id AS rid,title FROM users WHERE id = ?
  `, rid)
  let deskInfo = await db.get(`
    SELECT id AS did,name AS deskName,capacity FROM desks WHERE id = ?
  `, did)
  
  // console.log(restaurantInfo)
  // console.log(deskInfo)
  res.json({
    code:1,
    info: {
      ...restaurantInfo,
      ...deskInfo
    }
  })
})

app.get("/foodinfo/restaurant/:rid", async (req, res, next) => {
  let rid = req.params.rid; // 餐厅id
  let foodInfo = await db.all(`
    SELECT * FROM foods WHERE rid = ? AND status = 'on'
  `,rid)
  res.json({
    code: 1,
    foodInfo
  })
})

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "." + mime.getExtension(file.mimetype));
  }
})
let upload = multer({ storage: storage });


//菜品 增删改查api 面向餐厅端
app.route("/restaurant/:rid/food")
  .get(async (req, res, next) => {
    let userid = req.cookies.userid;
    if (userid) { 
      let rid = req.params.rid;
      let foods = await db.all(`
        SELECT * FROM foods WHERE rid = ?
      `, rid);
      res.json(foods);
    } else {
      res.status(403).json({
        msg:"没有操作权限"
      })
    }

  })
  .post(upload.single("image"),async (req, res, next) => {
    let rid = req.params.rid;
    if (req.cookies.userid === rid) {
      //判断
      let category = req.body.category;
      let description = req.body.description;
      let name = req.body.name;
      let price = req.body.price;
      let image = "nopicture.jpg";
      if (req.file) {
        image = req.file.filename
      }

      let status = req.body.status || "on";
      await db.run(`
       INSERT INTO foods (rid,category,description,name,status,image,price) VALUES (?,?,?,?,?,?,?)
      `, rid, category, description, name, status, image, price)
      let newFood = await db.get(`SELECT * FROM foods ORDER BY id DESC LIMIT 1 `);
      res.json({
        code:1,
        newFood: newFood
      })
    } else {
      res.status(403).json({
        code: 0,
        msg: "没有操作权限！"
      })
    }
  })

app.route("/restaurant/:rid/food/:fid")
  .delete(async (req, res, next) => {
    let rid = req.params.rid;
    let fid = req.params.fid;
    if (req.cookies.userid === rid) {
      await db.run(`
        DELETE FROM foods WHERE id = ? AND rid = ?
      `, fid,rid);
      res.json({
        code:1
      })
      res.json(foods);
    } else {
      res.status(403).json({
        code: 0,
        msg: "没有操作权限！"
      })
    }
  })
  .put(upload.single("image"),async (req, res, next) => { // 更新食物信息.
    let rid = req.params.rid;
    let fid = req.params.fid;
    if (req.cookies.userid === rid) {

      let image = req.file && req.file.filename;//存下图片的名字。
      let category = req.body.category;
      let description = req.body.description;
      let name = req.body.name;
      let status = req.body.status;
      let price = req.body.price;
      let food = await db.get(`SELECT * FROM foods WHERE id = ?`, fid)
      let newFood = {
        id: fid,
        category: category !== undefined ? category : food.category,
        description: description !== undefined ? description : food.description,
        image: image !== undefined ? image : food.image,
        name: name !== undefined ? name : food.name,
        status: status !== undefined ? status : food.status,
        price: price !== undefined ? price : food.price,
      }
      await db.run(`
        UPDATE foods SET category=?,description=?,image=?, name=? ,status=?,price=? WHERE id=? AND rid=?
      `, newFood.category, newFood.description, newFood.image, newFood.name, newFood.status, newFood.price, fid, rid);

      let updatedFood = await db.get(`SELECT * FROM foods WHERE id=? AND rid=?`, fid, rid);
      res.json({
        code:1,
        updatedFood
      });
    }else {
      res.status(403).json({
        code: 0,
        msg: "没有操作权限！"
      })
    }
  })



//桌子 增删改查api 面向餐厅端
app.route("/restaurant/:rid/desk")
  .get(async (req, res, next) => {
    let rid = req.params.rid;
    if (req.cookies.userid === rid) {
      let desks = await db.all(`
        SELECT * FROM desks WHERE rid = ?
      `, rid);
      res.json({
        code: 1,
        desks
      });
    } else {
      res.status(403).json({
        code: 0,
        msg: "没有操作权限！"
      })
    }
  })
  .post(async (req, res, next) => {
    let rid = req.params.rid;
    if (req.cookies.userid === rid) {
      let capacity = req.body.capacity;
      let name = req.body.name;
      await db.run(`
       INSERT INTO desks (rid,capacity,name) VALUES (?,?,?)
      `, rid, capacity, name)
      let newDesk = await db.get(`
        SELECT * FROM desks ORDER BY id DESC LIMIT 1
      `)
      res.json({
        code: 1,
        newDesk
      })
    } else {
      res.status(403).json({
        code: 0,
        msg: "没有操作权限！"
      })
    }
  })
//删除和更改
app.route("/restaurant/:rid/desk/:did")
  .delete(async (req, res, next) => {
    let rid = req.params.rid;
    let did = req.params.did;
    if (req.cookies.userid === rid) {
      await db.run(`
        DELETE FROM desks WHERE id = ? AND rid = ?
      `, did, rid);
      res.json({
        code: 1
      })
      res.json(desks);
    } else {
      res.status(403).json({
        code: 0,
        msg: "没有操作权限！"
      })
    }
  })
  .put(async (req, res, next) => {
    let rid = req.params.rid;
    let did = req.params.did;
    if (req.cookies.userid === rid) {
      let { capacity, name} = await db.get("SELECT * FROM desks WHERE id=? AND rid=?", did, rid);
      let newCapacity = req.body.capacity || capacity;
      let newName = req.body.name || name;
      await db.run(`
        UPDATE desks SET capacity = ?,name = ? WHERE id=? AND rid=?
      `, newCapacity, newName, did, rid);
      let newDesk = await db.get(`
        SELECT * FROM desks WHERE id = ?
      `, did);
      res.json({
        code: 1,
        newDesk
      })
    } else {
      res.status(403).json({
        code: 0,
        msg: "没有操作权限！"
      })
    }
  })

//order 订单 

// 新增订单 面向顾客 

app.post("/restaurant/:rid/desk/:did/order", async(req, res, next) => {
  let customerCount = req.body.customerCount;
  let details = JSON.stringify(req.body.details);
  let status = req.body.status || "pending";
  let timestamp = req.body.timestamp || (new Date()).toISOString();
  let totalPrice = req.body.totalPrice;
  let deskName = req.body.deskName;
  let rid = req.params.rid;
  let did = req.params.did;
  
  await db.run(`
  INSERT INTO orders (customerCount,details,status,timestamp,totalPrice,deskName,rid,did) VALUES (?,?,?,?,?,?,?,?)
  `, customerCount, details, status, timestamp, totalPrice, deskName, rid,did);

  let newOrder = await db.get(`
    SELECT * FROM orders ORDER BY id DESC LIMIT 1
  `)
  newOrder = {
    ...newOrder,
    details: JSON.parse(newOrder.details)
  }
  orderIO.emit("newOrder", newOrder);// 记得把JSON解析
  res.json({
    code:1
  })
})

app.route("/restaurant/:rid/order/:oid")
  .delete(async (req, res, next) => {
    let rid = req.params.rid;
    let oid = req.params.oid;
    if (req.cookies.userid == rid) {
      await db.run(`
        DELETE FROM orders WHERE oid = ? AND rid = ?
      `, oid, rid);
      res.json({
        code:1
      })
    } else {
      res.status(403).json({
        code: 0,
        msg:"没有操作权限"
      })
    }
  })
  .put((req, res, next) => {
    let rid = req.params.rid;
    let oid = req.params.oid
    let newSatus = req.body.newStatus;
    if (req.cookies.userid == rid) { 
      db.run(`
       UPDATE orders SET status = ? WHERE id = ?
      `, newSatus, oid);
      res.json({
        code:1
      })
    } else {
      res.status(403).json({
        code: 0,
        msg: "没有操作权限"
      })
    }
  })
//订单获取.
app.get("/restaurant/:rid/order",async (req, res, next) => {
  let rid = req.params.rid;
  let orders = await db.all(`
    SELECT * FROM orders WHERE rid = ?
  `, rid);
  orders.forEach(order => {
    order.details = JSON.parse(order.details);
  });
  res.json(orders);
})

module.exports = app;
 