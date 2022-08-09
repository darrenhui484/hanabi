import { Player } from "../models/Player";
import styles from '../styles/WaitingCard.module.scss';

interface IWaitingCardProps {
    players: Array<Player> | null | undefined;
    onClickStart: () => void;
}

export default function WaitingCard({ players, onClickStart }: IWaitingCardProps) {

    let playerList = players?.map((player, index) => {
        return <div key={index}>{player.username}</div>
    });


    return (
        <div className={styles.main}>
            <h2>Connected Players</h2>
            {playerList}
            <button onClick={onClickStart}>Start</button>
        </div>
    )

}