$(function() {
	var socket = io.connect();
	var loginname;
	$(".loginform").submit(function(e) {
		loginname = $(".loginname").val();
		if (loginname !== "") {
			$(".login").hide();
			$(".control").show();
			$(".controlname").text(loginname);
			setInterval(function() {
				socket.emit('login', loginname);
			},10000);
		} else {
			alert("請輸入名稱");
		}
		e.preventDefault();
	});
});