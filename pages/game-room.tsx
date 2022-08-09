import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import DiscardPile from '../components/DiscardPile';
import CardList from '../components/CardList';
import WaitingCard from '../components/WaitingCard';
import { Card } from '../models/Card';
import { GameState, IGameStateSerialized } from '../models/GameState';
import { Player, PlayerAction, PlayerActionData, PlayerGameRoomState } from '../models/Player';
import HintForm from '../components/HintForm';
import { Hint } from '../models/Hint';
import { useAtom, atom } from "jotai";
import { socketAtom, gameStateAtom, roomIdAtom, playerIdAtom, selectedPlayerAtom, playerActionStateAtom, isHintFormOpenAtom, isYourTurnAtom } from '../store';
import PlayedCards from '../components/PlayedCards';
import styles from '../styles/GameRoom.module.scss';
import { joinClassNames } from '../util/util';
import { motion } from 'framer-motion';
import HintCountItem from '../components/HintCountItem';
import BombCountItem from '../components/BombCountItem';

function GameRoom() {
    const router = useRouter();

    const [socket, setSocket] = useAtom(socketAtom);
    const [roomId, setRoomId] = useAtom(roomIdAtom);

    const [gameState, _setGameState] = useAtom(gameStateAtom);
    const gameStateRef = useRef(gameState);

    const setGameState = (newGameState: GameState) => {
        gameStateRef.current = newGameState;
        _setGameState(gameStateRef.current);
    }


    const [myPlayerId, _setMyPlayerId] = useAtom(playerIdAtom);
    const myPlayerIdRef = useRef(myPlayerId);
    const setMyPlayerId = (newPlayerId: string) => {
        myPlayerIdRef.current = newPlayerId;
        _setMyPlayerId(myPlayerIdRef.current);
    }

    // stale closures
    // https://leewarrick.com/blog/react-use-effect-explained/

    const [playerGameRoomState, setPlayerGameRoomState] = useAtom(playerActionStateAtom);

    const [selectedPlayer, setSelectedPlayer] = useAtom(selectedPlayerAtom);
    const [isHintFormOpen, setIsHintFormOpen] = useAtom(isHintFormOpenAtom);

    useEffect(() => {
        if (!router.isReady || socket == null) return;
        if (router.query.roomId == null || router.query.username == null) {
            router.replace('/');
            return;
        }

        const roomIdParam = router.query.roomId!.toString();
        const usernameParam = router.query.username!.toString();

        const joinedRoomHandler = (playerId: string) => {
            console.log(`${playerId} joined room`)
            setMyPlayerId(playerId);
        }
        socket.on('joined-room', joinedRoomHandler);

        const updateGameStateHandler = (gameState: IGameStateSerialized) => {
            console.log('updating game state')
            const newGameState = GameState.deserialize(gameState);
            onRoundStart(newGameState);
        }
        socket.on('update-game-state', updateGameStateHandler);
        setRoomId(roomIdParam);

        const fullRoomHandler = () => {
            alert('room is full')
            router.replace('/');
        }
        socket.on('full-room', fullRoomHandler);

        // socket must be connected to get socket.id
        if (socket.connected) {
            socket.emit('join-room', roomIdParam, usernameParam);
        } else {
            socket.once('connect', () => {
                socket.emit('join-room', roomIdParam, usernameParam);
            });
        }

        return () => {
            socket.off('update-game-state', updateGameStateHandler)
            socket.off('joined-room', joinedRoomHandler)
            socket.off('full-room', fullRoomHandler)
        }
    }, [router.isReady, socket]);

    function onRoundStart(newGameState: GameState): void {
        if (newGameState.isGameRunning) {
            const isMyTurn = newGameState.whoseTurn().id === myPlayerIdRef.current;
            if (isMyTurn) {
                handleOnChangePlayerGameRoomState(PlayerGameRoomState.GiveHint, newGameState);
            } else {
                handleOnChangePlayerGameRoomState(PlayerGameRoomState.Waiting, newGameState);
            }
        }


        setGameState(newGameState);
    }

    function onActionDone(playerAction: PlayerAction) {
        socket!.emit('player-action', roomId, playerAction);
        handleOnChangePlayerGameRoomState(PlayerGameRoomState.Waiting, gameStateRef.current);
    }

    function onClickStart(): void {
        socket!.emit('start-game', roomId);

    }

    function handleOnClickCard(card: Card): void {
        let playerAction;
        switch (playerGameRoomState) {
            case PlayerGameRoomState.PlayCard:
                let player = gameStateRef.current!.getPlayer(myPlayerIdRef.current);
                if (player == null) throw new Error(`player ${myPlayerIdRef.current} does not exist`);
                if (!player.hasCard(card.id)) break;
                playerAction = new PlayerAction(myPlayerIdRef.current, new PlayerActionData(Player.PlayerActionType.Play, card.id, null));
                onActionDone(playerAction)
                break;
            case PlayerGameRoomState.DiscardCard:
                player = gameStateRef.current!.getPlayer(myPlayerIdRef.current);
                if (player == null) throw new Error(`player ${myPlayerIdRef.current} does not exist`);
                if (!player.hasCard(card.id)) break;
                playerAction = new PlayerAction(myPlayerIdRef.current, new PlayerActionData(Player.PlayerActionType.Discard, card.id, null));
                onActionDone(playerAction)
                break;
        }
    }

    function handleOnChangePlayerGameRoomState(newState: PlayerGameRoomState, currentGameState: GameState | null) {
        if (newState === playerGameRoomState || currentGameState == null) return;

        setPlayerGameRoomState(newState);

        switch (newState) {
            case PlayerGameRoomState.PlayCard:
                setIsHintFormOpen(false);
                setSelectedPlayer(currentGameState.getPlayer(myPlayerIdRef.current));
                break;
            case PlayerGameRoomState.DiscardCard:
                setIsHintFormOpen(false);
                setSelectedPlayer(currentGameState.getPlayer(myPlayerIdRef.current));
                break;
            case PlayerGameRoomState.GiveHint:
                setIsHintFormOpen(true);
                const otherPlayer = currentGameState.players.find((player) => player.id !== myPlayerIdRef.current);
                if (otherPlayer == null) throw new Error('problem setting initial state of player in hint state');
                setSelectedPlayer(otherPlayer);
                break;
            case PlayerGameRoomState.Waiting:
                setIsHintFormOpen(false);
                setSelectedPlayer(null);
        }
    }

    function handleSubmitHint(hint: Hint) {
        setIsHintFormOpen(false);
        const playerAction = new PlayerAction(myPlayerIdRef.current, new PlayerActionData(Player.PlayerActionType.Hint, null, hint));
        onActionDone(playerAction)
    }

    function handleOnPlayerHandSelected(selectedPlayerId: string) {
        if (selectedPlayerId === myPlayerIdRef.current) return;
        if (PlayerGameRoomState.GiveHint) {
            setSelectedPlayer(gameStateRef.current!.getPlayer(selectedPlayerId));
        }
    }

    function generatePlayerHandCSSClass(elementOwnerId: string) {
        if (selectedPlayer == null) return styles.playerHand;

        if (playerGameRoomState === PlayerGameRoomState.GiveHint) {
            if (selectedPlayer.id === elementOwnerId) {
                return joinClassNames(styles.playerHand, styles.selected);
            }
            if (myPlayerIdRef.current === elementOwnerId) {
                return styles.playerHand;
            }
            return joinClassNames(styles.playerHand, styles['hover-effect']);
        } else if ([PlayerGameRoomState.PlayCard, PlayerGameRoomState.DiscardCard].includes(playerGameRoomState)) {
            if (selectedPlayer.id === elementOwnerId) {
                return joinClassNames(styles.playerHand, styles.selected);
            }
            return styles.playerHand;
        } else {
            return styles.playerHand;
        }

    }

    const variants = {
        activeChoice: {
            fontSize: '40px',
            backgroundColor: 'hsl(0, 0, 4)',
            borderBottom: '4px solid green',
            padding: '5px 10px 10px 10px',
            borderTopLeftRadius: '30px',
            borderTopRightRadius: '30px',
        },
        inactiveChoice: {
            padding: '5px 10px 10px 10px',
            fontSize: '15px',
            y: '0px'
        },
        inactiveChoiceHintFormOpen: {
            padding: '5px 10px 10px 10px',
        },
        activeChoiceHintFormOpen: {
            fontSize: '32px',
            backgroundColor: 'hsl(0, 0, 4)',
            borderBottom: '4px solid green',
            padding: '5px 10px 10px 10px',
            borderTopLeftRadius: '30px',
            borderTopRightRadius: '30px',
        },
        visibleHintFormOpen: {
            y: '-132px',
            opacity: 1
        },
        notSelectedPlayer: {
            transform: 'scale(1)'
        },
        selectedPlayer: {
            backgroundColor: 'hsl(304, 33, 14)',
            transform: 'scale(1.2)'
        },
        visible: {
            opacity: 1
        },
        hidden: {
            opacity: 0,
            display: 'none'
        }

    }

    function determineChoiceCSSVariant(currentPlayerGameRoomState: PlayerGameRoomState, element: string): string {
        if (element === 'play') {
            if (PlayerGameRoomState.PlayCard === currentPlayerGameRoomState) {
                return 'activeChoice';
            }

            if (PlayerGameRoomState.GiveHint === currentPlayerGameRoomState) {
                return 'inactiveChoiceHintFormOpen';
            }
        }

        if (element === 'discard') {
            if (PlayerGameRoomState.DiscardCard === currentPlayerGameRoomState) {
                return 'activeChoice';
            }

            if (PlayerGameRoomState.GiveHint === currentPlayerGameRoomState) {
                return 'inactiveChoiceHintFormOpen';
            }
        }

        if (element === 'hint') {
            if (PlayerGameRoomState.GiveHint === currentPlayerGameRoomState) {
                return 'activeChoiceHintFormOpen';
            }
        }
        return 'inactiveChoice';
    }

    function determineChoicesContainerCSSVariant(currentPlayerGameRoomState: PlayerGameRoomState) {
        if (currentPlayerGameRoomState === PlayerGameRoomState.Waiting) return 'hidden';
        if (isHintFormOpen) return 'visibleHintFormOpen';
        return 'visible';
    }

    function determinePlayerHandCSSVariant(elementOwnerId: string): string {
        if (selectedPlayer == null) return 'notSelectedPlayer';

        if (playerGameRoomState === PlayerGameRoomState.GiveHint) {
            if (selectedPlayer.id === elementOwnerId) {
                return 'selectedPlayer';
            }
            if (myPlayerIdRef.current === elementOwnerId) {
                return 'notSelectedPlayer';
            }
            return joinClassNames(styles.playerHand, styles['hover-effect']);
        } else if ([PlayerGameRoomState.PlayCard, PlayerGameRoomState.DiscardCard].includes(playerGameRoomState)) {
            if (selectedPlayer.id === elementOwnerId) {
                return 'selectedPlayer';
            }
            return 'notSelectedPlayer';
        }
        return 'notSelectedPlayer';

    }

    function displayGameBoard(): JSX.Element {
        return (
            <div>
                <div className={styles['game-board']}>
                    <h2>{`${gameStateRef.current?.whoseTurn().username}\'s turn`}</h2>

                    <div>
                        <div className={styles.counters}>
                            <div className={styles['counter-row']}>
                                <BombCountItem />x{gameStateRef.current?.bombs}
                            </div>
                            <div className={styles['counter-row']}>
                                <HintCountItem />x{gameStateRef.current?.hints}
                            </div>
                        </div>

                        <div className={styles['board-state']}>
                            <PlayedCards playedCards={gameStateRef.current?.playedCards} />
                            <DiscardPile cards={gameStateRef.current?.discardPile} />
                        </div>
                    </div>

                    <div className={styles.hands}>
                        {gameStateRef.current?.players.map((player, index) => {
                            return (
                                <motion.div key={index} onClick={event => handleOnPlayerHandSelected(player.id)}
                                    animate={determinePlayerHandCSSVariant(player.id)}
                                    variants={variants}
                                    transition={{ duration: 0.2 }}
                                    className={styles.playerHand}>
                                    {player.username}
                                    <CardList cards={player.hand} handleOnClickCard={handleOnClickCard} isHorizontal={true} isHidden={myPlayerIdRef.current === player.id} />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <motion.div
                        animate={determineChoicesContainerCSSVariant(playerGameRoomState)}
                        variants={variants}
                        transition={{ duration: 0.2 }}
                        className={styles.choices}>
                        <motion.div
                            animate={determineChoiceCSSVariant(playerGameRoomState, 'play')}
                            transition={{ duration: 0.2 }}
                            variants={variants}
                            className={styles.choice} onClick={event => handleOnChangePlayerGameRoomState(PlayerGameRoomState.PlayCard, gameStateRef?.current)}>Play</motion.div>
                        <motion.div
                            animate={determineChoiceCSSVariant(playerGameRoomState, 'discard')}
                            transition={{ duration: 0.2 }}
                            variants={variants}
                            className={styles.choice} onClick={event => handleOnChangePlayerGameRoomState(PlayerGameRoomState.DiscardCard, gameStateRef?.current)}>Discard</motion.div>
                        <motion.div
                            animate={determineChoiceCSSVariant(playerGameRoomState, 'hint')}
                            transition={{ duration: 0.2 }}
                            variants={variants}
                            className={styles.choice} onClick={event => handleOnChangePlayerGameRoomState(PlayerGameRoomState.GiveHint, gameStateRef?.current)}>Give Hint</motion.div>
                    </motion.div>

                    <HintForm handleSubmitHint={handleSubmitHint} />


                </div>
            </div>

        )
    }

    return (
        <div className={styles.main}>
            <div className={styles['room-info']}>{roomId}</div>

            {gameStateRef.current?.isGameRunning ? displayGameBoard() : <WaitingCard players={gameStateRef.current?.players} onClickStart={onClickStart} />}


        </div>
    );
}

export default GameRoom;