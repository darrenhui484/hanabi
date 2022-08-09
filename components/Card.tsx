import { useId, useRef } from 'react';
import { Card as CardModel } from '../models/Card';
import styles from '../styles/Card.module.scss';
import { joinClassNames } from '../util/util';

interface ICardProps {
    card: CardModel;
    handleOnClickCard?: (card: CardModel) => void;
    isHidden?: boolean;
    count?: number;
}

export default function Card({ card, handleOnClickCard, isHidden = false }: ICardProps) {

    function determineColor(card: CardModel, isHidden: boolean): string {

        if (isHidden && [CardModel.HintApplied.None, CardModel.HintApplied.Number].includes(card.hintApplied)) {
            return joinClassNames(styles.main, styles.gray);
        }

        return generateColorCSSClasses(card.color);

    }

    function generateColorCSSClasses(color: CardModel.Color): string {
        switch (color) {
            case CardModel.Color.Blue:
                return joinClassNames(styles.main, styles.blue);
            case CardModel.Color.Red:
                return joinClassNames(styles.main, styles.red);
            case CardModel.Color.Yellow:
                return joinClassNames(styles.main, styles.yellow);
            case CardModel.Color.Green:
                return joinClassNames(styles.main, styles.green);
            case CardModel.Color.White:
                return joinClassNames(styles.main, styles.white);
        }
    }

    function showCardValue(card: CardModel): number | null {
        if (isHidden && [CardModel.HintApplied.None, CardModel.HintApplied.Color].includes(card.hintApplied)) {
            return null;
        }
        return card.number;

    }

    return (
        <div className={determineColor(card, isHidden)} onClick={event => handleOnClickCard != null ? handleOnClickCard(card) : null}>
            {showCardValue(card)}
            <div className={styles.countFont}>
                {card.uiCount > 1 ? `x${card.uiCount}` : null}
            </div>
        </div>
    )

}