# 🎮 Gaza Survival Game - Educational Platform for Palestinian Children

An interactive educational game designed to teach Palestinian children survival skills during crises through AI-powered mini-games with voice interaction in Arabic.

![Status](https://img.shields.io/badge/status-hackathon%20ready-green)
![Platform](https://img.shields.io/badge/platform-web%20%7C%20mobile-blue)
![Language](https://img.shields.io/badge/language-Arabic%20%7C%20English-orange)

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 16+ ([Download](https://nodejs.org))
- Modern browser (Chrome recommended)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

---

## 📱 Features

### ✅ Implemented
- **Profile Creation** - Create child profiles
- **Character Selection** - Choose AI guide (Sobhi, Layla, Kareem)
- **Interactive Game** - Survival scenario in building collapse
- **Voice Input** - Record voice commands in Arabic
- **AI Analysis** - Determines user choice (knock vs scream)
- **Visual Feedback** - Animated responses
- **Knowledge Tokens** - Reward system for learning
- **Bilingual UI** - Arabic + English interface

### 🎯 Core Game Loop
1. Child selects character
2. Game presents survival scenario
3. Child responds with voice (Arabic)
4. AI analyzes response
5. Game reacts accordingly (correct/wrong/unclear)
6. Character explains the reasoning
7. Child earns tokens for success

---

## 🎨 Current Demo Mode

**For hackathon/testing**, the game uses:
- ✅ Simulated voice processing (random choice)
- ✅ Animated graphics using Phaser.js
- ✅ Pre-defined scenarios
- ✅ Character dialogue system

**Production mode** (requires API keys):
- 🔧 OpenAI Whisper (speech-to-text)
- 🔧 Claude API (intent analysis)
- 🔧 ElevenLabs (text-to-speech)

See `API_GUIDE.md` for integration instructions.

---

## 📂 Project Structure

```
gaza-survival-game/
├── public/
│   ├── index.html
│   └── assets/              # Images, audio, videos
├── src/
│   ├── App.js              # Main application
│   ├── App.css             # Global styles
│   ├── components/
│   │   ├── ProfileSetup.js     # User profile creation
│   │   ├── CharacterSelection.js   # Choose AI guide
│   │   └── GameScene.js        # Main game component
│   ├── game/
│   │   └── SurvivalGame.js     # Phaser game logic
│   └── utils/              # API helpers (optional)
├── SETUP_GUIDE.md          # Detailed installation guide
├── API_GUIDE.md            # API integration instructions
└── package.json
```

---

## 🎮 How to Play

1. **Create Profile**
   - Enter name and age
   - Click "ابدأ - Start"

2. **Choose Character**
   - Select your AI guide (Sobhi, Layla, or Kareem)
   - Watch character introduction
   - Click "Start Game"

3. **Survive the Scenario**
   - Watch the crisis scenario unfold
   - Listen to your AI character
   - Press and hold the microphone button
   - Speak your choice in Arabic
   - Release to send

4. **Learn from Feedback**
   - Correct choices advance the game
   - Wrong choices explain the mistake
   - Earn knowledge tokens for success

---

## 🔧 Development

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```

### Deploy
```bash
# Deploy to Vercel
npm install -g vercel
vercel

# Or deploy to Netlify
npm run build
# Upload 'build' folder to netlify.com
```

---

## 📱 Mobile Testing

### Option 1: Local Network
```bash
# Find your IP address
ipconfig      # Windows
ifconfig      # Mac/Linux

# Open on phone: http://YOUR_IP:3000
# Example: http://192.168.1.10:3000
```

### Option 2: Ngrok
```bash
npm install -g ngrok
ngrok http 3000

# Copy HTTPS URL and open on phone
```

### Option 3: Build Mobile App
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Build
npm run build
npx cap add android
npx cap open android

# Run in Android Studio
```

---

## 🎨 Customization

### Add New Characters
Edit `src/components/CharacterSelection.js`:

```javascript
{
  id: 'newchar',
  name: 'اسم جديد - New Name',
  nameArabic: 'اسم جديد',
  emoji: '👶',
  description: 'وصف الشخصية',
  introText: 'مرحبا أنا...'
}
```

### Add New Scenarios
1. Create new Phaser scene in `src/game/`
2. Define scenario logic
3. Add to game registry

### Change Graphics
1. Add images to `public/assets/`
2. Update Phaser preload:
```javascript
this.load.image('key', 'assets/image.png');
```

---

## 🌍 API Integration (Production)

### Required Services
1. **OpenAI** - Whisper API for speech recognition
2. **Anthropic** - Claude API for intent analysis
3. **ElevenLabs** - Arabic text-to-speech

### Environment Setup
Create `.env` file:
```bash
REACT_APP_OPENAI_KEY=sk-...
REACT_APP_CLAUDE_KEY=sk-ant-...
REACT_APP_ELEVENLABS_KEY=...
REACT_APP_VOICE_ID=...
```

**Full integration guide:** See `API_GUIDE.md`

---

## 💰 Cost Estimate

For **1000 users** (5 min gameplay each):

| Service | Cost |
|---------|------|
| OpenAI Whisper | $30 |
| Claude API | $2 |
| ElevenLabs (pre-generated) | $0 |
| **Total** | **~$32** |

**Optimized:** $3-5 with caching and pre-generated audio

---

## 🛠️ Tech Stack

- **Frontend:** React 18
- **Game Engine:** Phaser 3.70
- **AI/ML:** OpenAI Whisper, Claude API
- **Voice:** ElevenLabs, Web Audio API
- **Mobile:** Capacitor (optional)
- **Deployment:** Vercel, Netlify

---

## 🎯 Hackathon Checklist

- [x] Basic project setup
- [x] Profile creation system
- [x] Character selection
- [x] Game scenario implementation
- [x] Voice recording interface
- [x] AI response simulation
- [x] Visual feedback system
- [x] Token reward system
- [ ] Real API integration (optional)
- [ ] Mobile app build (optional)

---

## 📚 Learning Resources

- **React Tutorial:** https://react.dev/learn
- **Phaser Docs:** https://phaser.io/tutorials
- **OpenAI API:** https://platform.openai.com/docs
- **Claude API:** https://docs.anthropic.com
- **Arabic TTS:** https://elevenlabs.io

---

## 🤝 Contributing

This is a hackathon project. For production use:

1. Add comprehensive error handling
2. Implement proper security (backend proxy)
3. Add user authentication
4. Create database for persistence
5. Add more scenarios
6. Professional graphics/audio
7. Multi-language support

---

## 📄 License

Educational project - Free to use and modify for educational purposes.

---

## 🆘 Troubleshooting

### "npm not recognized"
→ Install Node.js and restart computer

### Port 3000 already in use
→ Type 'Y' to use another port

### Microphone not working
→ Use HTTPS (ngrok) or localhost
→ Check browser permissions

### Game not loading
→ Check browser console (F12)
→ Ensure `npm start` is running
→ Clear cache and reload

---

## 📞 Support

**Documentation:**
- `SETUP_GUIDE.md` - Detailed installation
- `API_GUIDE.md` - API integration
- Browser console - Error messages

**Stuck?** Check:
1. Console errors (F12)
2. All files saved?
3. `npm install` completed?
4. Dependencies installed?

---

## 🎓 Educational Value

This platform teaches:
- ✅ Critical thinking during crises
- ✅ Decision-making under pressure
- ✅ Survival skills specific to conflict zones
- ✅ Problem-solving through gamification
- ✅ Technology literacy through interaction

**Target Age:** 7-14 years old
**Language:** Arabic (primary), English (interface)
**Duration:** 5-10 minutes per scenario

---

## 🌟 Future Enhancements

- [ ] Multiple crisis scenarios (earthquake, flood, etc.)
- [ ] Difficulty levels
- [ ] Multiplayer mode
- [ ] Progress tracking & analytics
- [ ] Parent/teacher dashboard
- [ ] Achievement system
- [ ] Leaderboards
- [ ] More AI characters
- [ ] Story mode
- [ ] Offline mode

---

## ❤️ Acknowledgments

Built with care for Palestinian children to learn life-saving skills through technology and gamification.

**Stay safe. Stay educated. Stay hopeful.** 🇵🇸

---

## 📧 Contact

For questions about this project, please refer to the documentation files or open an issue.

---

**Made with ❤️ for educational purposes**
