require("dotenv").config();
const app = require("express")();
const server = require("http").createServer(app);
const socket = require("socket.io");
const Redis = require("ioredis");
const port = process.env.PORT;

const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const serviceUri = process.env.VALKEY_SERVICEURI;
const client = new Redis(serviceUri);
const pub = new Redis(serviceUri);
const sub = new Redis(serviceUri);

let onlineUsers = [];
let users = {};

io.use((socket, next) => {
  const username = socket.handshake.query.username;
  if (!username) {
    return;
  } else {
    socket.join(username);
    if (!onlineUsers.find((user) => user.username === username)) {
      onlineUsers.push({ username });
    }
    if (!users[username]) {
      users[username] = [];
    }
    console.log(JSON.stringify(onlineUsers), "onlineUsers");
    users[username].push(socket.id);
    sub.subscribe("MSG", (err, count) => {});
    // test redis set and get method
    client
      .set("key", "Welcome to Valkey")
      .then((result) => {})
      .catch((error) => {
        console.error("Set error:", error);
      });

    client.get("key").then(function (result) {
      // valkey.disconnect();
    });
    next();
  }
});
io.on("connection", (socket) => {
  socket.emit("onlineUsers", onlineUsers);

  socket.on("sendNotification", async ({ senderName, reciverName, msg }) => {
    await pub.publish("MSG", JSON.stringify({ senderName, reciverName, msg }));

    sub.on("message", (channel, jsonStringigyData) => {
      if (channel === "MSG") {
        const data = JSON.parse(jsonStringigyData);

        data.reciverName.forEach((receiverName) => {
          io.to(receiverName).emit("receiveNotification", data);
        });
      }
    });
    io.to(reciverName).emit("receiveNotification", {
      senderName,
      reciverName,
      msg,
    });
  });
  socket.on("disconnect", (socket) => {
    for (const room in users) {
      users[room] = users[room].filter((socketId) => socketId !== socket.id);
      if (users[room].length === 0) {
        delete users[room]; // Remove username from users if no sockets left
      }
    }
    console.log(socket.id, "users after disconnect");
    // removeUser(socket.id);
  });
});
// console.log(onlineUsers, "onlineUsers");
app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// const addNewUser = (username, socketId) => {
//   !onlineUsers.some((user) => user.username === username) &&
//     onlineUsers.push({ username, socketId });
// };
// const removeUser = (socketId) => {
//   onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
// };
// const getUser = (username) => {
//   return onlineUsers.find((user) => user.username === username);
// };
