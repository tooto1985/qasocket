$(function() {

	var socket = io.connect();

	function admin() {

		$(".nexttopic").click(function() {
			var data = $(".admin .topic").val();
			$(".status").removeClass("on off").addClass(data?"on":"off");
			$(".list").html("");
			socket.emit("admin_settopic", data);
		});

		$(".admin .broadcast").keyup(function() {
			socket.emit("admin_broadcast", $(this).val());
		});

		socket.on("admin_getquestion", function(data) {
			var $div = $(".list>div[name='" + data.name + "']");
			if ($div.length === 0) {
				$(".list").append("<div class=\"bg-info\" name=\"" + data.name + "\"></div>");
				$div = $(".list>div[name='" + data.name + "']");
			}
			if (data.question !== "") {
				$div.html(data.name + "：" + replaceHTML(data.question));
			} else {
				$div.remove();
			}
			if ($(".list>div").length>0) {
				$(".listtitle").show();
			} else {
				$(".listtitle").hide();
			}
		});

		socket.on("admin_getbroadcast",function(data) {
			$(".admin .broadcast").text(data);
		});

		socket.on("count", function(data) {
			var progress = Math.round((data.completed.length / data.total.length) * 100);
			if (isNaN(progress)) {
				progress = 0;
			}
			$(".admin .progress-bar").attr("aria-valuenow", progress).width(progress + "%").text(progress + "%");
			$(".list>div").not((function() {
				var selector = "";
				for (var i = 0, max = data.total.length; i < max; i++) {
					if (selector === "") {
						selector = "div[name='" + data.total[i] + "']";
					} else {
						selector += ",div[name='" + data.total[i] + "']";
					}
				}
				return selector;
			})()).remove();
			if ($(".list>div").length>0) {
				$(".listtitle").show();
			} else {
				$(".listtitle").hide();
			}
			$(".totalCount").text(data.total.length);
			$(".completedCount").text(data.completed.length);
		});

		socket.on("admin_reloadtopic", function(data) {
			$(".status").removeClass("on off").addClass(data?"on":"off");
			$(".admin .topic").val(data);
		});

		socket.emit("admin_reload", null);

	}

	function replaceHTML(html) {
		return html.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
	}

	function show(name) {
		$(".login,.wait,.result").hide();
		$("." + name).show();
	}

	function client() {
		var sid;
		var name;
		$(".form").submit(function(e) {
			name = $(".login .name").val();
			if (name !== "") {
				show("wait");
				sid = setInterval(function() {
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

		$(".button").on("click",function() {
			$(this).addClass("clicked");
			$("#completed").attr("checked", true);
			$("#completed").change();
		});

		socket.on("client_newtopic", function(data) {
			if (name) {
				if (data) {
					show("result");
					$(".result .name").text(name);
					$(".result .topic").text(data);
					//$(".button").removeClass("clicked");
					//$(".button>span").text("完成"+data+"範例");
					$("#completed").attr("checked", false);
					$(".question").val("");
				} else {
					show("wait");
				}
			}
		});
		socket.on("count", function(data) {
			var progress = Math.round((data.completed.length / data.total.length) * 100);
			$(".result .progress-bar").attr("aria-valuenow", progress).width(progress + "%").text(progress + "%");
		});
		socket.on("client_getbroadcast",function(data) {
			if (data) {
				$(".broadcasttitle").show();
			} else {
				$(".broadcasttitle").hide();
			}
			$(".result .broadcast").html(replaceHTML(data));
		});
		socket.on("client_repeatname", function(data) {
			alert("重複名稱");
			show("login");
			name = null;
		});
		socket.on("disconnect", function() {
			alert("伺服器斷線");
			show("login");
			name = null;
			clearInterval(sid);
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
		(function() {
			window.onbeforeunload = function(e) {
				var message = "按錯了嗎！",
					e = e || window.event;
				if (e) {
					e.returnValue = message;
				}
				return message;
			};
		})();

	})(); //init

});