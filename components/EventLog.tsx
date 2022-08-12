import { Player, PlayerAction } from '../models/Player';
import styles from '../styles/EventLog.module.scss';
import PlayerActionItem from './PlayerActionItem';
import CloseButton from './CloseButton';


interface IEventLogProps {
    playerList: Array<Player>;
    eventLog: Array<PlayerAction>;
    onClose: () => void;
}

export default function EventLog({ playerList, eventLog, onClose }: IEventLogProps) {

    return (
        <div className={styles.main}>

            <div className={styles.title}>
                Events
            </div>
            <div className={styles['close-button']}>
                <CloseButton onCloseClick={onClose} />
            </div>
            {eventLog.map((playerAction, index) =>
                <div key={index} className={styles.container}>
                    <PlayerActionItem playerList={playerList} playerAction={playerAction} />
                </div>)
            }
        </div>
    )
}