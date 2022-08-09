import { atom } from "jotai";
import { io } from "socket.io-client";
import { Card } from "./models/Card";
import { GameState } from "./models/GameState";
import { Player, PlayerGameRoomState } from "./models/Player";

export const socketAtom = atom(io());

export const gameStateAtom = atom<GameState | null>(null);

export const roomIdAtom = atom('');
export const playerIdAtom = atom('');


export const playerActionStateAtom = atom(PlayerGameRoomState.Waiting);

export const selectedPlayerAtom = atom<Player | null>(null);
export const selectedCardAtom = atom<Card | null>(null);

export const isHintFormOpenAtom = atom(false);
export const isYourTurnAtom = atom(false);