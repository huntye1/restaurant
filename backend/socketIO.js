const SocketIO = require("socket.io");

const io =new SocketIO();
// io.serveClient(false);
const orderIO = io.of("/order");
const foodIO = io.of("/food");

orderIO.on("connection", (socket) => {
  const rid = socket.handshake.query.rid
  socket.join("restaurant:" + rid);
})

foodIO.on("connection", (socket) => {
  const type = socket.handshake.query.type;
  const rid = socket.handshake.query.rid;
  const did = socket.handshake.query.did;
  if (type === "init") {
    foodIO.in("desk:" + did).clients((e, clients) => {  // 获取该桌已有的客户端
      // console.log("curclients",clients);
      if (clients.length) {  // 如果存在连接的客户端
        let connectedId = clients[0];
        socket.to(connectedId).emit("getOrderInfo",socket.id); // 向已连接的第一个客户端获取食物
      } else {
        socket.emit("noOrderedFoods") 
      }
    })
  } else {
    socket.join("desk:" + did);
    socket.on("plusFood", (food) => {
      socket.broadcast.emit("plusFood",food)
    })
    socket.on("minusFood", (food) => {
      socket.broadcast.emit("minusFood", food)
    })
    socket.on("checkout", () => {
      socket.broadcast.emit("checkout");
    })
  }

  socket.on("orderedInfo", (info) => {  //id foods customercount 
    const id = info.id
    delete info.id;
    socket.to(id).emit("initInfo", info); // 得到食物把他转发给landing 页面
  })
})


module.exports = {
  io,
  orderIO,
  foodIO
}