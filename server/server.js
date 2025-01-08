const express = require('express');
const app = express();
const { OpenAI } = require("openai");
const mongoose = require('mongoose');
const cors = require('cors');
const roomRoutes = require("./routes/Room");
require('dotenv').config();
const http = require('http'); // For creating the server
const socketIo = require('socket.io');
const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: process.env.REACT_APP_URL, // or wherever your frontend is hosted
//     methods: ["GET", "POST"]
//   }
// });
const io = socketIo(server, {
  cors: {
    origin: "https://teamriddle.netlify.app", // or wherever your frontend is hosted
    methods: ["GET", "POST"]
  }
});
const { Room, router } = require('./routes/Room');
const { Riddle } = require('./routes/Riddles');

const PORT = process.env.PORT || 5001;

// OpenAI API setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Your OpenAI API Key
});

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/rooms', router); // This will make the path '/api/rooms/create-room'

//get rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms); // Send rooms as JSON response
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error });
  }
});
//Funtion to generate co
async function generateCommonWord() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a game master who provides words for a game." },
        { role: "user", content: "Give me a 5-letter word,just the word." },
      ],
    });

    if (response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message &&
      response.choices[0].message.content) {
      const word = response.choices[0].message.content.trim();  // Access the content property
      console.log('Generated word:', word);
      return word;
    } else {
      console.error('No choices available in API response');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
    } else {
      console.error('Unknown error:', error.message);
    }
    throw error;
  }
}
// async function saveRiddleToDatabase(riddle) {
//   try {
//     const newRiddle = new Riddle({
//       question: riddle.question,
//       answer: riddle.answer
//     });
//     const existingRiddle = await Riddle.findOne({ question: newRiddle.question });
//     if (!existingRiddle) {
//       await newRiddle.save();
//     }
//     console.log('Riddle saved to the database');
//   } catch (error) {
//     console.error('Error saving riddle to database:', error);
//   }
// }
const saveRiddleToDatabase = async (riddle) => {
  try {
    const normalizedAnswer = riddle.answer.toLowerCase();
    const existingRiddle = await Riddle.findOne({
      answer: { $regex: `^${normalizedAnswer}$`, $options: 'i' } // 'i' makes it case-insensitive
    }).exec();
    if (!existingRiddle) {
      const newRiddle = new Riddle(riddle);
      await newRiddle.save();
      console.log('Saved new riddle to database:', newRiddle);
    } else {
      console.log('Riddle already exists in database:', existingRiddle);
    }
  } catch (error) {
    console.error('Error saving riddle to database:', error);
  }
};
//function to generate random riddle
const getRandomRiddle = async () => {
  try {
    // Count the number of riddles in the database
    const riddleCount = await Riddle.countDocuments();

    if (riddleCount > 40) {
      // Fetch a random riddle from the database
      const randomIndex = Math.floor(Math.random() * riddleCount);
      const randomRiddle = await Riddle.findOne().skip(randomIndex).exec();
      console.log('Fetched random riddle from database:', randomRiddle);
      return { question: randomRiddle.question, answer: randomRiddle.answer };
    } else {
      // Generate a new riddle if none exist in the database
      const newRiddle = await fetchRiddleFromAPI();
      if (newRiddle) {
        await saveRiddleToDatabase(newRiddle); // Save it to the database
        return newRiddle;
      }
    }
  } catch (error) {
    console.error('Error retrieving riddle:', error);
  }
  return null;
};


const fetchRiddleFromAPI = async (currentRiddle = null) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a riddle generator." },
        { role: "user", content: "Generate a simple riddle with the question and the correct answer in one word, in this format: {\"question\": \"riddle text\", \"answer\": \"riddle answer\"} also Generate a riddle that hasn’t been used before and avoid repeating riddles from previous responses and also dont repeat answers.Please aim for unique wordplay, new puzzles, or original concepts. Track previous riddles and ensure each new riddle differs in theme or structure.Do not include riddles about echoes or sound." }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    if (response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message &&
      response.choices[0].message.content) {

      const riddleData = JSON.parse(response.choices[0].message.content.trim());
      console.log('Generated Riddle:', riddleData);

      // Make sure it's not the same as the current riddle (optional)
      if (currentRiddle && riddleData.question === currentRiddle.question) {
        return getRandomRiddle(currentRiddle); // Re-fetch if duplicate
      }
      return riddleData;
    } else {
      console.error('No valid response from OpenAI for riddle generation');
      return null;
    }
  } catch (error) {
    console.error('Error fetching riddle from OpenAI:', error);
    return null;
  }
};

// Socket.io setup
const rooms = {};  // Define rooms object globally
const nicknameToSocket = {};

// When a user connects
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a user joins a room
  socket.on('joinRoom', async ({ roomCode, nickName }) => {
    if (!roomCode || !nickName) {
      console.error('Room code or nickname missing');
      return;
    }

    try {
      nicknameToSocket[nickName] = socket;
      socket.join(roomCode);  // Add socket to the room
      console.log(`${nickName} joined room ${roomCode}`);

      // If the room does not exist, create it
      if (!rooms[roomCode]) {
        rooms[roomCode] = {
          currentRiddle: null,
          teamScores: {},
          members: [],
          activeTeamId: null,
          teams: [],
          commonWord: '',
          host: nickName
        };
      }
      // Generate a unique riddle for the room using OpenAI
      const riddleResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a riddle generator." },
          { role: "user", content: "Generate a simple riddle with the question and the answer in one word, in this format: {\"question\": \"riddle text\", \"answer\": \"riddle answer\"} also Generate a riddle that hasn’t been used before and avoid repeating riddles from previous responses and also dont repeat answers. Please aim for unique wordplay, new puzzles, or original concepts. Track previous riddles and ensure each new riddle differs in theme or structure.Do not include riddles about echoes or sound." },
        ],
        max_tokens: 100,
        temperature: 0.8,
      });

      if (
        riddleResponse.choices &&
        riddleResponse.choices.length > 0 &&
        riddleResponse.choices[0].message &&
        riddleResponse.choices[0].message.content
      ) {
        const riddleContent = riddleResponse.choices[0].message.content.trim();
        const riddleData = JSON.parse(riddleContent);  // Parse the response content

        rooms[roomCode].currentRiddle = riddleData;
        console.log(`Generated unique riddle for player ${roomCode}:`, riddleData);
        await saveRiddleToDatabase(riddleData)
        // Send the generated riddle to the room
        socket.emit('newRiddle', riddleData);
      } else {
        console.error('No riddle content returned from OpenAI');
      }

      // Find the room in the database
      const room = await Room.findOne({ roomCode });
      if (room) {
        if (!room.members.includes(nickName)) {
          room.members.push(nickName);
          await room.save();
        }

        // Emit the updated members list to everyone in the room
        io.in(roomCode).emit('membersUpdated', room.members);
      } else {
        console.error('Room not found');
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  // Handle team randomization
  socket.on('randomizeTeams', ({ roomCode, members, teamCount }) => {
    if (!roomCode || !members || !teamCount) {
      console.error('Missing parameters for randomizeTeams');
      return;
    }
    if (members.length < teamCount) {
      socket.emit('randomizationError', 'Not enough members to form teams');
      return;
    }
    function createTeamId(roomCode) {
      return `${roomCode}-${Math.random().toString(36).substring(2, 5)}`; // Example: roomCode-randomString
    }
    if (!rooms[roomCode]) {
      console.error(`Room with code ${roomCode},${rooms[roomCode]} does not exist.`);
      return; // Or handle the error as needed
    }
    const shuffledMembers = [...members].sort(() => Math.random() - 0.5);  // Shuffle members
    const teams = Array.from({ length: teamCount }, () => ({
      teamId: createTeamId(roomCode),
      members: []
    }));  // Create empty teams

    // Distribute members into teams
    shuffledMembers.forEach((member, index) => {
      teams[index % teamCount].members.push(member);
    });
    rooms[roomCode].teams = teams;  // Save teams in the room state
    rooms[roomCode].activeTeamId = teams[0].teamId;
    // Emit the teams to everyone in the room
    io.in(roomCode).emit('teamsRandomized', teams);
    socket.emit('randomizationSuccess', 'Teams have been randomized successfully');
  });

  // Handle game start
  socket.on('startGame', async ({ roomCode }) => {
    try {

      if (!roomCode) {
        console.error('Room code missing for starting the game');
        return;
      }
      if (rooms[roomCode] && rooms[roomCode].commonWord) {
        socket.emit('gameError', 'Common word has already been generated for this game.');
        return;
      }

      // Generate the common word
      const commonWord = await generateCommonWord();
      const gameHost = rooms[roomCode].host
      if (!commonWord) {
        socket.emit('gameError', 'Failed to generate common word');
        return;
      }
      // Store the common word in the room
      if (rooms[roomCode]) {
        rooms[roomCode].commonWord = commonWord;
        rooms[roomCode].teams.forEach(team => {
          team.revealedLetters = Array(commonWord.length).fill(false);  // Initialize revealed letters for each team
        });
      }

      io.in(roomCode).emit('gameStarted', { commonWord , gameHost });  // Send the word to all players

      // Emit the game started event with the common word
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('gameError', 'An error occurred while starting the game');
    }
  });

  // Handle word guessed event
  socket.on('wordGuessed', ({ roomCode, guessedWord, teamId }) => {
    const room = rooms[roomCode];
    console.log("wordguessed right!!")
    if (!room || !room.commonWord) {
      console.error('Room or common word not found');
      return;
    }

    // Check if the guessed word is correct
    if (guessedWord.toUpperCase() === room.commonWord.toUpperCase()) {
      const { teams } = rooms[roomCode];
      const winningTeam = teams.find((team) => team.teamId.includes(teamId));

      // Determine the team number (1-based index)
      const teamNumber = room.teams.indexOf(winningTeam) + 1;

      // Notify all players that the game is won, sending team number and members' nicknames
      io.to(roomCode).emit('gameWon', {
        winnerTeam: `Team ${teamNumber}`,
        winnerNicknames: winningTeam.members
      });

      console.log(`Game won by Team ${teamNumber}: ${winningTeam.members}`);

    } else {
      socket.emit('wrongGuess', 'Incorrect guess, try again!');
    }
  });

  // Handle riddle solved event
  socket.on('riddleSolved', async ({ roomCode, answer, teamId }) => {
    io.to(roomCode).emit('correctAnswer');
    console.log(`Correct answer received: ${answer}`);

    // Fetch a new riddle from OpenAI
    const newRiddle = await getRandomRiddle();
    if (newRiddle) {
      rooms[roomCode].currentRiddle = newRiddle;
      socket.emit('newRiddle', {
        question: newRiddle.question,
        answer: newRiddle.answer,
      });
    } else {
      console.error('Failed to fetch new riddle');
    }

    try {
      // Check if room and revealedLetters are properly initialized
      if (!rooms[roomCode]) {
        console.error(`Room ${roomCode} not initialized!`);
        return;
      }
      const { teams } = rooms[roomCode];
      const activeTeam = teams.find((team) => team.teamId.includes(teamId));
      const { revealedLetters } = activeTeam;
      if (!revealedLetters) {
        console.error(`revealedLetters not initialized for room ${roomCode}`);
        return;
      }

      if (!activeTeam || activeTeam.teamId !== teamId) {
        console.error(`Team ${teamId} is not the active team.`);
        return;
      }
      // Ensure revealedLetters array is initialized for activeTeam
      if (!activeTeam.revealedLetters) {
        console.error(`Revealed letters for team ${teamId} is not initialized. ${JSON.stringify(activeTeam, null, 2)}`);
        return;
      }
      // Log revealedLetters array before the update
      console.log(`Before revealing: ${revealedLetters}`);
      // Select a random index to reveal
      const unrevealedIndices = revealedLetters
        .map((revealed, index) => (revealed ? null : index)) // Get indices that are not revealed
        .filter(index => index !== null); // Filter out nulls
      console.log(`unrevealed indices: ${unrevealedIndices}`);
      if (unrevealedIndices.length > 0) {
        // Pick a random index from unrevealedIndices
        const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];

        // Update revealedLetters array
        revealedLetters[randomIndex] = true; // Mark this index as revealed

        // Log revealedLetters array after the update
        console.log(`After revealing: ${revealedLetters}`);

        if (activeTeam) {
          console.log("Active Team Members:", activeTeam.members);
          activeTeam.members.forEach((nickName) => {
            const memberSocket = nicknameToSocket[nickName];
            // On the backend, just for testing
            if (memberSocket) {
              io.to(roomCode).emit('letterRevealed', { index: randomIndex, teamId: teamId });
              console.log("Sending letter revealed to member:", nickName, "Index:", randomIndex, "Team ID:", teamId);
              memberSocket.on('error', (error) => {
                console.error(`Socket error for ${nickName}:`, error);
              });
            } else {
              console.warn(`No socket found for nickname: ${nickName}`);
            }
          });
        } else {
          console.warn("Active team is not defined or empty.");
        }
      }
    } catch (error) {
      console.error('Error revealing letter:', error);
    }
  });

  //Refresh riddle
  socket.on('fetchRiddle', async ({ roomCode }) => {
    const newRiddle = await getRandomRiddle();
    console.log("new riddle fetched..", newRiddle, roomCode)
    if (newRiddle) {
      rooms[roomCode].currentRiddle = newRiddle;
      socket.emit('newRiddle', {
        question: newRiddle.question,
        answer: newRiddle.answer,
      });
    } else {
      console.error('Failed to fetch new riddle');
    }
  })

  socket.on('restartGame', ({ roomCode, nickname }) => {
    const room = rooms[roomCode];
    if (!room) return;
    console.log("restart triggrered..", roomCode, nickname)
    // Ensure only the host can restart the game
    if (room.host == nickname) {
      console.log(`Host ${nickname} restarted the game for room: ${roomCode}`);

      // Clear previous game data (optional, based on your structure)
      room.teams = []; // Clear teams for re-randomization
      room.commonWord = '';
      room.currentRiddle = null;
      // Notify all players to return to the lobby
      io.to(roomCode).emit('returnToLobby', 'The game has been restarted by the host.');
    } else {
      socket.emit('error', 'Only the host can restart the game.');
    }
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      if (room.members.includes(socket.id)) {
        // Remove the user from the room's members list
        room.members = room.members.filter((id) => id !== socket.id);

        // If the room is empty, clean it up
        if (room.members.length === 0) {
          cleanupRoom(roomCode);
        } else {
          // Notify remaining members about the updated list
          io.in(roomCode).emit('membersUpdated', room.members);
        }
        break; // Exit loop after processing the room
      }
    }
    for (const [nickname, sock] of Object.entries(nicknameToSocket)) {
      if (sock === socket) {
        delete nicknameToSocket[nickname];
        break;
      }
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
