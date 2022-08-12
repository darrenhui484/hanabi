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
import { socketAtom, gameStateAtom, roomIdAtom, playerIdAtom, selectedPlayerAtom, playerActionStateAtom, isHintFormOpenAtom, isEventLogOpenAtom, shouldFireTurnUpdateAtom } from '../store';
import PlayedCards from '../components/PlayedCards';
import styles from '../styles/GameRoom.module.scss';
import { joinClassNames } from '../util/util';
import { motion, Variants } from 'framer-motion';
import HintCountItem from '../components/HintCountItem';
import BombCountItem from '../components/BombCountItem';
import Modal from '../components/Modal';
import TurnUpdate from '../components/TurnUpdate';
import PlayerHand from '../components/PlayerHand';
import EventLog from '../components/EventLog';

function GameRoom() {
    const router = useRouter();

    const synthRef = useRef<SpeechSynthesis | null>(null);

    const [isEventLogOpen, setIsEventLogOpen] = useAtom(isEventLogOpenAtom);
    const [shouldFireTurnUpdate, setShouldFireTurnUpdate] = useAtom(shouldFireTurnUpdateAtom);

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
        synthRef.current = window.speechSynthesis;
    }, [])

    useEffect(() => {
        const boredStrings = [
            'I could have taken a dump by now',
            'any day now',
            'i didn\'t know clicking a button was so hard',
            'first time?',
            'fi dee lah',
            'you\'re a third rate duelist with a fourth rate deck',
            'what\'s that tiny speck, oh it\'s your brain',
            'you play like a cow',
            'you play like a dairy farmer'
        ]
        const turnReminder = setInterval(() => {
            if (gameStateRef.current !== null && gameStateRef.current.isGameRunning && gameStateRef.current.whoseTurn().id === myPlayerIdRef.current)
                speak(boredStrings[Math.floor(Math.random() * (boredStrings.length))])
        }, 120000);

        return () => clearInterval(turnReminder);
    }, [gameStateRef.current])

    useEffect(() => {
        if (!router.isReady || socket == null) return;
        if (router.query.roomId == null || router.query.username == null) {
            router.replace('/');
            return;
        }

        const roomIdParam = router.query.roomId!.toString();
        const usernameParam = router.query.username!.toString();

        const joinedRoomHandler = (playerId: string) => {
            setMyPlayerId(playerId);
        }
        socket.on('joined-room', joinedRoomHandler);

        const updateGameStateHandler = (gameState: IGameStateSerialized) => {
            const prevGameState = gameStateRef.current;
            const newGameState = GameState.deserialize(gameState);
            const isFirstTurn = newGameState.getTurnsPassed() === 0;
            //BUG modal will run on player reconnect on first turn of game

            const isDifferentPlayerTurn = prevGameState == null ? true : prevGameState.whoseTurn().id !== newGameState.whoseTurn().id;
            console.log(`${newGameState.isGameRunning} ${isFirstTurn} ${isDifferentPlayerTurn}`)
            if (newGameState.isGameRunning && (isFirstTurn || isDifferentPlayerTurn)) onRoundStart(newGameState);
            setGameState(newGameState)
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
        if (newGameState.isGameOver()) {
            alert(`Final Score: ${newGameState.getScore()}`);
            router.replace('/');
        }

        const isMyTurn = newGameState.whoseTurn().id === myPlayerIdRef.current;
        if (isMyTurn) {
            speak('Your move, yugi boy')
            handleOnChangePlayerGameRoomState(PlayerGameRoomState.GiveHint, newGameState);
        } else {
            handleOnChangePlayerGameRoomState(PlayerGameRoomState.Waiting, newGameState);
        }

        setShouldFireTurnUpdate(true);
    }

    function speak(text: string) {
        synthRef.current!.speak(new SpeechSynthesisUtterance(text))
    }

    function onActionDone(playerAction: PlayerAction) {
        socket!.emit('player-action', roomId, playerAction);
        handleOnChangePlayerGameRoomState(PlayerGameRoomState.Waiting, gameStateRef.current);
    }

    function onClickStart(): void {
        if (gameStateRef.current!.players.length < 2) {
            alert('need at least 2 players');
            return;
        }
        socket!.emit('start-game', roomId);
    }

    function handleOnClickCard(card: Card): void {
        let playerAction;
        switch (playerGameRoomState) {
            case PlayerGameRoomState.PlayCard:
                let player = gameStateRef.current!.getPlayer(myPlayerIdRef.current);
                if (player == null) throw new Error(`player ${myPlayerIdRef.current} does not exist`);
                if (!player.hasCard(card.id)) break;
                playerAction = new PlayerAction(myPlayerIdRef.current, new PlayerActionData(Player.PlayerActionType.Play, card, null));
                onActionDone(playerAction)
                break;
            case PlayerGameRoomState.DiscardCard:
                player = gameStateRef.current!.getPlayer(myPlayerIdRef.current);
                if (player == null) throw new Error(`player ${myPlayerIdRef.current} does not exist`);
                if (!player.hasCard(card.id)) break;
                playerAction = new PlayerAction(myPlayerIdRef.current, new PlayerActionData(Player.PlayerActionType.Discard, card, null));
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
        if (gameStateRef.current!.hints <= 0) throw new Error('attempting to submit hint when no hints exist');
        setIsHintFormOpen(false);
        const playerAction = new PlayerAction(myPlayerIdRef.current, new PlayerActionData(Player.PlayerActionType.Hint, null, hint));
        onActionDone(playerAction)
    }

    const variants = {
        activeChoice: {
            fontSize: '40px',
            backgroundColor: 'hsl(0, 0, 4)',
            borderBottom: '4px solid green',
            padding: '5px 10px 10px 10px',
            borderTopLeftRadius: '30px',
            borderTopRightRadius: '30px',
            cursor: 'default'
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
            cursor: 'default'
        },
        visibleHintFormOpen: {
            y: '-132px',
            opacity: 1
        },

        visible: {
            opacity: 1
        },
        hidden: {
            opacity: 0,
            display: 'none'
        },


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
            if (gameStateRef.current!.hints === 0) {
                return 'hidden';
            }
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

    function determineModalCSSVariant(): string {
        return shouldOpenModal() ? 'modalOpen' : 'modalClosed'
    }

    function onTurnUpdateAnimationComplete() {
        setShouldFireTurnUpdate(false);
    }

    function onEventLogClose() {
        setIsEventLogOpen(false);
    }

    function determineGameBoardCSSClasses(): string {
        if (playerGameRoomState === PlayerGameRoomState.Waiting) return joinClassNames(styles['game-board'], styles['game-board-default-height'])
        if (playerGameRoomState === PlayerGameRoomState.GiveHint) return joinClassNames(styles['game-board'], styles['game-board-hint-form-height']);
        return joinClassNames(styles['game-board-your-turn-height'], styles['game-board']);
    }

    function handleEventLogOnClick() {
        setIsEventLogOpen(true)
    }

    function shouldOpenModal(): boolean {
        return isEventLogOpen || shouldFireTurnUpdate;
    }

    function determineModalChild(): JSX.Element | null {
        if (isEventLogOpen) return <EventLog playerList={gameStateRef.current!.players} onClose={onEventLogClose} eventLog={gameStateRef.current?.eventLog!} />
        if (shouldFireTurnUpdate) return <TurnUpdate onAnimationComplete={onTurnUpdateAnimationComplete} gameState={gameStateRef.current!} />;
        return null;
    }


    function displayGameBoard(): JSX.Element {
        return (
            <>
                <div className={determineGameBoardCSSClasses()}>

                    <div>
                        <div className={styles.counters}>
                            <div className={styles['counter-row']}>
                                <BombCountItem /> x{gameStateRef.current?.bombs}
                            </div>
                            <div className={styles['counter-row']}>
                                <HintCountItem /> x{gameStateRef.current?.hints}
                            </div>
                            <div className={styles['counter-row']}>
                                <div className={styles['deck-icon']} /> x{gameStateRef.current?.deck.length}
                            </div>
                        </div>

                        <div className={styles['board-state']}>
                            {gameStateRef.current!.playedCards.isEmpty ? null : <PlayedCards playedCards={gameStateRef.current?.playedCards} />}
                            {gameStateRef.current!.discardPile.length <= 0 ? null : <DiscardPile cards={gameStateRef.current?.discardPile} />}

                        </div>
                    </div>

                    <div className={styles.hands}>
                        {gameStateRef.current?.players.map((player, index) => {
                            return (
                                <PlayerHand
                                    key={index}
                                    handOwnerPlayer={player}
                                    myPlayerId={myPlayerIdRef.current}
                                    handleOnClickCard={handleOnClickCard}
                                    gameState={gameStateRef.current!}
                                />
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
            </>

        )
    }

    // BUGS: 
    // apple screen height

    return (
        <div className={styles.main}>
            <div className={styles['room-info']}>{roomId}</div>
            {!gameStateRef.current?.isGameRunning ? null :
                <motion.div
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ ease: 'linear', duration: 0.2 }}
                    className={styles['display-event-log-button']}
                    onClick={event => handleEventLogOnClick()}>
                    Log
                </motion.div>
            }

            {gameStateRef.current?.isGameRunning ? displayGameBoard() : <WaitingCard players={gameStateRef.current?.players} onClickStart={onClickStart} />}

            <Modal isOpen={shouldOpenModal()}>
                {determineModalChild()}
            </Modal >

        </div>
    );
}

export default GameRoom;