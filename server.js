import { WebSocketServer } from "ws";

// Liste des joueurs connectés
let players = []; 
let nextId = 1;

// Création du serveur WS
const server = new WebSocketServer({ port: 8080 });

server.on("connection", (socket) => {

  // Crée un joueur
  const player = {
    id: nextId++,
    socket: socket
  };

  // Ajoute à la liste
  players.push(player);

  console.log("Nouveau joueur connecté :", player.id);

  // Envoie son ID au joueur
  socket.send(JSON.stringify({
    type: "welcome",
    id: player.id
  }));

  // Quand un message arrive
  socket.on("message", (msg) => {
    console.log(`Message du joueur ${player.id} :`, msg.toString());
  });

  // Quand il se déconnecte
  socket.on("close", () => {
    console.log("Déconnexion du joueur :", player.id);

    players = players.filter(p => p.id !== player.id);
  });
});

console.log("Serveur WebSocket lancé sur le port 8080");


