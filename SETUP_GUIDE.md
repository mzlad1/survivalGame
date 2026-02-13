# Gaza Survival Game - Complete Setup Guide

## 🚀 Quick Start (For Hackathon - 1 Day)

### Prerequisites
- **Node.js** (v16 or higher) - Download from https://nodejs.org
- **Code Editor** - VS Code recommended (https://code.visualstudio.com)
- **Chrome Browser** - For testing

---

## 📥 STEP 1: Install Node.js (15 minutes)

### Windows:
1. Go to https://nodejs.org
2. Download "LTS" version (e.g., 18.x or 20.x)
3. Run installer, click "Next" through all steps
4. Restart your computer

### Mac:
1. Go to https://nodejs.org
2. Download "LTS" version
3. Run .pkg installer
4. Open Terminal and verify: `node --version`

### Verify Installation:
Open Command Prompt (Windows) or Terminal (Mac) and type:
```bash
node --version
npm --version
```
You should see version numbers like `v18.x.x` and `9.x.x`

---

## 📂 STEP 2: Setup Project (5 minutes)

### Option A: Use the provided files
1. Copy all the project files to a folder (e.g., `C:\Projects\gaza-survival-game`)
2. Open Command Prompt / Terminal in that folder
3. Run: `npm install`
4. Wait 2-5 minutes for all packages to download

### Option B: Create from scratch
```bash
# Create new React app
npx create-react-app gaza-survival-game
cd gaza-survival-game

# Install required packages
npm install phaser@^3.70.0 openai@^4.20.1 axios@^1.6.2

# Replace src/ files with the provided files
```

---

## 🎮 STEP 3: Run the Application (1 minute)

```bash
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

**Troubleshooting:**
- If port 3000 is busy, it will ask to use 3001 - type `Y`
- If "command not found", make sure Node.js is installed
- If modules missing, run `npm install` again

---

## 🔧 STEP 4: API Integration (For Production)

### A. Voice-to-Text (Arabic) - OpenAI Whisper

**Get API Key:**
1. Go to https://platform.openai.com
2. Sign up / Log in
3. Go to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)

**Add to code** (in `src/components/GameScene.js`):

Replace the `simulateVoiceProcessing` function with:

```javascript
const processVoiceInput = async (audioBlob) => {
  setStatusMessage('⏳ جاري المعالجة... Processing...');

  try {
    // Step 1: Convert voice to text (Whisper API)
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'ar');

    const transcriptionResponse = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_OPENAI_API_KEY_HERE`
        },
        body: formData
      }
    );

    const { text } = await transcriptionResponse.json();
    console.log('User said:', text);

    // Step 2: Determine choice using Claude
    const choiceResponse = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'YOUR_ANTHROPIC_API_KEY_HERE',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `The child said in Arabic: "${text}". 
            Determine if they chose:
            1. "scream" (صراخ/صرخ/استغاثة/نادي/ساعدني/النجدة)
            2. "knock" (طرق/دق/اطرق/خبط/اضرب)
            3. "unclear" (if you can't determine)
            
            Respond with ONLY one word: scream, knock, or unclear`
          }]
        })
      }
    );

    const claudeData = await choiceResponse.json();
    const choice = claudeData.content[0].text.trim().toLowerCase();

    // Trigger game action
    if (phaserGame) {
      const scene = phaserGame.scene.scenes[0];
      if (scene && scene.handleUserChoice) {
        scene.handleUserChoice(choice);
      }
    }

    setStatusMessage('✅ تم الفهم - Understood!');
    setTimeout(() => setStatusMessage(''), 3000);

  } catch (error) {
    console.error('Error processing voice:', error);
    setStatusMessage('❌ خطأ في المعالجة - Processing error');
  }
};
```

### B. Text-to-Speech (Arabic) - ElevenLabs

**Setup:**
1. Go to https://elevenlabs.io
2. Create account (free tier available)
3. Go to "Voice Library" and select Arabic voices
4. Get API key from Settings

**Generate character voices:**

```javascript
// Example: Generate audio for character dialogue
const generateVoice = async (text, voiceId) => {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': 'YOUR_ELEVENLABS_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    }
  );

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
};

// Use in character dialogue:
generateVoice('أحسنت! هذا هو الخيار الصحيح', 'VOICE_ID_HERE');
```

**Alternative (Free): Google Cloud TTS**
- More complex setup but free tier available
- Supports Arabic voices
- Documentation: https://cloud.google.com/text-to-speech

---

## 📱 STEP 5: Test on Mobile (30 minutes)

### Quick Mobile Testing:

**Method 1: Using your local network**
1. Make sure your phone and computer are on same WiFi
2. Find your computer's IP address:
   - Windows: Run `ipconfig` in Command Prompt, look for IPv4
   - Mac: Run `ifconfig | grep inet` in Terminal
3. On your phone's browser, go to: `http://YOUR_IP:3000`
   Example: `http://192.168.1.10:3000`

**Method 2: Using Ngrok (Easier)**
```bash
# Install ngrok
npm install -g ngrok

# In a new terminal, run:
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Open this URL on your phone
```

---

## 📦 STEP 6: Build for Production (1 hour)

### Convert to Mobile App using Capacitor:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init

# Build web version
npm run build

# Add Android platform
npm install @capacitor/android
npx cap add android

# Install Android Studio
# Download from: https://developer.android.com/studio
# Follow installation wizard

# Open Android project
npx cap open android

# In Android Studio:
# 1. Wait for Gradle sync
# 2. Connect phone via USB (enable USB debugging)
# 3. Click green "Run" button
```

---

## 🎨 STEP 7: Adding Graphics & Audio Assets

### Directory Structure:
```
public/
  assets/
    characters/
      sobhi.png
      layla.png
      kareem.png
    audio/
      intro-sobhi.mp3
      intro-layla.mp3
      explosion.mp3
      knock.mp3
      rescue.mp3
    backgrounds/
      rubble.jpg
      building.png
```

### Loading Assets in Phaser:

Update `SurvivalGame.js` preload method:

```javascript
preload() {
  // Load images
  this.load.image('sobhi', 'assets/characters/sobhi.png');
  this.load.image('layla', 'assets/characters/layla.png');
  this.load.image('kareem', 'assets/characters/kareem.png');
  this.load.image('building', 'assets/backgrounds/building.png');
  this.load.image('rubble', 'assets/backgrounds/rubble.jpg');

  // Load audio
  this.load.audio('explosion', 'assets/audio/explosion.mp3');
  this.load.audio('knock', 'assets/audio/knock.mp3');
  this.load.audio('rescue', 'assets/audio/rescue.mp3');
  this.load.audio('intro-sobhi', 'assets/audio/intro-sobhi.mp3');
}
```

### Using Assets in Game:

```javascript
create() {
  // Use image instead of circle
  this.characterSprite = this.add.sprite(400, 350, 'sobhi');
  this.characterSprite.setScale(0.5); // Adjust size

  // Play sound
  this.sound.play('explosion');
}
```

---

## 🎯 HACKATHON PRIORITIES (24 Hour Timeline)

### Hour 0-2: Setup ✅
- Install Node.js
- Setup project
- Run basic version
- Test on phone

### Hour 2-6: Core Functionality
- Get basic game working
- Test voice recording
- Add simple animations

### Hour 6-12: Polish
- Add better graphics (use free assets from itch.io, kenney.nl)
- Record/generate Arabic audio
- Test full flow

### Hour 12-18: API Integration
- Connect Whisper API for voice
- Connect Claude API for choices
- Test end-to-end

### Hour 18-22: Final Polish
- Fix bugs
- Test on multiple phones
- Prepare demo

### Hour 22-24: Demo Preparation
- Practice presentation
- Create backup plan (video recording)
- Sleep!

---

## 🆓 Free Resources for Assets

### Graphics:
- **Kenney.nl** - Free game assets
- **Itch.io** - Free 2D sprites
- **OpenGameArt.org** - Free game graphics
- **Flaticon.com** - Free icons

### Sounds:
- **Freesound.org** - Free sound effects
- **Zapsplat.com** - Free SFX
- **BBC Sound Effects** - Free archive

### Fonts (Arabic):
- **Google Fonts** - Noto Sans Arabic, Cairo
- Free for commercial use

---

## ⚠️ Common Issues & Solutions

### Issue: "npm not recognized"
**Solution:** Restart computer after installing Node.js

### Issue: "Port 3000 already in use"
**Solution:** Type 'Y' to use another port, or kill process:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Mac
lsof -ti:3000 | xargs kill
```

### Issue: Microphone not working
**Solution:** 
- Use HTTPS (required for microphone access)
- Use ngrok for testing
- Check browser permissions

### Issue: Audio won't play on mobile
**Solution:**
- Must be triggered by user interaction
- Add a "Start" button before playing audio

---

## 📞 Quick Help

**Stuck?** Check these:
1. Console errors (F12 in browser)
2. Are all files saved?
3. Did you run `npm install`?
4. Is `npm start` still running?

**Need assets quickly?**
- Use emojis as placeholders
- Use browser text-to-speech as temp voice
- Use simple shapes in Phaser

---

## 🚀 Deployment (For After Hackathon)

### Deploy to Vercel (Free):
```bash
npm install -g vercel
vercel login
vercel
```

### Deploy to Netlify (Free):
```bash
npm run build
# Drag 'build' folder to netlify.com
```

---

## 📝 Next Steps for Full Production

1. **Database Integration** (Firebase/Supabase)
   - Store user profiles
   - Track knowledge tokens
   - Save progress

2. **More Scenarios**
   - Create multiple mini-games
   - Different difficulty levels
   - Achievement system

3. **Better Graphics**
   - Hire artist or use AI art generation
   - Professional animations
   - Character customization

4. **Advanced AI**
   - Natural conversation with character
   - Adaptive difficulty
   - Personalized learning paths

---

## 🎓 Learning Resources

- **React:** reactjs.org/tutorial
- **Phaser:** phaser.io/tutorials
- **Capacitor:** capacitorjs.com/docs
- **Arabic TTS:** cloud.google.com/text-to-speech

---

## Good Luck with Your Hackathon! 🍀

**Remember:**
- Start simple, add features incrementally
- Test often on actual devices
- Have a backup demo video
- Focus on the core experience first
- Polish can come later

**You've got this!** 💪
