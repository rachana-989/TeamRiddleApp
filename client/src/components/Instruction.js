import { useState } from "react";
const Instruction = ({ isOpen, onSubmit, onClose }) => {
    const [hoveredButton, setHoveredButton] = useState(null);
    if (!isOpen) return null;
    return (
        <div className="instruction-overlay">
            <div className="instruction-content">
                <p className="instruction-header">Welcome to the Riddle App!</p>
                <p className="instruction-text">In this interactive and exciting game, you and your friends will compete to solve riddles, reveal letters, and guess a hidden word. Let’s dive into how to play!</p>
                <p className="instruction-header">Game Setup</p>
                <p className="instruction-header">1.	Create or Join a Room</p>
                <p className="instruction-text">•	Start by creating a game room or joining an existing one.</p>
                <p className="instruction-text">•	Share the room code with your friends so they can join too!</p>
                <p className="instruction-header">2.	Random Team Formation</p>
                <p className="instruction-text">•	Once all players are in the room, Host gets to assign everyone into teams.</p>
                <p className="instruction-text">•	Team formation is randomised</p>
                <p className="instruction-header">Game Start</p>
                <p className="instruction-text">•	Once the teams are formed, the host can start the game, and the first riddle is presented to everyone.</p>
                <p className="instruction-header">Gameplay</p>
                <p className="instruction-header">1.	Guess the Word</p>
                <p className="instruction-text">The agenda of the game is to guess the 5 letter common word (secret word) as a team. </p>
                <p className="instruction-text">The first team to get the secret word wins the game</p>
                <p className="instruction-header">2.	Solve Riddle</p>
                <p className="instruction-text">Now to help you with guessing the secret word, players need to solve riddles.</p>
                <p className="instruction-text">Each player gets a unique riddle, type your answer in the input box and submit it.</p>
                <p className="instruction-text">If you answer is right, a letter from the secret word will be revealed to everyone in your team.</p>
                <p className="instruction-header">Guess the word</p>
                <p className="instruction-text">•	Use the revealed letters to figure out the word faster than the other team!</p>
                <p className="instruction-text">•	If your team thinks they know the common word, submit your guess.</p>
                <p className="instruction-text">•	The first team to correctly guess the word wins the game!</p>
                <button
                    onMouseEnter={() => setHoveredButton('cancel')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className='button'
                    style={{ backgroundColor: hoveredButton === 'cancel' ? "#36355f" : '', color: "white", fontWeight: "bold" }}
                    type="button"
                    onClick={onClose}>Cancel</button>
            </div>
        </div>
    )
}
export default Instruction;