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
let currentID = 0;
let playerTurn = 1;

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

function broadcastPlayerTurn() {
    const msg = JSON.stringify({
        type: "player_turn",
        turn: playerTurn
    });

    players.forEach(p => p.socket.send(msg));
}

wss.on("connection", (socket) => {
  const player = {
    id: nextId++,
    socket: socket
  };
 socket.send(JSON.stringify({
    type: "current_id",
    id: currentID
}));
  players.push(player);
  currentID++;
  console.log("Nouveau joueur :", player.id);
  
  broadcastPlayers();
  broadcastPlayerTurn();
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

    const data = JSON.parse(msg.toString());

  if (data.type === "letter") {
  console.log(`Joueur ${player.id} a envoyé la lettre : ${data.letter}`);

  // Vérifs basiques
  if (!currentWord || typeof data.letter !== "string" || data.letter.length === 0) {
    console.warn("Message letter invalide ou mot non chargé.");
    return;
  }

  // Vérifie si la lettre est dans le mot
  const isCorrect = currentWord.includes(data.letter);

  // Envoie le résultat de la lettre à tous les joueurs
  const response = JSON.stringify({
    type: "letter_result",
    player: player.id,
    letter: data.letter,
    correct: isCorrect
  });
  players.forEach(p => p.socket.send(response));

  // --- Mise à jour du tour ---
  // Si tu utilises playerTurn comme index basé sur 1..N (1 = 1er joueur)
  if (players.length > 0) {
    // trouve l'index (0-based) du joueur courant dans players
    const myIndex = players.findIndex(p => p.id === player.id);
    // calcule l'index du prochain joueur (round-robin)
    const nextIndex = (myIndex + 1) % players.length;
    // si tu veux stocker playerTurn en tant qu'ID du joueur :
    playerTurn = players[nextIndex].id;
    // si tu préfères un index 0-based :
    // playerTurnIndex = nextIndex;
  }

  // Diffuse le tour courant à tous
  broadcastPlayerTurn();
}
    });

  socket.on("close", () => {
  //  console.log("Déconnexion :", player.id);
  //  players = players.filter(p => p.id !== player.id);
   // broadcastPlayers();
  });
});

console.log("WebSocket Server attaché !");

