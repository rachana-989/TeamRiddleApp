import { useState, useEffect, useCallback } from "react";
import "./../styles/Game.css";
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import WordTiles from "./WordTiles";
import Modal from "./Modal";
import WinnerModal from "./WinnerModal";

// const socket = io(process.env.REACT_APP_API_URL, {
//     transports: ['websocket', 'polling'],
//     autoConnect: false
// });
const socket = io("https://teamriddleapp.onrender.com", {
    transports: ['websocket', 'polling'],
    autoConnect: false
});
const GameScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { teamMembers, roomCode, nickName, roomName, host } = location.state || {};
    const gameStartObj = location.state?.commonWord || { commonWord: '' }; // Fallback to avoid errors
    const commonWord = gameStartObj.commonWord || '';
    const gameHost = gameStartObj.gameHost || '';
    const [revealedLetters, setRevealedLetters] = useState(new Array(commonWord.length).fill(false)); // Track which letters are revealed
    const [currentWord, setCurrentWord] = useState('_ '.repeat(commonWord.length).trim());  // Track revealed letters
    const [riddleAnswer, setRiddleAnswer] = useState('');  // For answering riddles
    const [correctRiddleAnswer, setCorrectRiddleAnswer] = useState('');
    const [wordGuess, setWordGuess] = useState('');  // For guessing the common word
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [riddle, setRiddle] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const [lastSolvedTeam, setLastSolvedTeam] = useState(null);
    const [disableButton, setDissableButton] = useState(false);
    const [idForTeam, setIdForteam] = useState('');
    const [timeLeft, setTimeLeft] = useState(60); // Timer starts at 60 seconds
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [showRightModel, setShowRightModel] = useState(false);
    const [showFalseModel, setShowFalseModel] = useState(false);
    const [showRightWinnerModal, setShowRightWinnerModal] = useState(false);
    const [showFalseWinnerModal, setShowFalseWinnerModal] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winnerNickNames, setWinnerNickNames] = useState('')

    const currentTeam = teamMembers.find((team) =>
        team.members.includes(nickName) // Assuming nickName is the identifier for the player
    );
    const handleGameWon = (data) => {
        setDissableButton(true);
        setGameOver(true);
        setWinnerNickNames(data.winnerNicknames)
        // alert(`Game won by ${data.winnerTeam}(${data.winnerNicknames})`)
    }
    const handleReturnToLobby = () => {
        navigate('/lobby', { state: { roomCode: location.state.roomCode, nickName: nickName, members: [nickName], roomName: roomName, gameHost: gameHost } });
    }
    const handleLetterReveal = useCallback((data) => {
        const { index, teamId } = data;
        if (teamId === currentTeam.teamId) {
            setIdForteam(teamId)
            setRevealedLetters((prev) => {
                const updatedRevealedLetters = [...prev];
                updatedRevealedLetters[index] = true;

                const updatedWord = commonWord
                    .split('')
                    .map((char, idx) => (updatedRevealedLetters[idx] ? char : '_'))
                    .join(' ');

                setCurrentWord(updatedWord);
                // Check if all letters have been revealed
                const allLettersRevealed = updatedRevealedLetters.every((revealed) => revealed);


                if (allLettersRevealed) {
                    // Emit "game won" event if all letters are revealed
                    socket.emit('wordGuessed', { roomCode: location.state.roomCode, guessedWord: commonWord, teamId: teamId });
                    setShowRightWinnerModal(true)
                    // alert('Congratulations! Your team guessed the word!');
                }
                return updatedRevealedLetters;
            });
        }
    }, [commonWord, teamMembers, nickName]);

    const handleOtherTeamSolvedRiddle = ({ teamId }) => {
        // Update UI to show that another team solved a riddle without revealing the letter
        setLastSolvedTeam(teamId);
    };

    const handleRiddleSubmit = () => {
        // Simulate riddle answer checking (replace with actual logic)
        const isCorrect = riddleAnswer.toLowerCase() === correctRiddleAnswer.toLowerCase();  // Replace with actual riddle logic
        if (isCorrect) {
            // alert("You are right!")
            setShowRightModel(true)
            setCorrectAnswers(correctAnswers + 1)
            const currentTeam = teamMembers.find((team) =>
                team.members.includes(nickName) // Assuming nickName is the identifier for the player
            );
            if (currentTeam) {
                // Send the team ID along with the room code and answer
                socket.emit('riddleSolved', {
                    roomCode: location.state.roomCode,
                    answer: correctRiddleAnswer,
                    teamId: currentTeam.teamId // Access the team ID
                });
            } else {
                console.error('Team not found for the current player.');
            }

        } else {
            // alert("Keep trying!");
            setShowFalseModel(true)
        }
        setRiddleAnswer('');  // Reset the riddle answer input
    };

    const handleWordGuessSubmit = () => {
        // Check if the guessed word matches the common word
        if (wordGuess.toUpperCase() === commonWord.toUpperCase()) {
            // Notify the server that the word was guessed correctly

            socket.emit('wordGuessed', { roomCode: location.state.roomCode, guessedWord: wordGuess, teamId: idForTeam });
            // alert('Congratulations! Your team guessed the word!');
            setShowRightWinnerModal(true)
        } else {
            setShowFalseWinnerModal(true)
            // alert('Incorrect guess. Keep trying!');
        }

        setWordGuess('');  // Reset the word guess input
    };

    useEffect(() => {

        const onConnect = () => {
            console.log('Socket connected');
            setSocketConnected(true);
        };

        const onDisconnect = () => {
            console.log('Socket disconnected');
            setSocketConnected(false);
        };

        const onConnectError = (error) => {
            console.error('Socket connection error:', error);
        };
        socket.on('gameWon', handleGameWon)
        socket.on('returnToLobby', handleReturnToLobby)
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('gameWon', handleGameWon);
            socket.off('returnToLobby', handleReturnToLobby);
            socket.disconnect();
        };
    }, []);


    useEffect(() => {
        if (socketConnected && roomCode) {
            socket.emit('joinRoom', { roomCode, nickName: nickName }, (response) => {

            });

            socket.on('newRiddle', (data) => {
                if (data && data.question) {
                    setRiddle(data.question);
                    setCorrectRiddleAnswer(data.answer);
                } else {
                    console.error('Received invalid riddle data:', data);
                }
            });

            socket.on('letterRevealed', handleLetterReveal)
            socket.on('otherTeamSolvedRiddle', handleOtherTeamSolvedRiddle);

        }
        return () => {
            if (socketConnected) {
                socket.off('newRiddle');
                socket.off('letterRevealed')
                socket.off('otherTeamSolvedRiddle')
            }
        };
    }, [socketConnected, roomCode]);

    const getRiddle = () => {
        socket.emit('fetchRiddle', { roomCode: location.state.roomCode })
        setIsButtonDisabled(true); // Disable the button
        setTimeLeft(60);
    }
    useEffect(() => {
        // Timer logic
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev > 1) {
                    return prev - 1; // Decrease the timer
                } else {
                    clearInterval(timer); // Stop the timer at 0
                    setIsButtonDisabled(false); // Enable the button
                    return 0;
                }
            });
        }, 1000); // Run every second

        return () => clearInterval(timer); // Cleanup the interval
    }, [isButtonDisabled]);

    const handleGameRestart = () => {
        socket.emit('restartGame', { roomCode: location?.state.roomCode, nickname: location?.state.nickName })
        // navigate('/lobby', { state: { roomCode: roomCode, nickName, members: [nickName], roomName: roomName } });
    }
    const handleClosing = () => {
        if (showRightWinnerModal) {
            setShowRightWinnerModal(false)
        } else if (showFalseWinnerModal) {
            setShowFalseWinnerModal(false)
        } else {
            setGameOver(false)
        }
    }

    return (
        <div className="game-container" style={{}}>
            <div style={{ display: "flex", direction: "row", justifyContent: "space-between", margin: "5px" }}>

                <p className="game-text" style={{ color: socketConnected ? "yellow" : "red" }}>You are {socketConnected ? 'connected' : 'not connected'}</p>
                <p className="game-text">Player:  <b>{nickName + ((gameHost == nickName) ? " (Host) " : "")}</b></p>
            </div>
            {/* <div className="game-riddle-container"> */}
            <div style={{ margin: "5px" }}>
                {teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map((team, index) => (
                        <div key={team.teamId} style={{ display: "flex", direction: "row", lineHeight: "5px" }}>
                            <p className="game-text"><b>Team {index + 1}</b></p>
                            <ul style={{ listStyleType: "none", display: "flex", direction: "row" }}>
                                {team.members.map((member, idx) => (
                                    <li key={idx} className="game-text" style={{ marginLeft: "10px" }}>{member + ""}</li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p>No teams available</p>
                )}
            </div>
            {disableButton ? (
                <div style={{ margin: "auto", fontSize: "40px" }}>
                    <p className="game-text">Game completed!</p>
                    <div style={{ padding: "10px" }}>
                        {(gameHost == nickName) ? <button className="game-button" style={{ display: "block", margin: "auto" }} onClick={handleGameRestart}>Restart the game</button> : <></>}
                    </div>
                </div>
            ) : (
                <div style={{ marginLeft: "20px", }}>
                    <div>

                        <div style={{}}>
                            <p className="game-text" style={{ fontSize: "30px", textAlign: "center", }}>Guess the below 5 letter word</p>
                            <WordTiles commonWord={commonWord} revealedLetters={revealedLetters} />
                        </div>
                        <div style={{}}>
                            <p className="game-text" style={{ textAlign: "center" }}>Guess the Common Word:</p>
                            <div>
                                <input
                                    type="text"
                                    size={30}
                                    value={wordGuess}
                                    onChange={(e) => setWordGuess(e.target.value)}
                                    placeholder="Guess the word"
                                    style={{ height: "50px", fontSize: "15px", padding: "3px", textAlign: "center", display: "block", margin: "auto" }}
                                />
                                <div style={{ padding: "10px" }}>
                                    <button className="game-button" style={{ display: "block", margin: "auto" }} onClick={handleWordGuessSubmit}>Submit Word Guess</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{}}>
                        <h3 className="game-text" style={{ textAlign: "center" }}>Riddle: <br /> {riddle}</h3>
                        <p className="game-text" style={{ textAlign: "center" }}>Answer the Riddle:</p>
                        <div style={{ margin: "auto" }}>
                            <input
                                type="text"
                                value={riddleAnswer}
                                size={30}
                                onChange={(e) => setRiddleAnswer(e.target.value)}
                                placeholder="Type your riddle answer here"
                                style={{ height: "50px", fontSize: "15px", padding: "3px", textAlign: "center", display: "block", margin: "auto" }}
                            />
                        </div>
                        <div style={{ padding: "10px" }}>
                            <button className="game-button" style={{ display: "block", margin: "auto" }} onClick={handleRiddleSubmit}>Submit Riddle Answer</button>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <button className="game-button" onClick={getRiddle} disabled={isButtonDisabled} style={{}}>{isButtonDisabled ? `Refresh available in ${timeLeft}` : "Get new riddle"}</button>
                    </div>
                    <div>
                        <p className="game-text">Correct Answers: {correctAnswers}</p>

                    </div>
                </div>
            )}
            <Modal isAnswerTrue={showRightModel}
                isAnswerFalse={showFalseModel}
                isOpen={showRightModel || showFalseModel}
                onClose={() => { showRightModel ? setShowRightModel(false) : setShowFalseModel(false) }} />
            <WinnerModal
                isAnswerTrue={showRightWinnerModal}
                isAnswerFalse={showFalseWinnerModal}
                isOpen={showRightWinnerModal || showFalseWinnerModal || gameOver}
                onClose={() => handleClosing()}
                winnerNickNames={winnerNickNames}
            />
            {/* </div> */}
        </div>
    )
}
export default GameScreen;

