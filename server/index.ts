import express, { Request, Response } from "express";
import next from "next";
import { Server, Socket } from 'socket.io';
import { createServer } from "http";
import { instrument } from '@socket.io/admin-ui';
import { Card } from '../models/Card';
import { Player, PlayerAction, PlayerActionData } from '../models/Player';
import { GameState } from '../models/GameState';

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const expressApp = express();
const httpServer = createServer(expressApp);

const io = new Server(httpServer, {
    cors: {
        origin: ['https://admin.socket.io'],
        credentials: true
    }
});

let roomIdToGameStateMap = new Map<string, GameState>();

function handleFullRoom(gameState: GameState, socket: Socket, username: string) {
    if (gameState.isFull()) {
        socket.emit('full-room');
    } else {
        let player;
        if (gameState.isGameRunning) {
            player = gameState.getAnyEmptyPlayerSeat()!;
            player.replaceEmptyPlayer(username, socket.id);
        } else {
            player = new Player(socket.id, username)
            gameState.addPlayer(player);
        }
        socket.emit('joined-room', player.id);
    }
}

function emitGameState(eventName: string, roomId: string, io: Server) {
    const gameState = roomIdToGameStateMap.get(roomId)!;
    const gameStateSerialized = GameState.serialize(gameState);
    io.to(roomId).emit(eventName, gameStateSerialized);
}

class Validator {

    static doesCardExistInPlayerHand(card: Card | null, playerId: string, gameState: GameState): boolean {
        return card !== null && gameState.getPlayer(playerId)!.hasCard(card.id) !== null;
    }

    static canGiveHint(gameState: GameState): boolean {
        return gameState.hints > 0;
    }
}

io.on("connection", (socket: Socket) => {
    console.log(`connected: ${socket.id}`);

    socket.on('room-exists', (roomId: string) => {
        if (io.sockets.adapter.rooms.has(roomId)) {
            socket.emit('room-exists', true);
        } else {
            socket.emit('room-exists', false);
        }
    });

    socket.on('join-room', (roomId: string, username: string) => {
        socket.join(roomId);
        console.log(`socket ${socket.id} has joined room ${roomId}`);

        let gameState;
        if (roomIdToGameStateMap.has(roomId)) {
            gameState = roomIdToGameStateMap.get(roomId)!;
        } else {
            gameState = new GameState();
            roomIdToGameStateMap.set(roomId, gameState);
        }

        handleFullRoom(gameState, socket, username);
        emitGameState('update-game-state', roomId, io);
    });

    socket.on('start-game', (roomId: string) => {
        const gameState = roomIdToGameStateMap.get(roomId)!;
        gameState.startGame();
        emitGameState('update-game-state', roomId, io);
    })

    socket.on('player-action', (roomId: string, playerAction: PlayerAction) => {
        let gameState = roomIdToGameStateMap.get(roomId)!;
        // validate player action
        if (gameState.whoseTurn().id !== playerAction.playerId) return; // only player can act on their turn


        // modify game state

        switch (playerAction.data.type) {
            case Player.PlayerActionType.Play:
                let card = playerAction.data.card;
                if (!Validator.doesCardExistInPlayerHand(card, playerAction.playerId, gameState)) return;
                gameState.handlePlayCardAction(playerAction.playerId, card!.id);
                break;
            case Player.PlayerActionType.Discard:
                card = playerAction.data.card;
                if (!Validator.doesCardExistInPlayerHand(card, playerAction.playerId, gameState)) return;
                gameState.handleDiscardCardAction(playerAction.playerId, playerAction.data.card!.id);
                break;
            case Player.PlayerActionType.Hint:
                if (!Validator.canGiveHint(gameState)) return;
                gameState.handleGiveHint(playerAction.data.hint!);
                break;
        }
        gameState.eventLog.push(playerAction);
        gameState.gameLoop();

        // update game state
        roomIdToGameStateMap.set(roomId, gameState);
        emitGameState('update-game-state', roomId, io);

        if (gameState.isGameOver()) roomIdToGameStateMap.delete(roomId);
    })
});

io.of("/").adapter.on("leave-room", (roomId, socketId) => {
    console.log(`socket ${socketId} has left room ${roomId}`);
    const gameState = roomIdToGameStateMap.get(roomId)
    if (gameState == null) return;

    if (gameState.areAllEmptySeats()) {
        roomIdToGameStateMap.delete(roomId);
        return;
    }

    if (gameState.isGameRunning) {
        const player = gameState.getPlayerBySocketId(socketId);
        if (player == null) return;
        player.isEmptySeat = true;
        player.username = 'EMPTY';
    } else {
        gameState.removePlayer(socketId);
    }

    if (gameState.areAllEmptySeats()) {
        roomIdToGameStateMap.delete(roomId);
        return;
    }

    emitGameState('update-game-state', roomId, io);
});

instrument(io, { auth: false });

nextApp.prepare().then(() => {
    // define express api routes here

    expressApp.get('/list-gamestates', async (req, res) => {
        res.send({
            gameStates: Object.fromEntries(roomIdToGameStateMap)
        });
    });

    expressApp.get('/list-available-rooms', async (req, res) => {
        const result = [];
        for (const kvp of Array.from(roomIdToGameStateMap)) {
            const gameState = kvp[1];
            if (gameState.isFull() || gameState.isGameRunning) continue;
            result.push({ roomId: kvp[0], numberOfPlayers: kvp[1].players.length })
        }
        res.send({
            availableRooms: result
        });
    });

    expressApp.get('/clear-rooms', (req, res) => {
        roomIdToGameStateMap = new Map<string, GameState>();
    });

    // let nextjs manage routes in pages/api
    expressApp.all('*', (req, res) => {
        return handle(req, res)
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`)
    });
});


// function testShuffle() {
//     let deck = []
//     for (let i = 0; i < 50; i++) { deck.push(i) }
//     let tracker = []
//     for (let i = 0; i < 50; i++) {
//         tracker.push(Array(50).fill(0))
//     }
//     for (let i = 0; i < 1000000; i++) {
//         shuffle(deck)
//         for (let j = 0; j < deck.length; j++) {
//             tracker[j][deck[j]] += 1;
//         }
//     }
//     let max = 0, min = 999999;
//     for (let i = 0; i < tracker.length; i++) {
//         for (let j = 0; j < tracker[i].length; j++) {
//             max = Math.max(tracker[i][j], max)
//             min = Math.min(tracker[i][j], min)
//         }
//     }
//     return {
//         tracker: tracker,
//         max: max,
//         min: min
//     }
// }




