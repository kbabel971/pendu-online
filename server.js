import http from "http";
import fs from "fs";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

// Lire le fichier une seule fois
let words = [];
try {
  const data = fs.readFileSync("WordList.txt", "utf8");
  words = data.split(/\r?\n/).filter(w => w.trim().length > 0);
  console.log("Nombre de mots chargés :", words.length);
} catch (err) {
  console.error("Erreur lecture WordList.txt :", err);
}

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

let currentWord = null;  // <<< mot global partagé par tous

// Serveur HTTP Render
const server = http.createServer();
server.listen(PORT, () => {
  console.log("HTTP server running on port", PORT);
});

// WebSocket
const wss = new WebSocketServer({ server });

let players = [];
let nextId = 1;

function broadcastPlayers() {
  const ids = players.map(p => p.id);
  const msg = JSON.stringify({
    type: "players",
    players: ids
  });
  players.forEach(p => p.socket.send(msg));
}

function broadcastWord() {
  const msg = JSON.stringify({
    type: "word",
    word: currentWord
  });
  players.forEach(p => p.socket.send(msg));
}

wss.on("connection", (socket) => {
  const player = {
    id: nextId++,
    socket: socket
  };

  players.push(player);
  console.log("Nouveau joueur :", player.id);

  broadcastPlayers();

  //Génère le mot si ce n'est pas déjà fait
  if (!currentWord) {
    currentWord = getRandomWord();
    console.log("Mot choisi :", currentWord);
  }

  //Envoie le même mot à CE joueur
  player.socket.send(JSON.stringify({
    type: "word",
    word: currentWord
  }));

  socket.on("message", (msg) => {
    console.log(`Message du joueur ${player.id} :`, msg.toString());
  });

  socket.on("close", () => {
    console.log("Déconnexion :", player.id);
    players = players.filter(p => p.id !== player.id);
    broadcastPlayers();
  });
});

console.log("WebSocket Server attaché !");








