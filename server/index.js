// Inbuilt module.
const express = require("express");
const http = require("http");

// user defined module
const router = require("./router");
const { addUser, removeUser, getUser, getUserInRoom } = require("./users.js");

// Creating the express app.
const app = express();

// Creating the server.
const server = http.createServer(app);

// So that we can use the router module that we have imported.
app.use(router);

// Giving the port number as 5000 and while deployment it will run on the PORT give which is present in the process/env/PORT.
const PORT = process.env.PORT || 5000;

// Listening the server on the port given.
server.listen(PORT, () => console.log(`Server is running on ${PORT}`));

// ---------------- Socket ----------------

// As in the new version we need to allow the cors of all the origin

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// We are adding an event on the io using "on" and the name of the event is connection.
// when the client connect it give an object which contain the infomation about the client.
// If the client disconnect we add a "disconnect" event.

io.on("connection", (socket) => {
  console.log("We have a new connection!!!");

  // Event trigger by the frontend side.
  socket.on("join", ({ name, room }, callback) => {
    // As ther addUser function can return two thing the error as the user is already present with that name or the user is added sucessfully.
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    // Telling the user that he is welcome as the admin.
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to the room ${user.room} `,
    });

    // Tell all the other in the room that they have join.
    // Broadcasting the message to the sepecific room only.
    if (user.room === undefined) return;
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name}, has joined!` });

    // In build methods which join the user in the room
    socket.join(user.room);

    callback();
  });

  // waiting for the client to message.
  socket.on("sendMessage", (message, callback) => {
    // getting the user id.
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    callback();
  });

  socket.on("disconnect", () => {
    // console.log("User had left !");
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left.`,
      });
    }
  });
});
