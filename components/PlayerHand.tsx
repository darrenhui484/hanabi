import styles from '../styles/PlayerHand.module.scss';
import { motion } from 'framer-motion';
import { Card } from '../models/Card';
import { Player, PlayerGameRoomState } from '../models/Player';
import CardList from './CardList';
import { useAtom } from "jotai";
import { selectedPlayerAtom, playerActionStateAtom } from '../store';
import { GameState } from '../models/GameState';
import { useState } from 'react';
import EyeIcon from './EyeIcon';
import EllipsisItem from './EllipsisItem';

interface IPlayerHand {
    handleOnClickCard?: (card: Card) => void;
    handOwnerPlayer: Player;
    myPlayerId: string;
    gameState: GameState;
}

export default function PlayerHand({ handleOnClickCard, handOwnerPlayer, myPlayerId, gameState }: IPlayerHand) {

    const [playerGameRoomState, setPlayerGameRoomState] = useAtom(playerActionStateAtom);
    const [selectedPlayer, setSelectedPlayer] = useAtom(selectedPlayerAtom);
    const [isHidden, setIsHidden] = useState(false);

    function isShowingHiddenHand(): boolean {
        return myPlayerId === handOwnerPlayer.id || isHidden;
        //TODO add state to show hidden
    }

    function determinePlayerHandCSSVariant(elementOwnerId: string): string {
        if (selectedPlayer == null) return 'notSelectedPlayer';

        if (playerGameRoomState === PlayerGameRoomState.GiveHint) {
            if (myPlayerId === elementOwnerId) {
                return 'notSelectedPlayer';
            }
            if (selectedPlayer.id === elementOwnerId) {
                return 'selectedPlayer';
            }
            return 'notSelectedPlayer';
        } else if ([PlayerGameRoomState.PlayCard, PlayerGameRoomState.DiscardCard].includes(playerGameRoomState)) {
            if (selectedPlayer.id === elementOwnerId) {
                return 'selectedPlayer';
            }
            return 'notSelectedPlayer';
        }
        return 'notSelectedPlayer';
    }

    function determinePlayerHandCSSVariantHover(elementOwnerId: string): string {
        if (selectedPlayer == null) return 'notSelectedPlayer';

        if (playerGameRoomState === PlayerGameRoomState.GiveHint) {
            if (myPlayerId === elementOwnerId) {
                return 'notSelectedPlayer';
            }
            if (selectedPlayer.id === elementOwnerId) {
                return 'selectedPlayer';
            }
            return 'notSelectedPlayerHover';
        } else if ([PlayerGameRoomState.PlayCard, PlayerGameRoomState.DiscardCard].includes(playerGameRoomState)) {
            if (selectedPlayer.id === elementOwnerId) {
                return 'selectedPlayer';
            }
            return 'notSelectedPlayer';
        }
        return 'notSelectedPlayer';
    }

    function handleOnPlayerHandSelected(selectedPlayerId: string) {
        if ([PlayerGameRoomState.PlayCard, PlayerGameRoomState.DiscardCard].includes(playerGameRoomState)) return;
        if (PlayerGameRoomState.GiveHint && selectedPlayerId !== myPlayerId) {
            setSelectedPlayer(gameState!.getPlayer(selectedPlayerId));
        }
    }

    function isEllipsisShowing(): boolean {
        const currentPlayerTurnId = gameState.whoseTurn().id
        return currentPlayerTurnId === handOwnerPlayer.id && currentPlayerTurnId !== myPlayerId;
    }

    const variants = {
        notSelectedPlayer: {
            transform: 'scale(1)'
        },
        notSelectedPlayerHover: {
            transform: 'scale(1.1)',
            cursor: 'pointer'
        },
        selectedPlayer: {
            borderLeft: '4px solid green',
            transform: 'scale(1)'
        },
    }

    return (
        <motion.div
            onClick={event => handleOnPlayerHandSelected(handOwnerPlayer.id)}
            animate={determinePlayerHandCSSVariant(handOwnerPlayer.id)}
            whileHover={determinePlayerHandCSSVariantHover(handOwnerPlayer.id)}
            variants={variants}
            transition={{ duration: 0.2 }}
            className={styles.main}
        >
            <div className={styles['username-container']}>
                {handOwnerPlayer.username}
                {isEllipsisShowing() ? <EllipsisItem /> : null}
            </div>

            <div className={styles['player-hand']}>
                {handOwnerPlayer.id !== myPlayerId ? <div className={styles['eye-container']} onClick={event => setIsHidden(!isHidden)}><EyeIcon isOpen={isHidden} /></div> : null}
                <CardList cards={handOwnerPlayer.hand} handleOnClickCard={handleOnClickCard} isHorizontal={true} isHidden={isShowingHiddenHand()} />
            </div>

        </motion.div>
    )
}