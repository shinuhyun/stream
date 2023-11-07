import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("rtc_home");
});

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  // 함수 parameter의 실행은 여기가 아니라 client에서 실행된다.
  // 신뢰하지 못하는 코드를 서버에서 실행시키면 안된다.
  // 단지 실행 버튼을 누르는 것 뿐이다.
  // 다만 백엔드에서 parameter에 인수를 넣어서 실행요청?을 할 수 있다.
  socket.on("enter_room", (roomName) => {
    // socket은 각자 private room을 가진다.
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });

  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });

  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });

  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });

  socket.onAny((event, ...args) => {
    console.log(`Socket Event : ${event}`);
  });
});

httpServer.listen(3000);
