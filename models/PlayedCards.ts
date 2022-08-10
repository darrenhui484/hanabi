import { Card } from "./Card";

export interface IPlayedCards {
    cards: Map<Card.Color, number>;
    isEmpty: boolean;
}

export interface IPlayedCardsSerialized {
    cards: Array<[Card.Color, number]>
    isEmpty: boolean;
}

export class PlayedCards implements IPlayedCards {
    cards: Map<Card.Color, number>
    isEmpty: boolean;

    static serialize(playedCards: PlayedCards): IPlayedCardsSerialized {
        return {
            cards: Array.from(playedCards.cards.entries()),
            isEmpty: playedCards.isEmpty
        }
    }

    static deserialize(playedCardsSerialized: IPlayedCardsSerialized) {
        return new PlayedCards(new Map(playedCardsSerialized.cards), playedCardsSerialized.isEmpty);

    }

    constructor(cards: Map<Card.Color, number> | null = null, isEmpty = true) {
        this.isEmpty = isEmpty;
        if (cards == null) {
            this.cards = new Map();
            for (const color of Card.Colors) {
                this.cards.set(color, 0);
            }
        } else {
            this.cards = cards;
        }

    }

    addCard(card: Card): void {
        this.isEmpty = false;
        this.cards.set(card.color, card.number);
    }

    isCardPlayable(card: Card): boolean {
        return this.cards.get(card.color) === card.number - 1;
    }
}