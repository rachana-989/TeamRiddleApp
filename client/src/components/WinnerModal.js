import { useState } from 'react';
import "./../styles/Modal.css";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WinnerModal = ({ isOpen, onClose, onSubmit, mode, isAnswerTrue, isAnswerFalse, winnerNickNames }) => {
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
        response = await axios.post(`${process.env.REACT_APP_API_URL}/api/rooms/create-room`, { roomName: inputValue, nickName });
        if (response.data.roomCode) {
          onSubmit({ roomCode: response.data.roomCode, roomName: response.data.roomName });
          navigate('/lobby', { state: { roomCode: response.data.roomCode, nickName, members: [nickName], roomName: inputValue } });
        } else {
          setError('Failed to create room. Please try again.');
        }
      } else if (mode === 'join') {
        // Join room API call
        response = await axios.post(`${process.env.REACT_APP_API_URL}/api/rooms/join-room`, { roomCode: inputValue, nickName });
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
        {isAnswerTrue || isAnswerFalse ? (
          <div>
            {isAnswerTrue ? (
              <p className="modal-inputs">Congratulations! Your team guessed the word!!</p>
            ) : (
              <p className="modal-inputs">Incorrect guess. Keep trying!</p>
            )}

            <div className="modal-buttons-container">
              <button
                onMouseEnter={() => setHoveredButton('cancel')}
                onMouseLeave={() => setHoveredButton(null)}
                className='button'
                style={{ backgroundColor: hoveredButton === 'cancel' ? "#36355f" : '', color: "white", fontWeight: "bold" }}
                type="button"
                onClick={onClose}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="modal-inputs">Congratulations! Game is over!</p>
            <p className="modal-inputs">{`Game won by - ${winnerNickNames}`}</p>
            <div className="modal-buttons-container">
              <button
                onMouseEnter={() => setHoveredButton('cancel')}
                onMouseLeave={() => setHoveredButton(null)}
                className='button'
                style={{ backgroundColor: hoveredButton === 'cancel' ? "#36355f" : '', color: "white", fontWeight: "bold" }}
                type="button"
                onClick={onClose}>Cancel</button>
            </div>
          </div>


        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default WinnerModal;