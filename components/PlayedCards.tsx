import { useEffect, useState } from 'react';
import { Card } from '../models/Card';
import { PlayedCards as PlayedCardModel } from '../models/PlayedCards';
import styles from '../styles/PlayedCards.module.scss';
import CardList from './CardList';

interface IPlayedCardsProps {
    playedCards: PlayedCardModel | undefined
}

export default function PlayedCards({ playedCards }: IPlayedCardsProps) {

    const [playedCardsState, setPlayedCardsState] = useState(playedCards);

    useEffect(() => {
        setPlayedCardsState(playedCards)
    }, [playedCards]);

    function formatCards(playedCards: PlayedCardModel): Array<Card> {
        let result = []
        for (const [color, value] of Array.from(playedCards.cards)) {
            if (value == 0) continue;
            result.push(new Card(color, value));
        }
        return result;
    }

    return (
        <div className={styles.main}>
            Played Cards
            <div className={styles['cards-container']}>
                {playedCardsState ? <CardList cards={formatCards(playedCardsState)} isHorizontal={true} /> : null}
            </div>
        </div>
    );
}