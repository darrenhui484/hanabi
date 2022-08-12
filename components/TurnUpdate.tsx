import styles from '../styles/TurnUpdate.module.scss'

import { motion } from 'framer-motion';
import { useAtom } from "jotai";
import { playerIdAtom } from '../store';
import PlayerActionItem from './PlayerActionItem';
import { GameState } from '../models/GameState';

interface ITurnUpdate {
    onAnimationComplete: () => void;
    gameState: GameState;
}

export default function TurnUpdate({ onAnimationComplete, gameState }: ITurnUpdate) {

    const [myPlayerId, _setMyPlayerId] = useAtom(playerIdAtom);

    const variants = {
        modalOpen: {
            opacity: [0, 1, 0]
        }
    }

    function determineDisplayUserString(): string {
        const currentPlayerTurn = gameState.whoseTurn();
        if (currentPlayerTurn.id === myPlayerId) return 'Your';
        return `${currentPlayerTurn.username}\'s`
    }

    return (
        <motion.div
            animate={'modalOpen'}
            variants={variants}
            transition={{ duration: 3, times: [0, 0.2, 1] }}
            onAnimationComplete={() => onAnimationComplete()}
            className={styles.main}>
            <div className={styles.turn}>{`${determineDisplayUserString()} turn`}</div>
            {gameState.getLastPlayerAction() == null ? null : <PlayerActionItem playerList={gameState.players} playerAction={gameState.getLastPlayerAction()!} />}
        </motion.div>
    )
}