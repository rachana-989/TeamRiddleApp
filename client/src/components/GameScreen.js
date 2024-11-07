import { useState, useEffect, useCallback } from "react";
import "./../styles/Game.css";
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5001", {
    transports: ['websocket', 'polling'],
    autoConnect: false
});
const GameScreen = () => {
    const location = useLocation();
    const { teamMembers, roomCode, nickName } = location.state || {};
    const commonWordObj = location.state?.commonWord || { commonWord: '' }; // Fallback to avoid errors
    const commonWord = commonWordObj.commonWord || '';
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

    const currentTeam = teamMembers.find((team) =>
        team.members.includes(nickName) // Assuming nickName is the identifier for the player
    );
    const handleGameWon = (data) => {
        setDissableButton(true);
        alert(`Game won by ${data.winnerTeam}(${data.winnerNicknames})`)
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

                    alert('Congratulations! Your team guessed the word!');
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
            alert("You are right!")
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
            alert("Keep trying!");
        }
        setRiddleAnswer('');  // Reset the riddle answer input
    };

    const handleWordGuessSubmit = () => {
        // Check if the guessed word matches the common word
        if (wordGuess.toUpperCase() === commonWord.toUpperCase()) {
            // Notify the server that the word was guessed correctly

            socket.emit('wordGuessed', { roomCode: location.state.roomCode, guessedWord: wordGuess, teamId: idForTeam });
            alert('Congratulations! Your team guessed the word!');
        } else {
            alert('Incorrect guess. Keep trying!');
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

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('gameWon', handleGameWon);
            socket.disconnect();
        };
    }, []);


    useEffect(() => {
        if (socketConnected && roomCode) {
            socket.emit('joinRoom', { roomCode, nickName: 'Player' }, (response) => {

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


    return (
        <div className="game-container">
            <div style={{ display: "flex", direction: "row", justifyContent: "space-between", margin: "5px" }}>

                <p className="game-text">You are {socketConnected ? 'connected' : 'not connected'}</p>
                <p className="game-text">Player:  {nickName}</p>
            </div>
            <div className="game-riddle-container">
                <div>
                    <h4 className="game-text">Team Members</h4>
                    {teamMembers && teamMembers.length > 0 ? (
                        teamMembers.map((team, index) => (
                            <div key={team.teamId}>
                                <h4 className="game-text">Team {index + 1}</h4>
                                <ul>
                                    {team.members.map((member, idx) => (
                                        <li key={idx} className="game-text">{member}</li>
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
                    </div>
                ) : (
                    <div style={{ marginLeft: "20px" }}>
                        <div>
                            <p className="game-text">Guess the below 5 letter word</p>
                            <p className="game-text">{currentWord}</p>
                        </div>
                        <div>
                            <h4 className="game-text">Riddle: {riddle}</h4>
                            <h3 className="game-text">Answer the Riddle:</h3>
                            <input
                                type="text"
                                value={riddleAnswer}
                                size={30}
                                onChange={(e) => setRiddleAnswer(e.target.value)}
                                placeholder="Type your riddle answer here"
                            />
                            <button className="button" onClick={handleRiddleSubmit}>Submit Riddle Answer</button>
                        </div>

                        <div>
                            <h3 className="game-text">Guess the Common Word:</h3>
                            <input
                                type="text"
                                size={30}
                                value={wordGuess}
                                onChange={(e) => setWordGuess(e.target.value)}
                                placeholder="Guess the word"
                            />
                            <button className="button" onClick={handleWordGuessSubmit}>Submit Word Guess</button>
                        </div>

                        <div>
                            <h3 className="game-text">Correct Answers: {correctAnswers}</h3>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
export default GameScreen;

