import { WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 8080 });

server.on("connection", (socket) => {
  console.log("Client connecté");

  socket.on("message", (message) => {
    console.log("Reçu :", message);
    socket.send("Serveur a reçu : " + message);
  });

  socket.on("close", () => {
    console.log("Client déconnecté");
  });
});

console.log("Serveur WebSocket lancé sur le port 8080");

