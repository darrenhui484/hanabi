import { Card } from "./Card";

export interface IPlayedCards {
    cards: Map<Card.Color, number>;
}

export interface IPlayedCardsSerialized {
    cards: Array<[Card.Color, number]>
}

export class PlayedCards {
    cards: Map<Card.Color, number>

    static serialize(playedCards: PlayedCards): IPlayedCardsSerialized {
        return {
            cards: Array.from(playedCards.cards.entries())
        }
    }

    static deserialize(playedCardsSerialized: IPlayedCardsSerialized) {
        return new PlayedCards(new Map(playedCardsSerialized.cards));

    }

    constructor(cards: Map<Card.Color, number> | null = null) {
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
        this.cards.set(card.color, card.number);
    }

    isCardPlayable(card: Card): boolean {
        return this.cards.get(card.color) === card.number - 1;
    }
}