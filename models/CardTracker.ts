import { Card } from "./Card";

export class CardTracker {
    cardCountMap: Map<Card.Color, Array<number>>;
    numberOfCards: number;

    constructor(isDeck = false) {
        this.cardCountMap = new Map<Card.Color, Array<number>>();
        this.numberOfCards = 0;
        for (const color of Card.Colors) {
            if (isDeck) {
                this.cardCountMap.set(color, [3, 2, 2, 2, 1]);
                this.numberOfCards += 10;
            } else {
                this.cardCountMap.set(color, [0, 0, 0, 0, 0]);
            }
        }
    }

    // drawCard(): Card {
    //     const cardToDraw = Math.floor(this.numberOfCards * Math.random());
    //     let cardCounter = 0;
    //     for (const color of Card.Colors) {
    //         const cardCountArray = this.getCardCountArray(color);
    //         for (let i = 0; i < cardCountArray.length; i++) {
    //             cardCounter += cardCountArray[i];
    //         }
    //     }
    // }

    removeCard(card: Card): void {
        if (card.number < 1 || card.number > 5) throw new Error('invalid card number');
        const currentValue = this.getCardCountArray(card.color)[card.number - 1];
        if (currentValue <= 0) throw new Error('attempting to remove card from empty pile');
        this.getCardCountArray(card.color)[card.number - 1] = currentValue - 1;
        this.numberOfCards -= 1;
    }

    addCard(card: Card): void {
        if (card.number < 1 || card.number > 5) throw new Error('invalid card number');
        this.getCardCountArray(card.color)[card.number - 1] = this.getCardCountArray(card.color)[card.number - 1] + 1;
        this.numberOfCards += 1;
    }

    private getCardCountArray(color: Card.Color): Array<number> {
        return this.cardCountMap.get(color)!;
    }
}