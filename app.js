var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var users = [];
app.use(express.static(__dirname+"/public"));
io.on("connection", function (socket) {
  socket.on('login', function (data) {
    users.push(data);
  });
});
server.listen(3000);