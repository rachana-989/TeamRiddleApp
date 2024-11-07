import { useState } from 'react';
import "./../styles/Modal.css";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Modal = ({ isOpen, onClose, onSubmit, mode }) => {
  const [inputValue, setInputValue] = useState(''); // This will be either roomName or roomCode depending on mode
  const [nickName, setNickName] = useState('');
  const [error, setError] = useState('');
  const [hoveredButton, setHoveredButton] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue || !nickName) {
      setError('Both fields are required!');
      return;
    }

    try {
      let response;

      if (mode === 'host') {
        // Create room API call
        response = await axios.post('http://localhost:5001/api/rooms/create-room', { roomName: inputValue, nickName });
        if (response.data.roomCode) {
          onSubmit({ roomCode: response.data.roomCode, roomName: response.data.roomName });
          navigate('/lobby', { state: { roomCode: response.data.roomCode, nickName, members: [nickName], roomName: inputValue } });
        } else {
          setError('Failed to create room. Please try again.');
        }
      } else if (mode === 'join') {
        // Join room API call
        response = await axios.post('http://localhost:5001/api/rooms/join-room', { roomCode: inputValue, nickName });
        if (response.data.members) {
          navigate('/lobby', { state: { roomCode: inputValue, nickName, members: response.data.members, roomName: response.data.roomName } });

        } else {
          setError('Failed to join room. Please check the room code.');
        }
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error(err);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="inputs-container">
            <input
              type="text"
              className="modal-inputs"
              placeholder={mode === 'host' ? "Enter room name" : "Enter room code"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required
            />
            <input
              type="text"
              className="modal-inputs"
              placeholder="Enter Nick name"
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
              required
            />
          </div>
          <div className="modal-buttons-container">
            <button
              onMouseEnter={() => setHoveredButton('submit')}
              onMouseLeave={() => setHoveredButton(null)}
              className='button'
              style={{ backgroundColor: hoveredButton === 'submit' ? "#36355f" : '', color: "white", fontWeight: "bold" }}
              type="submit">{mode === 'host' ? 'Create Room' : 'Join Room'}</button>
            <button
              onMouseEnter={() => setHoveredButton('cancel')}
              onMouseLeave={() => setHoveredButton(null)}
              className='button'
              style={{ backgroundColor: hoveredButton === 'cancel' ? "#36355f" : '', color: "white", fontWeight: "bold" }}
              type="button"
              onClick={onClose}>Cancel</button>
          </div>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Modal;