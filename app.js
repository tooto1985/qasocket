var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var topic = "";
var users = [];
var timeout = 5000;
var broadcast = "";
app.use(express.static(__dirname + "/public"));
io.on("connection", function(socket) {

	var _counts = {};
	var _broadcast = "";

	function count(isAdmin,isLogin) {
		var counts = {
			total: users.map(function(a) {
				return a.name;
			}),
			completed: users.filter(function(a) {
				return a.result === true;
			}).map(function(a) {
				return a.name;
			})
		};
		if (JSON.stringify(_counts) !== JSON.stringify(counts)) {
			if (isAdmin) {
				socket.emit("count", counts);
			} else {
			    socket.broadcast.emit("count", counts);
			}
			_counts = counts;
		}
		if (_broadcast !== broadcast || isLogin) {
			if(isLogin) {
				socket.emit("client_getbroadcast", broadcast);
			} else {
				socket.broadcast.emit("client_getbroadcast", broadcast);	
			}
			_broadcast = broadcast;
		}
	}

	socket.on("admin_settopic", function(data) {
		topic = data;
		socket.broadcast.emit("client_newtopic", topic);
		for (var i = 0, max = users.length; i < max; i++) {
			users[i].result = null;
			users[i].question = "";
		}
	});

	socket.on("admin_reload", function() {
		count(true);
		setTimeout(function() {
			socket.emit("admin_reloadtopic", topic);
			for (var i = 0; i < users.length; i++) {
				socket.emit("admin_getquestion", {name:users[i].name,question:users[i].question});
			}			
			socket.emit("admin_getbroadcast", broadcast);
		},0);
	});

	socket.on("admin_broadcast",function(data) {
		broadcast = data;
		socket.broadcast.emit("client_getbroadcast", broadcast);
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
			count(false,true);
		}
	});

	socket.on("client_keep", function(data) {
		var alive = false;
		for (var i = 0; i < users.length; i++) {
			if (users[i].name === data) {
				users[i].time = new Date().getTime();
				alive = true;
			}
		}
		if (!alive && data) {
			users.push({
				name: data,
				time: new Date().getTime(),
				result: null,
				question: ""
			});
			if (topic) {
				socket.emit("client_newtopic", topic);
			}
		}
		count();
	});

	socket.on("client_result", function(data) {
		for (var i = 0; i < users.length; i++) {
			if (data && users[i].name === data.name) {
				users[i].result = data.result;
			}
		}
	});

	socket.on("client_question", function(data) {
		for (var i = 0; i < users.length; i++) {
			if (data && users[i].name === data.name) {
				users[i].question = data.question;
				socket.broadcast.emit("admin_getquestion", data);
			}
		}
	});

	setInterval(function() {
		users = users.filter(function(a) {
			return new Date().getTime() - a.time < timeout;
		});
		count();
	}, 3000);
});
server.listen(5000);
console.log("running");