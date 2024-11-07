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
const pub = new Redis(serviceUri);
const sub = new Redis(serviceUri);

let users = {}; // Global users object to maintain online users

// Subscribe to Redis channels once at the start
sub.subscribe("MSG", "ONLINE_USERS", (err) => {
  if (err) {
    console.error("Error subscribing to Redis channels:", err);
  }
});

// Handle messages received from Redis subscriptions
sub.on("message", (channel, data) => {
  if (channel === "ONLINE_USERS") {
    // Update the global users object when receiving the updated list from Redis
    const updatedUsers = JSON.parse(data);
    users = { ...updatedUsers }; // Update the local users object
    io.emit("onlineUsers", users); // Emit the updated users list to all connected clients
  }

  if (channel === "MSG") {
    const messageData = JSON.parse(data);
    // Emit the message to the appropriate receiver(s)
    io.to(messageData.receiverName).emit(
      "receiveNotification",
      messageData.msg
    );
    console.log(
      `Message delivered from ${messageData.senderName} to ${messageData.receiverName}`
    );
  }
});

// Middleware to handle user connection and add them to the users object
io.use((socket, next) => {
  const username = socket.handshake.query.username;
  if (!username) {
    return next(new Error("Username is required"));
  }

  // Join a room with the username so we can target users by their name
  socket.join(username);

  // Add the user to the users object
  users[username] = users[username] || [];
  users[username].push(socket.id);

  // Publish the updated users object to Redis
  pub.publish("ONLINE_USERS", JSON.stringify(users));

  next();
});

// Handle socket connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle sending notifications
  socket.on("sendNotification", async ({ senderName, receiverName, msg }) => {
    const messageData = { senderName, receiverName, msg };
    // Publish the message to Redis (to notify other servers)
    await pub.publish("MSG", JSON.stringify(messageData));

    // Acknowledge the sender that their message was sent
    io.to(senderName).emit("sentNotification", messageData);
    console.log(`Notification sent from ${senderName} to ${receiverName}`);
  });

  // Handle draft notifications
  socket.on("draftNotification", ({ senderName, receiverName, msg }) => {
    io.to(senderName).emit("draftNotification", {
      senderName,
      receiverName,
      msg,
    });
    console.log(`Draft notification for ${senderName}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Remove the user from the users object
    for (const room in users) {
      users[room] = users[room].filter((socketId) => socketId !== socket.id);
      if (users[room].length === 0) {
        delete users[room]; // Delete the user from the users object if no sockets are connected
      }
    }

    // Publish the updated users object to Redis after user disconnects
    pub.publish("ONLINE_USERS", JSON.stringify(users));
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Handle client requests
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
