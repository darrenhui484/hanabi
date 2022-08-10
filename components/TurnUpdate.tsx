import styles from '../styles/TurnUpdate.module.scss'

import { motion } from 'framer-motion';
import { useAtom } from "jotai";
import { Player, PlayerAction } from '../models/Player';
import { playerIdAtom } from '../store';
import PlayerActionItem from './PlayerActionItem';
import { GameState } from '../models/GameState';

interface ITurnUpdate {
    onAnimationComplete: () => void;
    isModalOpen: boolean
    gameState: GameState;
}

export default function TurnUpdate({ onAnimationComplete, isModalOpen, gameState }: ITurnUpdate) {

    const [myPlayerId, _setMyPlayerId] = useAtom(playerIdAtom);

    const variants = {
        modalOpen: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            opacity: [0, 1, 0]
        },
        modalClosed: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
        }
    }

    function determineDisplayUserString(): string {
        const currentPlayerTurn = gameState.whoseTurn();
        if (currentPlayerTurn.id === myPlayerId) return 'Your';
        return `${currentPlayerTurn.username}\'s`
    }

    return (
        <motion.div
            animate={isModalOpen ? 'modalOpen' : 'modalClosed'}
            variants={variants}
            transition={{ duration: 3, times: [0, 0.2, 1] }}
            onAnimationComplete={() => onAnimationComplete()}
        >
            <div className={styles.main}>
                <div className={styles.turn}>{`${determineDisplayUserString()} turn`}</div>
                {gameState.getLastPlayerAction() == null ? null : <PlayerActionItem playerList={gameState.players} playerAction={gameState.getLastPlayerAction()!} />}
            </div>
        </motion.div>
    )
}