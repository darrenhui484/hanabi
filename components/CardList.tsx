import { Card as CardModel } from '../models/Card';
import Card from './Card';
import styles from '../styles/CardList.module.scss';
import { joinClassNames } from '../util/util';


interface ICardListProps {
    cards: Array<CardModel>;
    handleOnClickCard?: (card: CardModel) => void;
    isHorizontal?: boolean;
    isHidden?: boolean;
    isSelected?: boolean;
}

export default function CardList({ cards, handleOnClickCard, isHorizontal, isHidden = false, isSelected = false }: ICardListProps) {
    return (
        <div className={isHorizontal ? joinClassNames(styles.main, styles.hand) : joinClassNames(styles.main, styles.display)}>
            {cards.map((card, index) => {
                return <Card key={index} card={card} handleOnClickCard={handleOnClickCard} isHidden={isHidden} />
            })}
        </div>
    );
}