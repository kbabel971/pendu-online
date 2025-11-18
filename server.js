import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

// Serveur HTTP obligatoire pour Render
const server = http.createServer();
server.listen(PORT, () => {
  console.log("HTTP server running on port", PORT);
});

// Attache WebSocket sur le serveur HTTP
const wss = new WebSocketServer({ server });

let players = [];
let nextId = 1;

wss.on("connection", (socket) => {
  const player = {
    id: nextId++,
    socket: socket
  };

  players.push(player);
  console.log("Nouveau joueur connecté :", player.id);
  console.log("Joueurs connectés :", players.map(p => p.id));

  socket.send(JSON.stringify({
    type: "welcome",
    id: player.id
  }));

  socket.on("message", (msg) => {
    console.log(`Message du joueur ${player.id} :`, msg.toString());
  });

  socket.on("close", () => {
    console.log("Déconnexion du joueur :", player.id);
    console.log("Joueurs connectés :", players.map(p => p.id));
    players = players.filter(p => p.id !== player.id);
  });
});

console.log("WebSocket Server attaché !");




