import React from "react";
import { BrowserRouter as Router, Route, Switch, Routes } from "react-router-dom";
import HomeScreen from "./components/HomeScreen";
import GameScreen from "./components/GameScreen";
import LobbyScreen from "./components/LobbyScreen";

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/lobby" element={<LobbyScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;