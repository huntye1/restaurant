const http = require("http");
const { io } = require("./socketIO"); 
const app = require("./app");

const port = 10001;

const server = http.createServer(app);

// server.on("connection", app);
io.attach(server);

server.listen(port, () => {
  console.log("server is listening on " + port);
})