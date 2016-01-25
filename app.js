var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var topic = "";
var users = [];
var timeout = 5000;
app.use(express.static(__dirname + "/public"));
io.on("connection", function(socket) {
	socket.on("admin_settopic", function(data) {
		topic = data;
		socket.broadcast.emit("client_newtopic", topic);
		for (var i = 0; i < users.length; i++) {
			users[i].result = null;
			users[i].question = "";
		}
	});
	socket.on("client_login", function(data) {
		if (users.some(function(a) {
				return a.name === data;
			})) {
			socket.emit("client_repeatname", data);
		} else {
			users.push({
				name: data,
				time: new Date().getTime(),
				result: null,
				question: ""
			});
			if (topic) {
				socket.emit("client_newtopic", topic);
			}
			count();
		}
	});
	socket.on("client_keep", function(data) {
		for (var i = 0; i < users.length; i++) {
			if (users[i].name === data) {
				users[i].time = new Date().getTime();
			}
		}
		count();
	});
	socket.on("client_result", function(data) {
		for (var i = 0; i < users.length; i++) {
			if (users[i].name === data.name) {
				users[i].result = data.result;
			}
		}
	});
	socket.on("client_question", function(data) {
		for (var i = 0; i < users.length; i++) {
			if (users[i].name === data.name) {
				users[i].question = data.question;
			}
		}
		question();
	});

	function count() {
		var counts = {
			total: users.length,
			completed: users.filter(function(a) {
				return a.result === true;
			}).length
		};
		socket.broadcast.emit("count", counts);
	}

	function question() {
		var questions = users.filter(function(a) {
			return a.question !== "" && new Date().getTime() - a.time < timeout;;
		});
		socket.broadcast.emit("admin_getquestion", questions);
	}
	setInterval(function() {
		users = users.filter(function(a) {
			return new Date().getTime() - a.time < timeout;
		});
		count();
		question();
	}, 3000);
});
server.listen(3000);