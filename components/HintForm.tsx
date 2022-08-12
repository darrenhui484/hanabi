import { Hint } from '../models/Hint';
import styles from '../styles/HintForm.module.scss';
import { joinClassNames } from '../util/util';
import { useAtom } from "jotai";
import { selectedPlayerAtom, isHintFormOpenAtom } from '../store';
import { Card } from '../models/Card';
import { CSSProperties, useState } from 'react';
import HintItem from './HintItem';
import { motion } from 'framer-motion';

interface IHintFormProps {
    handleSubmitHint: (hint: Hint) => void;
}

export default function HintForm({ handleSubmitHint: handleSubmitHint }: IHintFormProps) {

    const [selectedPlayer, setSelectedPlayer] = useAtom(selectedPlayerAtom);
    const [isHintFormOpen, setIsHintFormOpen] = useAtom(isHintFormOpenAtom);

    const variants = {
        open: {
            y: '0px',
            x: '-50%',
            display: 'block'
        },
        closed: {
            y: '132px',
            x: '-50%',
            transitionEnd: { display: "none" },
        }
    }

    function selectHint(color?: Card.Color, number?: number) {
        let hint: Hint;
        if (color != null) {
            hint = new Hint(Hint.HintType.Color, color, selectedPlayer!.id);
        } else if (number != null) {
            hint = new Hint(Hint.HintType.Number, number, selectedPlayer!.id);
        } else {
            throw new Error('illegal hint state');
        }
        handleSubmitHint(hint);
    }

    return (
        <motion.div
            animate={isHintFormOpen ? 'open' : 'closed'}
            variants={variants}
            transition={{ duration: 0.2 }}
            initial={'closed'}
            className={styles['options-container']}
        >
            <div className={styles.container}>
                {Card.Colors.map((color, index) => <HintItem key={index} color={color} onSelected={selectHint} />)}
            </div>
            <div className={styles.container}>
                {Array(5).fill(0).map((_, index) => <HintItem key={index} number={index + 1} onSelected={selectHint} />)}
            </div>
        </motion.div>
    );
}