import { Card } from "./Card";
import { Hint } from "./Hint";
import { IPlayedCardsSerialized, PlayedCards } from "./PlayedCards";
import { Player, PlayerAction } from "./Player";

export interface IGameState {
    isGameRunning: boolean;
    lastRoundCounter: number;
    currentPlayerTurn: number;
    players: Array<Player>;
    hintsMax: number;
    hints: number;
    bombs: number;
    deck: Array<Card>;
    discardPile: Array<Card>;
    playedCards: PlayedCards;
    eventLog: Array<PlayerAction>
}

export interface IGameStateSerialized extends Omit<IGameState, 'playedCards'> {
    playedCards: IPlayedCardsSerialized;
}

export class GameState implements IGameState {
    isGameRunning: boolean;
    lastRoundCounter: number;
    currentPlayerTurn: number;
    players: Array<Player>;
    hintsMax: number;
    hints: number;
    bombs: number;
    deck: Array<Card>;
    discardPile: Array<Card>;
    playedCards: PlayedCards;
    eventLog: Array<PlayerAction>

    constructor(hintCount = 8, bombCount = 3) {
        this.players = [];
        this.isGameRunning = false;
        this.lastRoundCounter = -1;
        this.currentPlayerTurn = 0;
        this.hintsMax = hintCount;
        this.hints = this.hintsMax;
        this.bombs = bombCount;
        this.deck = this.initializeDeck();
        this.discardPile = []
        this.playedCards = new PlayedCards();
        this.eventLog = []
    }

    static serialize(gameState: GameState): IGameStateSerialized {
        let gameStateLiteral = JSON.parse(JSON.stringify(gameState));
        delete gameStateLiteral['cards'];
        let result: IGameStateSerialized = {
            ...gameStateLiteral,
            playedCards: PlayedCards.serialize(gameState.playedCards),
        }
        return result;
    }

    static deserialize(gameStateSerialized: IGameStateSerialized) {
        let newGameState = new GameState();
        newGameState.players = gameStateSerialized.players.map((player) => Player.deserialize(player));
        newGameState.isGameRunning = gameStateSerialized.isGameRunning;
        newGameState.lastRoundCounter = gameStateSerialized.lastRoundCounter;
        newGameState.currentPlayerTurn = gameStateSerialized.currentPlayerTurn;
        newGameState.hintsMax = gameStateSerialized.hintsMax;
        newGameState.hints = gameStateSerialized.hints;
        newGameState.bombs = gameStateSerialized.bombs;
        newGameState.deck = gameStateSerialized.deck;
        newGameState.discardPile = gameStateSerialized.discardPile;
        newGameState.playedCards = PlayedCards.deserialize(gameStateSerialized.playedCards);
        newGameState.eventLog = gameStateSerialized.eventLog;
        return newGameState;
    }

    private drawCard(): Card | null {
        if (this.deck.length <= 0) return null;
        return this.deck.pop()!;
    }

    private addHint(): void {
        if (this.hints < this.hintsMax) this.hints++;
    }

    private removeBomb(): void {
        this.bombs -= 1;
    }

    private addPlayedCard(card: Card): void {
        this.playedCards.addCard(card);
    }

    private addDiscard(card: Card): void {
        this.discardPile.push(card);
    }

    getTurnsPassed() {
        return this.eventLog.length;
    }

    getScore() {
        return Array.from(this.playedCards.cards)
            .map((playedCard) => playedCard[1])
            .reduce((prev, current) => prev + current);
    }

    isGameOver(): boolean {
        return this.bombs === 0 || this.lastRoundCounter == 0 || this.getScore() === 25;
    }

    private initializeDeck(): Array<Card> {
        const cards = [];
        for (let i = 0; i < Card.Colors.length; i++) {
            // 3 1-cards
            for (let _ = 0; _ < 3; _++) {
                cards.push(new Card(Card.Colors[i], 1));
            }
            // 2 2,3,4 cards
            for (let cardNumber = 2; cardNumber < 5; cardNumber++) {
                for (let _ = 0; _ < 2; _++) {
                    cards.push(new Card(Card.Colors[i], cardNumber));
                }
            }

            // 1 5-card
            cards.push(new Card(Card.Colors[i], 5));
        }
        return this.shuffle(cards);
    }

    private initDeckTest() {
        const cards = []
        for (let i = 0; i < 13; i++) {
            cards.push(new Card(Card.Colors[0], 1))
        }
        return cards;
    }

    private print(cards: Card[]) {
        const result: Array<[string, number]> = cards.map((card) => [Card.Color[card.color], card.number])
        console.log(result);
    }

    private shuffle(array: Array<any>): Array<any> {
        let currentIndex = array.length;
        let randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    private updateCurrentPlayerTurn() {
        this.currentPlayerTurn = (this.currentPlayerTurn + 1) % this.players.length;
    }

    getLastPlayerAction(): PlayerAction | null {
        if (this.eventLog.length <= 0) return null;
        return this.eventLog[this.eventLog.length - 1];
    }

    whoseTurn(): Player {
        if (this.currentPlayerTurn < 0 || this.currentPlayerTurn > this.players.length) throw new Error('turn index out of bounds');
        return this.players[this.currentPlayerTurn];
    }

    startGame(): void {
        this.isGameRunning = true;
        this.lastRoundCounter = this.players.length + 1; // gameloop runs the moment deck hits 0
        this.currentPlayerTurn = 0//Math.floor(Math.random() * this.players.length);
        const handSize = this.players.length >= 4 ? 5 : 4;
        for (const player of this.players) {
            for (let i = 0; i < handSize; i++) {
                player.addToHand(this.drawCard()!)
            }
        }
    }

    isFull(): boolean {
        if (this.isGameRunning) {
            return !this.hasEmptySeats();
        } else {
            return this.players.length >= 5;
        }
    }

    private hasEmptySeats(): boolean {
        return this.getAnyEmptyPlayerSeat() !== null;
    }

    areAllEmptySeats(): boolean {
        return this.players.find(player => player.isEmptySeat == false) == null;
    }

    addPlayer(player: Player): void {
        if (this.players.length >= 5) return;
        this.players.push(player);
    }

    removePlayer(socketId: string): void {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].socketId === socketId) {
                this.players.splice(i, 1);
                return;
            }
        }
    }

    emptyPlayerSeat(socketId: string) {
        const player = this.getPlayerBySocketId(socketId);
        if (player == null) throw new Error('could not find player to empty seat');
        player.isEmptySeat = true;
    }

    getAnyEmptyPlayerSeat() {
        const player = this.players.find(player => player.isEmptySeat === true);
        return player == null ? null : player;
    }

    getPlayer(playerId: string): Player | null {
        const player = this.players.find(player => player.id === playerId);
        return player == null ? null : player;
    }

    getPlayerByUsername(username: string): Player | null {
        const player = this.players.find(player => player.username === username);
        return player == null ? null : player;
    }

    getPlayerBySocketId(socketId: string) {
        const player = this.players.find(player => player.socketId === socketId);
        return player == null ? null : player;
    }

    getPlayerWithCard(cardId: string): Player | null {
        for (const player of this.players) {
            if (player.hasCard(cardId)) return player;
        }
        return null;
    }

    // runs after every player action
    gameLoop() {
        if (this.deck.length == 0) this.lastRoundCounter -= 1;
    }

    handlePlayCardAction(playerId: string, cardId: string): void {
        const player = this.getPlayer(playerId)!;
        const card = player.removeFromHand(cardId);
        if (this.playedCards.isCardPlayable(card)) {
            if (card.number === 5) this.addHint();
            this.addPlayedCard(card);
        } else {
            this.addDiscard(card);
            this.removeBomb();
        }
        const drawnCard = this.drawCard();
        if (drawnCard) player.addToHand(drawnCard);
        this.updateCurrentPlayerTurn();
    }

    handleDiscardCardAction(playerId: string, cardId: string): void {
        const player = this.getPlayer(playerId)!;
        const card = player.removeFromHand(cardId);
        this.addDiscard(card);
        this.addHint();
        const drawnCard = this.drawCard();
        if (drawnCard) player.addToHand(drawnCard);
        this.updateCurrentPlayerTurn();
    }

    handleGiveHint(hint: Hint): void {
        this.hints -= 1;
        const playerHand = this.getPlayer(hint.targetPlayerId)!.hand;

        //TODO apply inverse logic of hints also

        for (const card of playerHand) {
            switch (card.hintApplied) {
                case Card.HintApplied.None:
                    if (hint.type === Hint.HintType.Color) {
                        if (card.color === hint.value) card.hintApplied = Card.HintApplied.Color
                    } else {
                        if (card.number === hint.value) card.hintApplied = Card.HintApplied.Number
                    }
                    break;
                case Card.HintApplied.Number:
                    if (hint.type === Hint.HintType.Color && card.color === hint.value) {
                        card.hintApplied = Card.HintApplied.ColorAndNumber
                    }
                    break;
                case Card.HintApplied.Color:
                    if (hint.type === Hint.HintType.Number && card.number === hint.value) {
                        card.hintApplied = Card.HintApplied.ColorAndNumber
                    }
                    break;
            }
        }

        this.updateCurrentPlayerTurn();
    }
}