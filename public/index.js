$(function() {
	var socket = io.connect();

	function admin() {
		var oldder;
		$(".nexttopic").click(function() {
			socket.emit("admin_settopic", $(".admin .topic").val());
			$(".list").html("");
		});
		socket.on("admin_getquestion", function(data) {
			var html = "";
			for (var i = 0; i < data.length; i++) {
				html += "<div class=\"bg-info\">" + data[i].name + ":" + data[i].question + "</div>";
			}
			if(oldder !== html) {
				$(".list").html(html);
				oldder = html;	
			}
		});
		socket.on("count", function(data) {
			$(".totalCount").text(data.total);
			$(".completedCount").text(data.completed);
		});
	}

	function show(name) {
		$(".login,.wait,.result").hide();
		$("." + name).show();
	}

	function client() {
		var name;
		$(".form").submit(function(e) {
			name = $(".login .name").val();
			if (name !== "") {
				show("wait");
				setInterval(function() {
					socket.emit("client_keep", name);
				}, 3000);
				socket.emit("client_login", name);
			} else {
				alert("請輸入名稱");
			}
			e.preventDefault();
		});
		$("#completed").change(function() {
			socket.emit("client_result", {
				name: name,
				result: $(this).is(":checked")
			});
		});
		$(".question").keyup(function() {
			socket.emit("client_question", {
				name: name,
				question: $(this).val()
			});
		});
		socket.on("client_newtopic", function(data) {
			if (name) {
				if (data) {
					show("result");
					$(".result .name").text(name);
					$(".result .topic").text(data);
					$("#completed").attr("checked", false);
					$(".question").val("");
				} else {
					show("wait");
				}
			}
		});
		socket.on("client_repeatname", function(data) {
			alert("重複名稱");
			show("login");
			name=null;
		});
		socket.on("disconnect", function() {
			alert("伺服器斷線");
			show("login");
			name=null;
		});
	}
	(function() {
		if (location.search === "?admin") {
			$(".admin").show();
			admin();
		} else {
			$(".client").show();
			client();
		}
	})(); //init

});