import { useRef } from 'react';
import { Card } from '../models/Card';
import { Hint } from '../models/Hint';
import styles from '../styles/HintItem.module.scss';
import { joinClassNames } from '../util/util';

interface IHintItem {
    color?: Card.Color;
    number?: number;
    onSelected: (color?: Card.Color, number?: number) => void;
}

export default function HintItem({ color, number, onSelected: onSelected }: IHintItem) {

    function generateCSSClass(color?: Card.Color, number?: number) {
        if (color != null) {
            switch (color) {
                case Card.Color.Red: return joinClassNames(styles.dot, styles.red);
                case Card.Color.Blue: return joinClassNames(styles.dot, styles.blue);
                case Card.Color.White: return joinClassNames(styles.dot, styles.white);
                case Card.Color.Yellow: return joinClassNames(styles.dot, styles.yellow);
                case Card.Color.Green: return joinClassNames(styles.dot, styles.green);
            }
        } else if (number != null) {
            return styles.number;
        }

    }

    return (
        <div onClick={event => onSelected(color, number)} className={generateCSSClass(color, number)}>{number}</div>
    );

}