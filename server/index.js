// server.js
const express = require("express");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = https.createServer(
	{
		key: fs.readFileSync("certs/key.pem"),
		cert: fs.readFileSync("certs/cert.pem"),
	},
	app
);

const io = new Server(server, {
	cors: { origin: "*" },
});

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	socket.on("join-room", (roomCode) => {
		socket.join(roomCode);
		console.log(`${socket.id} joined room ${roomCode}`);

		const users = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
		if (users.length > 1) {
			io.to(users[0]).emit("ready");
		}
	});

	socket.on("offer", ({ room, data }) => {
		socket.to(room).emit("offer", { data });
	});

	socket.on("answer", ({ room, data }) => {
		socket.to(room).emit("answer", { data });
	});

	socket.on("candidate", ({ room, data }) => {
		socket.to(room).emit("candidate", { data });
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
	});
});

server.listen(3000, () => {
	console.log("Server running at https://localhost:3000");
});
