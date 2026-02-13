import React, { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";
import SurvivalGame from "../game/SurvivalGame";

// Keyword lists for local speech recognition (no AI needed)
const KNOCK_KEYWORDS = [
  // English — many variations
  "knock",
  "knocking",
  "knock knock",
  "hit",
  "bang",
  "tap",
  "punch",
  "hammer",
  "beat",
  "pound",
  "strike",
  "tock",
  "tok",
  "tuk",
  "tuk tuk",
  "not",
  "nock",
  "nok",
  "nak",
  // Arabic — all common forms, conjugations, dialects
  "طرق",
  "اطرق",
  "طق",
  "دق",
  "ادق",
  "خبط",
  "اخبط",
  "اضرب",
  "ضرب",
  "دقيت",
  "طرقت",
  "خبطت",
  "بطرق",
  "بدق",
  "بخبط",
  "طقطق",
  "طق طق",
  "دق دق",
  "طقطقة",
  "خبطة",
  "طرقة",
  "دقة",
  "ضربة",
  "اطقطق",
  "اطرقي",
  "ادقي",
  "اخبطي",
  "بدي اطرق",
  "بدي ادق",
  "رح اطرق",
  "رح ادق",
  "اريد اطرق",
  "اريد ادق",
  "طق على",
  "دق على",
  "اضرب على",
  "نقر",
  "انقر",
  "نق",
  "نقنق",
];
const SCREAM_KEYWORDS = [
  // English — many variations
  "scream",
  "shout",
  "yell",
  "help",
  "cry",
  "calling",
  "call",
  "loud",
  "rescue",
  "save",
  "save me",
  "help me",
  "screaming",
  "shouting",
  // Arabic — comprehensive list with dialects & common speech
  "صراخ",
  "صرخ",
  "اصرخ",
  "صرخة",
  "بصرخ",
  "صرخت",
  "استغاثة",
  "استغيث",
  "بستغيث",
  "نادي",
  "نادى",
  "بنادي",
  "ناديت",
  "نداء",
  "ساعدني",
  "ساعدوني",
  "ساعدونا",
  "ساعدنا",
  "ساعده",
  "ساعدها",
  "النجدة",
  "نجدة",
  "يا نجدة",
  "هيلب",
  "الحقوني",
  "الحقني",
  "الحقونا",
  "يا ناس",
  "حد يساعدني",
  "حد يساعدنا",
  "انقذني",
  "انقذوني",
  "انقذونا",
  "انقذنا",
  "اغاثة",
  "اغيثوني",
  "اغيثونا",
  "اغيثني",
  "يا عالم",
  "وينكم",
  "ارجوكم",
  "ارجوك",
  "عاونوني",
  "عاونني",
  "عاونونا",
  "يلا",
  "تعالوا",
  "تعال",
  "احنا هون",
  "انا هون",
  "احنا هنا",
  "انا هنا",
  "بدي اصرخ",
  "رح اصرخ",
  "اريد اصرخ",
  "صوت",
  "صوتي",
  "اصوت",
  "اصيح",
  "صيحة",
  "بصيح",
];

function GameScene({ character, onGameComplete, onBackToMenu }) {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [gameState, setGameState] = useState("intro"); // intro, playing, gameover, victory
  const [gameMessage, setGameMessage] = useState("");
  const [waitingForInput, setWaitingForInput] = useState(false);
  const mediaRecorderRef = useRef(null);

  // Send a choice into the Phaser scene
  const sendChoiceToGame = useCallback((choice) => {
    const game = phaserGameRef.current;
    if (game) {
      const scene = game.scene.scenes[0];
      if (scene && scene.handleUserChoice) {
        scene.handleUserChoice(choice);
        // Don't disable controls for unclear choices — let the user retry immediately
        if (choice !== "unclear") {
          setWaitingForInput(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: "phaser-game",
      width: 800,
      height: 500,
      backgroundColor: "#111111",
      scene: SurvivalGame,
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    game.registry.set("character", character);
    game.registry.set("updateGameState", (state, message) => {
      setGameState(state);
      setGameMessage(message);
      if (state === "waiting") {
        setWaitingForInput(true);
      }
    });

    return () => {
      game.destroy(true);
      phaserGameRef.current = null;
    };
  }, [character]);

  // ---------- Voice Recognition (browser Speech API — no AI needed) ----------
  const recognitionRef = useRef(null);

  const matchChoice = (transcript) => {
    // Normalize: lowercase, strip diacritics/tashkeel, extra spaces
    const lower = transcript
      .toLowerCase()
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // remove Arabic diacritics
      .replace(/\s+/g, " ")
      .trim();
    console.log("[Speech] Transcript:", transcript, "→ Normalized:", lower);

    const knockScore = KNOCK_KEYWORDS.reduce(
      (score, kw) => score + (lower.includes(kw) ? 1 : 0),
      0,
    );
    const screamScore = SCREAM_KEYWORDS.reduce(
      (score, kw) => score + (lower.includes(kw) ? 1 : 0),
      0,
    );
    if (knockScore > 0 && knockScore >= screamScore) return "knock";
    if (screamScore > 0) return "scream";
    return "unclear";
  };

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: use MediaRecorder + simple volume-based detection
      startFallbackRecording();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA"; // Arabic (Saudi) for better dialect coverage
    recognition.interimResults = false;
    recognition.maxAlternatives = 5; // more alternatives = better chance of matching
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let bestChoice = "unclear";
      // Check ALL alternatives from ALL results
      for (let r = 0; r < event.results.length; r++) {
        for (let i = 0; i < event.results[r].length; i++) {
          const transcript = event.results[r][i].transcript;
          const choice = matchChoice(transcript);
          if (choice !== "unclear") {
            bestChoice = choice;
            break;
          }
        }
        if (bestChoice !== "unclear") break;
      }
      sendChoiceToGame(bestChoice);
      if (bestChoice === "unclear") {
        setStatusMessage(
          "❓ لم أفهم، حاول مرة أخرى - Didn't understand, try again",
        );
      } else {
        setStatusMessage(
          `✅ تم الفهم: ${bestChoice === "knock" ? "طرق - Knock" : "صراخ - Scream"}`,
        );
      }
      setTimeout(() => setStatusMessage(""), 3000);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        setStatusMessage("❓ لم أسمع شيئاً - No speech detected");
      } else {
        setStatusMessage(
          "❌ خطأ في التعرف على الصوت - Speech recognition error",
        );
      }
      setTimeout(() => setStatusMessage(""), 3000);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
      setIsRecording(true);
      setStatusMessage("🎤 تحدث الآن... Speak now...");
    } catch {
      setStatusMessage("❌ لا يمكن تشغيل التعرف على الصوت");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Fallback for browsers without SpeechRecognition — volume-based detection
  // Loud = scream, rhythmic/quiet = knock
  const startFallbackRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxVolume = 0;
      let sampleCount = 0;
      let totalVolume = 0;

      setIsRecording(true);
      setStatusMessage("🎤 تحدث الآن... Speak now...");

      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avg > maxVolume) maxVolume = avg;
        totalVolume += avg;
        sampleCount++;
      }, 50);

      // Stop after 3 seconds
      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
        setIsRecording(false);

        const avgVolume = sampleCount > 0 ? totalVolume / sampleCount : 0;

        // High volume = scream, lower = knock
        let choice;
        if (maxVolume < 20) {
          choice = "unclear";
          setStatusMessage("❓ لم أسمع شيئاً - No sound detected");
        } else if (avgVolume > 60 || maxVolume > 150) {
          choice = "scream";
          setStatusMessage("✅ تم الفهم: صراخ - Scream");
        } else {
          choice = "knock";
          setStatusMessage("✅ تم الفهم: طرق - Knock");
        }
        sendChoiceToGame(choice);
        setTimeout(() => setStatusMessage(""), 3000);
      }, 3000);
    } catch {
      setStatusMessage("❌ لا يمكن الوصول للمايكروفون - Mic access denied");
    }
  };

  const handleHintClick = () => {
    // Trigger wolf hint inside Phaser scene (plays hint.mp3)
    const game = phaserGameRef.current;
    if (game) {
      const scene = game.scene.scenes[0];
      if (scene && scene.showHint) {
        scene.showHint();
      }
    }
  };

  const handleTryAgain = () => {
    const game = phaserGameRef.current;
    if (game) {
      game.scene.scenes[0].scene.restart();
    }
    setGameState("intro");
    setGameMessage("");
    setWaitingForInput(false);
  };

  const handleEndGame = () => {
    if (gameState === "victory") onGameComplete(10);
    onBackToMenu();
  };

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <button className="back-button" onClick={onBackToMenu}>
          ← العودة
        </button>
        <h3>سيناريو: محاصر في مبنى - Trapped in Building</h3>
        <button className="hint-button" onClick={handleHintClick}>
          💡 تلميح
        </button>
      </div>

      {/* Phaser Canvas */}
      <div id="phaser-game" ref={gameRef}></div>

      {/* Voice & Choice Controls */}
      <div className="voice-controls">
        <p>🎤 استخدم صوتك</p>

        <button
          className={`record-button ${isRecording ? "recording" : ""}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!waitingForInput}
          style={{ opacity: waitingForInput ? 1 : 0.5 }}
        >
          {isRecording
            ? "🔴 جاري الاستماع... Listening..."
            : "🎤 اضغط للتحدث - Press to Speak"}
        </button>

        {statusMessage && (
          <div
            className={`status-message ${statusMessage.includes("✅") ? "success" : statusMessage.includes("❌") ? "error" : "processing"}`}
          >
            {statusMessage}
          </div>
        )}
      </div>

      {/* Hint is now handled inside Phaser scene via wolf overlay + hint.mp3 */}

      {/* Game Over */}
      {gameState === "gameover" && (
        <>
          <div className="game-overlay" />
          <div className="game-result defeat">
            <h2>❌ انتهت اللعبة</h2>
            <p>{gameMessage}</p>
            <div className="result-buttons">
              <button onClick={handleTryAgain}>🔄 حاول مرة أخرى</button>
              <button className="secondary" onClick={handleEndGame}>
                ← العودة للقائمة
              </button>
            </div>
          </div>
        </>
      )}

      {/* Victory */}
      {gameState === "victory" && (
        <>
          <div className="game-overlay" />
          <div className="game-result victory">
            <h2>🎉 مبروك! - Congratulations!</h2>
            <p>{gameMessage}</p>
            <p className="token-award">🪙 لقد ربحت 10 رموز معرفية!</p>
            <div className="result-buttons">
              <button onClick={handleEndGame}>✅ إنهاء اللعبة</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GameScene;
