const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Room Schema with members (nicknames) array
const roomSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  members: [{ type: String }], // Array to store nicknames of people in the room
  roomCode: { type: String, required: true },
  commonWord: { type: String, default: '' },
  activeTeamId:{ type: String, default:'' },
  host: { type: String, required: true },
  // currentRiddle: {
  //   question: String,
  //   answer: String
  // }
});

const Room = mongoose.model('Room', roomSchema);

// Generate a random room code
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // Random string of 6 characters
};

// Create room endpoint
router.post('/create-room', async (req, res) => {
  const { roomName, nickName } = req.body;

  if (!roomName || !nickName) {
    return res.status(400).json({ message: 'Room name and nickname are required' });
  }

  const roomCode = generateRoomCode();

  const newRoom = new Room({
    roomName,
    roomCode,
    members: [nickName],
    commonWord: '',
    activeTeamId: null,
    teams:[],
    currentRiddle:{},
    host: nickName,
    // currentRiddle: { question: '', answer: '' }
  });

  try {
    await newRoom.save();
    console.log(`Room created: ${roomCode}`);
    res.status(201).json({ roomCode , roomName });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(400).json({ message: 'Error creating room', error });
  }
});

// Join room endpoint
router.post('/join-room', async (req, res) => {
  const { roomCode, nickName , roomName} = req.body;

  if (!roomCode || !nickName) {
    return res.status(400).json({ message: 'Room code and nickname are required' });
  }

  try {
    const room = await Room.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.members.includes(nickName)) {
      return res.status(400).json({ message: 'Nickname already exists in the room' });
    }
    if(nickName){

      room.members.push(nickName);
      await room.save();
      res.status(200).json({ message: 'Joined room successfully', members: room.members , roomName: room.roomName });
    }
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(400).json({ message: 'Error joining room', error });
  }
});

// router.post('/start-game', async (req, res) => {
//   const { roomCode, commonWord } = req.body;

//   if (!roomCode || !commonWord) {
//     return res.status(400).json({ message: 'Room code and common word are required' });
//   }

//   try {
//     const room = await Room.findOne({ roomCode });

//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     room.commonWord = commonWord;
//     room.revealedLetters = Array(commonWord.length).fill(false);
//     await room.save();

//     res.status(200).json({ message: 'Game started successfully', wordLength: commonWord.length });
//   } catch (error) {
//     console.error('Error starting game:', error);
//     res.status(400).json({ message: 'Error starting game', error });
//   }
// });

// // New endpoint to update revealed letters
// router.post('/reveal-letter', async (req, res) => {
//   const { roomCode, index } = req.body;

//   if (!roomCode || index === undefined) {
//     return res.status(400).json({ message: 'Room code and letter index are required' });
//   }

//   try {
//     const room = await Room.findOne({ roomCode });

//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     if (index < 0 || index >= room.commonWord.length) {
//       return res.status(400).json({ message: 'Invalid letter index' });
//     }

//     room.revealedLetters[index] = true;
//     await room.save();

//     const partialWord = room.commonWord
//       .split('')
//       .map((letter, i) => room.revealedLetters[i] ? letter : '_')
//       .join('');

//     res.status(200).json({ message: 'Letter revealed successfully', partialWord });
//   } catch (error) {
//     console.error('Error revealing letter:', error);
//     res.status(400).json({ message: 'Error revealing letter', error });
//   }
// });
module.exports = { Room, router };