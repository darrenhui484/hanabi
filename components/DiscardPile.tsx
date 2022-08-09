import { useEffect, useState } from 'react';
import { Card as CardModel } from '../models/Card';
import styles from '../styles/DiscardPile.module.scss';
import Card from './Card';
import CardList from './CardList';

export interface IDiscardPileProps {
    cards: Array<CardModel> | undefined
}

export default function DiscardPile({ cards }: IDiscardPileProps) {

    const [discardedCards, setDiscardedCards] = useState(new Map());

    useEffect(() => {
        if (cards == null) return;
        let colorMap = new Map<CardModel.Color, Map<number, number>>();
        for (const color of CardModel.Colors) {
            colorMap.set(color, new Map());
        }

        for (const card of cards) {
            const numberCountMap = colorMap.get(card.color)!
            const numberCount = numberCountMap.get(card.number);

            if (numberCount == null) {
                numberCountMap.set(card.number, 1);
            } else {
                numberCountMap.set(card.number, numberCount + 1);
            }
        }
        setDiscardedCards(colorMap);

    }, [cards])

    function displayCards(colorMap: Map<CardModel.Color, Map<number, number>>) {
        let result: Array<CardModel[]> = []
        let color: CardModel.Color | null = null;
        for (const [currentColor, numberCountMap] of Array.from(colorMap)) {
            if (currentColor !== color) {
                color = currentColor;
                result.push([] as CardModel[]);
            }

            const cards = Array.from(numberCountMap)
                .map((numberCount, index) => new CardModel(currentColor, numberCount[0], '', numberCount[1]))
                .sort((a, b) => (a.color * 10 + a.number) - (b.color * 10 + b.number));

            result.push(cards);
        }

        return result.map((cards, index) => (<CardList key={index} cards={cards} isHorizontal={false} />));
    }

    return (
        <div className={styles.main}>
            Discard Pile
            <div className={styles['cards-container']}>
                {discardedCards ? displayCards(discardedCards) : null}
            </div>
        </div>
    );
}