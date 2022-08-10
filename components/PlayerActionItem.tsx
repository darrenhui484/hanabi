import styles from '../styles/PlayerActionItem.module.scss'
import { GameState } from '../models/GameState';
import { Player, PlayerAction, PlayerActionData } from '../models/Player';
import Card from './Card';
import HintItem from './HintItem';
import { Hint } from '../models/Hint';

interface IPlayerActionItem {
    playerList: Array<Player>
    playerAction: PlayerAction;
}

export default function PlayerActionItem({ playerList, playerAction }: IPlayerActionItem) {

    function getUsername(id: string): string {
        const player = playerList.find((player) => player.id === playerAction.playerId)
        if (player == null) throw new Error('player does not exist');
        return player.username;
    }

    function determineActionString(playerAction: PlayerAction): JSX.Element {
        switch (playerAction.data.type) {
            case Player.PlayerActionType.Play:
                return (<>{getUsername(playerAction.playerId)} played <Card card={playerAction.data.card!} /></>);
            case Player.PlayerActionType.Discard:
                return (<>{getUsername(playerAction.playerId)} discarded <Card card={playerAction.data.card!} /></>);
            case Player.PlayerActionType.Hint:
                const hintType = playerAction.data.hint!.type
                if (hintType === Hint.HintType.Color) {
                    return (
                        <>
                            hint:
                            <HintItem color={playerAction.data.hint!.value} isDisplay={true} />
                            {getUsername(playerAction.data.hint!.targetPlayerId)}
                        </>
                    )
                } else if (hintType === Hint.HintType.Number) {
                    return (
                        <>
                            hint:
                            <HintItem number={playerAction.data.hint!.value} isDisplay={true} />
                            {getUsername(playerAction.data.hint!.targetPlayerId)}
                        </>
                    )
                }
                throw new Error(`nonexistent hint type: ${hintType}`);
        }
    }

    return (
        <div className={styles.main}>
            {determineActionString(playerAction)}
        </div>
    )
}