import "./../styles/HomeScreen.css";
import { useState } from "react";
import Modal from "./Modal";

const HomeScreen = () => {
    const [hoveredButton, setHoveredButton] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState('');
    const [modalMode, setModalMode] = useState('host'); // 'host' or 'join'


    const openModal = (mode) => {
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const handleModalSubmit = (data) => {
        setIsModalOpen(false);
    };
    return (
        <div className="mega-container">

            <div className="container">
                <h2 className="title">Welcome to the Riddle Game!</h2>
                <p className="content">Start your game either by hosting or joing a room</p>
                <div className="button-container">
                    <button className="button"
                        onClick={() => openModal('host')}
                        onMouseEnter={() => setHoveredButton('host')}
                        onMouseLeave={() => setHoveredButton(null)}
                        style={{ backgroundColor: hoveredButton === 'host' ? "#36355f" : '', color: "white", fontWeight: "bold" }}
                    >Host a Room</button>
                    <button className="button"
                        onClick={() => openModal('join')}
                        onMouseEnter={() => setHoveredButton('join')}
                        onMouseLeave={() => setHoveredButton(null)}
                        style={{ backgroundColor: hoveredButton === 'join' ? "#36355f" : '', color: "white", fontWeight: "bold" }}
                    >Join a Room</button>
                </div>
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    mode={modalMode}
                />
            </div>
        </div>
    )
}
export default HomeScreen;