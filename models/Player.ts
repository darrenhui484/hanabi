import { Card } from "./Card";
import { v4 as uuidv4 } from 'uuid';
import { Hint } from "./Hint";

export interface IPlayer {
    socketId: string;
    username: string;
    hand: Array<Card>;
    id: string;
    isEmptySeat: boolean;
}

export class Player implements IPlayer {
    socketId: string;
    username: string;
    hand: Array<Card>;
    id: string;
    isEmptySeat: boolean;

    constructor(socketId: string, username: string, id = uuidv4(), hand = <Card[]>[], isEmptySeat = false) {
        this.socketId = socketId;
        this.username = username;
        this.hand = hand;
        this.id = id;
        this.isEmptySeat = isEmptySeat;
    }

    public equals(other: Player): boolean {
        return this.id === other.id;
    }

    replaceEmptyPlayer(username: string, socketId: string) {
        this.username = username;
        this.socketId = socketId;
        this.isEmptySeat = false;
    }

    addToHand(card: Card): void {
        this.hand.push(card);
    }

    hasCard(cardId: string): boolean {
        return this.hand.find((card) => cardId === card.id) != null;
    }

    removeFromHand(cardId: string): Card {
        for (let i = 0; i < this.hand.length; i++) {
            if (this.hand[i].id === cardId) {
                const card = this.hand[i];
                this.hand.splice(i, 1);
                return card;
            }
        }
        throw new Error('card does not exist in hand');
    }

    static deserialize(player: IPlayer): Player {
        return new Player(player.socketId, player.username, player.id, player.hand, player.isEmptySeat);
    }
}

export class PlayerAction {
    playerId: string;
    data: PlayerActionData;

    constructor(player: string, data: PlayerActionData) {
        this.playerId = player;
        this.data = data;
    }
}

export class PlayerActionData {
    type: Player.PlayerActionType;
    cardId: string | null;
    hint: Hint | null;

    constructor(type: Player.PlayerActionType, cardId: string | null, hint: Hint | null) {
        this.type = type;
        this.cardId = cardId;
        this.hint = hint;
    }
}

export namespace Player {
    export enum PlayerActionType {
        Hint,
        Play,
        Discard
    }
}

export enum PlayerGameRoomState {
    Waiting,
    PlayCard,
    DiscardCard,
    GiveHint
}