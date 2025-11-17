import { WebSocketServer } from "ws";

const server = new WebSocket.Server({ port: 8080 });

let rooms = {}; // { roomCode: { players: [], word: "...", guessed: [] }}

server.on("connection", socket => {

    socket.on("message", message => {
        const data = JSON.parse(message);

        // CREATE ROOM
        if (data.type === "createRoom") {
            const code = Math.random().toString(36).substring(2, 7).toUpperCase();
            
            rooms[code] = {
                players: [socket],
                word: data.word.toUpperCase(),
                guessed: []
            };

            socket.send(JSON.stringify({
                type: "roomCreated",
                room: code
            }));
        }

        // JOIN ROOM
        if (data.type === "joinRoom") {
            const room = rooms[data.room];

            if (!room) {
                socket.send(JSON.stringify({ type: "error", message: "Room not found" }));
                return;
            }

            room.players.push(socket);

            socket.send(JSON.stringify({
                type: "joined",
                wordSize: room.word.length
            }));
        }

        // PLAYER GUESS LETTER
        if (data.type === "guess") {
            const room = rooms[data.room];
            if (!room) return;

            const letter = data.letter.toUpperCase();

            if (!room.guessed.includes(letter)) {
                room.guessed.push(letter);
            }

            let positions = [];
            for (let i = 0; i < room.word.length; i++) {
                if (room.word[i] === letter) positions.push(i);
            }

            for (let player of room.players) {
                player.send(JSON.stringify({
                    type: "result",
                    letter,
                    positions
                }));
            }
        }
    });
});

console.log("Server running on port 8080");

