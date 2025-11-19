import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

// Serveur HTTP pour Render
const server = http.createServer();
server.listen(PORT, () => {
  console.log("HTTP server running on port", PORT);
});

// WebSocket attaché
const wss = new WebSocketServer({ server });

let players = [];
let nextId = 1;

// Envoie la liste des joueurs à tout le monde
function broadcastPlayers() {
  const ids = players.map(p => p.id);

  const msg = JSON.stringify({
    type: "players",
    players: ids
  });

  players.forEach(p => p.socket.send(msg));
}

wss.on("connection", (socket) => {
  const player = {
    id: nextId++,
    socket: socket
  };

  players.push(player);
  console.log("Nouveau joueur connecté :", player.id);

  // Met à jour tout le monde
  broadcastPlayers();

  socket.on("message", (msg) => {
    console.log(`Message du joueur ${player.id} :`, msg.toString());
  });

  socket.on("close", () => {
    console.log("Déconnexion du joueur :", player.id);

    players = players.filter(p => p.id !== player.id);
    broadcastPlayers();
  });
});

console.log("WebSocket Server attaché !");







