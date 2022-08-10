import { useRef } from 'react';
import { Card } from '../models/Card';
import { Hint } from '../models/Hint';
import styles from '../styles/HintItem.module.scss';
import { joinClassNames } from '../util/util';

interface IHintItem {
    color?: Card.Color;
    number?: number;
    onSelected?: (color?: Card.Color, number?: number) => void;
    isDisplay?: boolean
}

export default function HintItem({ color, number, onSelected, isDisplay = false }: IHintItem) {

    function handleOnClick(color?: Card.Color, number?: number) {
        if (onSelected == null) return;
        onSelected(color, number)
    }

    function generateCSSClass(color?: Card.Color, number?: number) {
        if (color != null) {
            switch (color) {
                case Card.Color.Red: return isDisplay ? joinClassNames(styles['dot-display'], styles.red) : joinClassNames(styles.dot, styles.red);
                case Card.Color.Blue: return isDisplay ? joinClassNames(styles['dot-display'], styles.blue) : joinClassNames(styles.dot, styles.blue);
                case Card.Color.White: return isDisplay ? joinClassNames(styles['dot-display'], styles.white) : joinClassNames(styles.dot, styles.white);
                case Card.Color.Yellow: return isDisplay ? joinClassNames(styles['dot-display'], styles.yellow) : joinClassNames(styles.dot, styles.yellow);
                case Card.Color.Green: return isDisplay ? joinClassNames(styles['dot-display'], styles.green) : joinClassNames(styles.dot, styles.green);
            }
        } else if (number != null) {
            return isDisplay ? styles['number-display'] : styles.number;
        }

    }

    return (
        <div onClick={event => handleOnClick(color, number)} className={generateCSSClass(color, number)}>{number}</div>
    );

}