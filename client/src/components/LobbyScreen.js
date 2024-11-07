import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import "./../styles/Lobby.css";
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io('https://teamriddleapp.onrender.com');

const LobbyScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { roomCode, nickName, roomName } = location.state || {};
    const [copySuccess, setCopySuccess] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [teamCount, setTeamCount] = useState(2); // Default team count
    const [teams, setTeams] = useState([]);
    const [randomized, setRandomized] = useState(false);
    const [members, setMembers] = useState(location.state?.members || []);
    const [hoveredButton, setHoveredButton] = useState(null);

    const handleStartGame = () => {
        // Emit event to server to start the game
        socket.emit('startGame', { roomCode });
        // The navigation to '/game' will happen after receiving 'gameStarted' event from server
    };
    useEffect(() => {
        // Check if the current user is the host (first member)
        if (members[0] === nickName) {
            setIsHost(true);
        }

        // Emit an event to join the room using socket.io
        socket.emit('joinRoom', { roomCode, nickName });

        // Listen for the 'membersUpdated' event to update the members list
        const handleMembersUpdated = (updatedMembers) => {
            setMembers(updatedMembers);
        };

        // Listen for the 'teamsRandomized' event to update the teams
        const handleTeamsRandomized = (newTeams) => {
            setTeams(newTeams);
            setRandomized(true); // Mark teams as randomized
        };
        const handleGameStarted = (commonWord) => {
            navigate('/game', { state: { teamMembers: teams, roomCode: roomCode, commonWord: commonWord, nickName: nickName } });
        };

        socket.on('gameStarted', handleGameStarted);

        socket.on('membersUpdated', handleMembersUpdated);
        socket.on('teamsRandomized', handleTeamsRandomized);

        // Clean up the socket listeners when the component unmounts
        return () => {
            socket.off('membersUpdated', handleMembersUpdated);
            socket.off('teamsRandomized', handleTeamsRandomized);
            socket.off('gameStarted', handleGameStarted)
        };
    }, [teams]);

    const handleRandomizeTeams = () => {
        // Emit the randomization request to the server
        socket.emit('randomizeTeams', { roomCode, members, teamCount });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomCode)
            .then(() => setCopySuccess('Copied!'))
            .catch(err => setCopySuccess('Failed to copy!'));

        // Reset the copy success message after a short delay
        setTimeout(() => setCopySuccess(''), 2000);
    };

    return (
        <div className="container-lobby">
            <div className='details-container'>
                <p className='description' style={{ fontSize: 20 }}>TEAM <b style={{ fontSize: 30 }}>{roomName}</b></p>
                <p className='description'>Share your room code with friends to join your party!</p>
                <div className='room-code-container'>
                    <div className='description' style={{ fontWeight: "900", color: "white", width: "auto" }}>
                        Room Code: <strong>{roomCode}</strong>
                    </div>
                    <button className="copy-button" onClick={copyToClipboard}>
                        &#x2398; {/* This is a Unicode copy symbol */}
                    </button>
                </div>
            </div>
            <div style={{ margin: -20 }}>
                <h3 className='description' style={{ color: "white" }}>Current players</h3>
                <div className='players-container'>
                    <div className='list-container-admin'>
                        <p className="list-admin">{members[0] + " (Admin)"}</p>
                    </div>
                    <ul>
                        {members && members.length > 0 ? (
                            members.slice(1).map((member, index) => (
                                <div className='list-container'>

                                    <li className='list' key={index}>{member}</li>
                                </div>
                            ))
                        ) : (
                            <li className='description'>No players have joined yet.</li>
                        )}
                    </ul>
                </div>
                <p className='description'>Waiting for everyone to join..</p>
                {isHost & !randomized ? (
                    <p className='description' style={{ color: "white" }}>
                        You can start the game when you have all the players in. <br /> Minimum number of players required is 4
                    </p>
                ) : (
                    <p className='description' style={{ color: "white" }}>
                        Game starts when we have all the players in. <br /> Minimum number of players required is 4
                    </p>
                )}
                <div className='players-list'>
                    <h3 className='description' style={{ color: "white" }}>Players in the room: {members.length}</h3>

                </div>
            </div>
            {members.length < 4 ? (
                <p className="description">Waiting for more players to join... (Minimum 4 players required)</p>
            ) : (
                <>
                    {isHost ? (
                        <div>
                            <div style={{ display: "flex", flexDirection: "column", width: "200px", margin: "auto" }}>
                                <label className="description">Select number of teams:</label>
                                <input
                                    type="number"
                                    min="2"
                                    max={members.length}
                                    value={teamCount}
                                    onChange={(e) => setTeamCount(Number(e.target.value))}
                                />
                                <button className="randomize-button" onClick={handleRandomizeTeams}
                                    onMouseEnter={() => setHoveredButton(true)}
                                    onMouseLeave={() => setHoveredButton(null)}
                                    style={{ backgroundColor: hoveredButton === true ? "#36355f" : '', color: "white", fontWeight: "bold" }}
                                >
                                    Randomize Teams
                                </button>
                            </div>
                            {randomized && (
                                <div>
                                    <p className="description">Teams:</p>
                                    {teams?.map((team, index) => (
                                        <div key={team.teamId} style={{ width: "200px", margin: "auto" }}> {/* Use teamId as the key for better uniqueness */}
                                            <p className="description">Team {index + 1}:</p>
                                            <ul>
                                                {team.members.map((member, idx) => ( // Access team.members
                                                    <div className='list-container'>
                                                        <li key={idx} className="list">{member}</li>
                                                    </div>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {randomized && (
                                <div style={{ width: "250px", margin: "auto" }}>
                                    <button className="button" onClick={handleStartGame}>
                                        Start Game
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="description">Waiting for the host to randomize teams...</p>
                    )}
                </>
            )}
        </div>
    );
};

export default LobbyScreen;