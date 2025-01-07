import "./../styles/HomeScreen.css";
import { useState } from "react";
import Modal from "./Modal";
import Instruction from "./Instruction";

const HomeScreen = () => {
    const [hoveredButton, setHoveredButton] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState('');
    const [modalMode, setModalMode] = useState('host'); // 'host' or 'join'
    const [isInstructionOpen, setIsInstructionOpen] = useState('');

    const openModal = (mode) => {
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const handleModalSubmit = (data) => {
        setIsModalOpen(false);
    };

    const openInstruction = (mode) => {
        // setModalMode(mode);
        setIsInstructionOpen(true);
    };

    const handleInstructionSubmit = (data) => {
        setIsInstructionOpen(false);
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
                    <button className="button"
                        onClick={() => openInstruction('instruction')}
                        onMouseEnter={() => setHoveredButton('instruction')}
                        onMouseLeave={() => setHoveredButton(null)}
                        style={{ backgroundColor: hoveredButton === 'instruction' ? "#36355f" : '', color: "white", fontWeight: "bold" }}
                    >Game Instructions</button>
                </div>
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    mode={modalMode}
                />
                <Instruction
                    isOpen={isInstructionOpen}
                    onClose={() => setIsInstructionOpen(false)}
                    onSubmit={handleInstructionSubmit}
                />
            </div>
        </div>
    )
}
export default HomeScreen;