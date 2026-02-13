import React, { useState } from "react";
import "./App.css";
import CharacterSelection from "./components/CharacterSelection";
import GameScene from "./components/GameScene";
import ProfileSetup from "./components/ProfileSetup";

function App() {
  const [currentScreen, setCurrentScreen] = useState("profile");
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [knowledgeTokens, setKnowledgeTokens] = useState(0);

  const handleProfileCreated = (profile) => {
    setUserProfile(profile);
    setCurrentScreen("character");
  };

  const handleCharacterSelected = (character) => {
    setSelectedCharacter(character);
    setCurrentScreen("game");
  };

  const handleGameComplete = (tokensEarned) => {
    setKnowledgeTokens((prev) => prev + tokensEarned);
  };

  const handleBackToMenu = () => {
    setCurrentScreen("character");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🛡️ منصة النجاة</h1>
        {userProfile && (
          <div className="user-info">
            <span>👤 {userProfile.name}</span>
            <span className="tokens">🪙 {knowledgeTokens}</span>
          </div>
        )}
      </header>

      <main className="App-main">
        {currentScreen === "profile" && (
          <ProfileSetup onProfileCreated={handleProfileCreated} />
        )}

        {currentScreen === "character" && (
          <CharacterSelection
            onCharacterSelected={handleCharacterSelected}
            userProfile={userProfile}
          />
        )}

        {currentScreen === "game" && selectedCharacter && (
          <GameScene
            character={selectedCharacter}
            onGameComplete={handleGameComplete}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </main>
    </div>
  );
}

export default App;
