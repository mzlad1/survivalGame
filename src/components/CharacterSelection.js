import React, { useState, useRef, useEffect } from "react";

const CHARACTERS = [
  {
    id: "sobhi",
    name: "صبحي - Sobhi",
    nameArabic: "صبحي",
    emoji: "👦",
    image: "/assets/characters/sobhi.png",
    description: "شجاع وذكي - Brave & Smart",
    introText:
      "مرحباً! أنا صبحي، يسعدني اصطحابك في رحلة تعليمية مميزة للنجاة من الكوارث. سأعلمك كيف تحمي نفسك!",
    introAudio: "/assets/audio/intro-sobhi.mp3",
    color: "#e94560",
  },
  {
    id: "layla",
    name: "ليلى - Layla",
    nameArabic: "ليلى",
    emoji: "👧",
    image: "/assets/characters/layla.png",
    description: "ذكية وسريعة - Smart & Quick",
    introText:
      "مرحباً! أنا ليلى، سأساعدك لتتعلم كيف تنجو من المواقف الصعبة. معاً سنتعلم مهارات مهمة جداً!",
    introAudio: "/assets/audio/intro-layla.mp3",
    color: "#f5c518",
  },
  {
    id: "kareem",
    name: "كريم - Kareem",
    nameArabic: "كريم",
    emoji: "🧒",
    image: "/assets/characters/kareem.png",
    description: "هادئ وحكيم - Calm & Wise",
    introText:
      "أهلاً وسهلاً! أنا كريم. معاً سنتعلم كيف نبقى آمنين في الأزمات. الهدوء والمعرفة هما سلاحنا!",
    introAudio: "/assets/audio/intro-kareem.mp3",
    color: "#3498db",
  },
];

function CharacterSelection({ onCharacterSelected, userProfile }) {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
    setShowIntro(true);

    // Stop any previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Play intro audio if available
    if (character.introAudio) {
      const audio = new Audio(character.introAudio);
      audio.volume = 0.7;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  };

  const handleStartGame = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (selectedCharacter) {
      onCharacterSelected(selectedCharacter);
    }
  };

  const handleImageError = (charId) => {
    setImageErrors((prev) => ({ ...prev, [charId]: true }));
  };

  return (
    <div className="character-selection">
      <h2>اختر مرشدك</h2>
      <p>مرحباً {userProfile?.name}! اختر شخصيتك المرافقة في هذه الرحلة</p>

      <div className="characters-grid">
        {CHARACTERS.map((character) => (
          <div
            key={character.id}
            className={`character-card ${selectedCharacter?.id === character.id ? "selected" : ""}`}
            onClick={() => handleCharacterClick(character)}
          >
            <div className="character-avatar">
              {!imageErrors[character.id] ? (
                <img
                  src={character.image}
                  alt={character.nameArabic}
                  onError={() => handleImageError(character.id)}
                />
              ) : (
                <span className="emoji-fallback">{character.emoji}</span>
              )}
            </div>
            <h3>{character.name}</h3>
            <p>{character.description}</p>
          </div>
        ))}
      </div>

      {showIntro && selectedCharacter && (
        <div className="character-intro">
          <h3>مقدمة الشخصية - Character Introduction</h3>
          <div className="intro-panel">
            <div className="intro-avatar">
              {!imageErrors[selectedCharacter.id] ? (
                <img
                  src={selectedCharacter.image}
                  alt={selectedCharacter.nameArabic}
                  onError={() => handleImageError(selectedCharacter.id)}
                />
              ) : (
                <span style={{ fontSize: "50px" }}>
                  {selectedCharacter.emoji}
                </span>
              )}
            </div>
            <div className="intro-speech">{selectedCharacter.introText}</div>
          </div>
        </div>
      )}

      {selectedCharacter && (
        <button className="start-game-btn" onClick={handleStartGame}>
          🎮 ابدأ اللعبة - Start Game
        </button>
      )}
    </div>
  );
}

export default CharacterSelection;
