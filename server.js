import http from "http";
import fs from "fs";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

// Lire le fichier de mots UNE SEULE FOIS
let words = [];

try {
  const data = fs.readFileSync("WordList.txt", "utf8");
  words = data.split(/\r?\n/).filter(w => w.trim().length > 0);
  console.log("Nombre de mots chargés :", words.length);
} catch (err) {
  console.error("Erreur lecture WordList.txt :", err);
}

// Fonction pour choisir un mot random
function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

// Fonction pour envoyer un mot à tous les joueurs
function broadcastWord() {
  const mot = getRandomWord();
  
  const msg = JSON.stringify({
    type: "word",
    word: mot
  });

  players.forEach(p => p.socket.send(msg));
}

// Serveur HTTP pour Render
const server = http.createServer();
server.listen(PORT, () => {
  console.log("HTTP server running on port", PORT);
});

// WebSocket attaché
const wss = new WebSocketServer({ server });

let players = [];
let nextId = 1;

// Fonction pour envoyer liste joueurs
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

  broadcastPlayers();

  // ENVOIE UN MOT AU NOUVEAU JOUEUR
  player.socket.send(JSON.stringify({
    type: "word",
    word: getRandomWord()
  }));

  socket.on("message", (msg) => {
    console.log(`Message du joueur ${player.id} :`, msg.toString());
  });

  socket.on("close", () => {
    console.log("Déconnexion du joueur :", player.id);

    players = players.filter(p => p.id !== player.id);
    broadcastPlayers();
  });
});

console.log("WebSocket Server attaché !")









