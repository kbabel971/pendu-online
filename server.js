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
let actuallyWordChar = [];

// Serveur HTTP Render
const server = http.createServer();
server.listen(PORT, () => {
  console.log("HTTP server running on port", PORT);
});

function reindexPlayers() {
    players.forEach((p, index) => {
        p.id = index + 1; // Joueur 1, Joueur 2, Joueur 3...
    });

    const msg = JSON.stringify({
        type: "players",
        players: players.map(p => p.id)
    });

    players.forEach(p => p.socket.send(msg));
}

// WebSocket
const wss = new WebSocketServer({ server });

let players = [];
//let nextId = 1;
let currentID = 0;
let playerTurn = 1;

let currentIndexImageLife = 0;

function broadCastImageLife()
{
   const msg = JSON.stringify({
    type: "Image_Life",
    currentImageLife: currentIndexImageLife
  });
  players.forEach(p => p.socket.send(msg));
}

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
    word: currentWord,
    actuWordChar: actuallyWordChar
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

let wrongLetter = [];

function broadCastWrongLetter()
{
  const msg = JSON.stringify({
    type: "wrong_letters",
    letters: wrongLetter
});

players.forEach(p => p.socket.send(msg));
}

let life = 5;
let lose = false;

function Lose()
{
  if(life === 0)
  {
    lose = true;
    const msg = JSON.stringify({
    type: "lose",
    lose: lose
});
    players.forEach(p => p.socket.send(msg));
  }
}

let win = false;
let currentWordChar = [];

function LetterIsInWord(playerLetter)
{
    currentWordChar = currentWord.split('');
  
  for(let i = 1 ; i < currentWordChar.length ; i++)
  {
    if(playerLetter.toUpperCase() === currentWordChar[i].toUpperCase())
    {
      actuallyWordChar[i] = playerLetter.toUpperCase();
    }
  }
}

function broadCastVerifWin()
{
  const msg = JSON.stringify({
    type: "verif_win",
    win : win
});

players.forEach(p => p.socket.send(msg));
}

function Win()
{
  for(let i = 0; i < actuallyWordChar.length; i++)
  {
    console.log(actuallyWordChar[i]);
  }
  if (!actuallyWordChar.includes('_')) 
  {
        win = true;
    }

  if(win)
  {
    const msg = JSON.stringify({
    type: "verif_win",
    win : win
});

   players.forEach(p => p.socket.send(msg));
}
  }

wss.on("connection", (socket) => {
   // CRÉATION DU JOUEUR AVEC UN ID BASÉ SUR LA LISTE
  const newId = players.length + 1;
  const player = {
    id: newId,
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
    actuallyWordChar = Array(currentWord.length).fill('_');
    actuallyWordChar[0] = currentWord[0]; // première lettre toujours affichée
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

  if (data.type === "letter" && !lose && !win) {
  console.log(`Joueur ${player.id} a envoyé la lettre : ${data.letter}`);

  // Vérifs basiques
  if (!currentWord || typeof data.letter !== "string" || data.letter.length === 0) {
    console.warn("Message letter invalide ou mot non chargé.");
    return;
  }
   
  // Vérifie si la lettre est dans le mot
  const isCorrect = currentWord.includes(data.letter);

    if(isCorrect)
    {
    
      LetterIsInWord(data.letter);
    }

  // Envoie le résultat de la lettre à tous les joueurs
  const response = JSON.stringify({
    type: "letter_result",
    player: player.id,
    letter: data.letter,
    correct: isCorrect
  });
  players.forEach(p => p.socket.send(response));
    //broadcastWord();

    if(isCorrect === false)
    {
      if(!wrongLetter.includes(data.letter))
      {
        wrongLetter.push(data.letter);
         broadCastWrongLetter();
      }

      broadCastImageLife();
      currentIndexImageLife++;
      life--;
    }


    Win();
     // verifie si le jeu est terminer par une defaite
    Lose();

  // --- Mise à jour du tour ---
playerTurn++;
    if(playerTurn > 2)
    {
      playerTurn = 1;
    }
  // Diffuse le tour courant à tous
  broadcastPlayerTurn();
}
   // if (data.type === "actually_Word_Char") {
        // data.actuallyWordChar est une string
       // const wordCharArray = data.actuallyWordChar.split(''); // transforme en tableau de caractères
      //  console.log("Mot reçu sous forme de tableau de lettres :", wordCharArray);
   // }
});

  socket.on("close", () => {
   console.log("Déconnexion :", player.id);

    // 1. On supprime le joueur
    players = players.filter(p => p.id !== player.id);

    if(players.length === 0)
    {
      playerTurn = 1;
      wrongLetter.length = 0;
      life = 5;
    }

   // 2. RÉINDEXATION DES JOUEURS RESTANTS
    players.forEach((p, index) => {
      p.id = index + 1;
    });

    // 3. On renvoie la nouvelle liste à tous les clients
    broadcastPlayers();
   // mise a jour de l'index pour afficher le joueur connecter
    currentID--;
  });
});

console.log("WebSocket Server attaché !");













