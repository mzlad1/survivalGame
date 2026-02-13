# API Integration Guide - Voice & AI Features

## 🎤 Complete Voice Processing Pipeline

### Architecture Overview
```
User Speaks (Arabic) 
    ↓
Web Audio API (Browser Recording)
    ↓
OpenAI Whisper API (Speech-to-Text)
    ↓
Claude API (Intent Recognition)
    ↓
Game Response
    ↓
ElevenLabs TTS (Text-to-Speech - Arabic)
    ↓
Audio Playback
```

---

## 1️⃣ OpenAI Whisper API - Speech Recognition

### Get API Key:
1. Visit: https://platform.openai.com/api-keys
2. Create account or sign in
3. Click "Create new secret key"
4. Copy key (format: `sk-...`)
5. **Important:** Keep this secret! Never commit to GitHub

### Pricing:
- **$0.006 per minute** of audio
- Example: 100 children playing 5 minutes each = 500 minutes = **$3**

### Implementation:

```javascript
// src/utils/voiceAPI.js
export const transcribeAudio = async (audioBlob, apiKey) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'ar'); // Arabic
  formData.append('response_format', 'json');

  const response = await fetch(
    'https://api.openai.com/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.status}`);
  }

  const data = await response.json();
  return data.text; // The transcribed Arabic text
};
```

### Usage Example:
```javascript
const arabicText = await transcribeAudio(audioBlob, 'sk-YOUR-KEY-HERE');
console.log('Child said:', arabicText);
// Output: "يجب أن أطرق على الصخور"
```

---

## 2️⃣ Claude API - Intent Recognition

### Get API Key:
1. Visit: https://console.anthropic.com
2. Create account
3. Go to API Keys section
4. Generate new key

### Pricing:
- Claude Sonnet 4: **$3 per million input tokens**, **$15 per million output tokens**
- Average usage per game: ~200 tokens = **$0.0006** per child
- 1000 children = **$0.60**

### Implementation:

```javascript
// src/utils/claudeAPI.js
export const analyzeChoice = async (arabicText, apiKey) => {
  const response = await fetch(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `A Palestinian child in a survival game said: "${arabicText}"

They need to choose between:
- "knock" (الطرق): knocking on solid objects
- "scream" (الصراخ): screaming for help

Analyze their Arabic text and determine which action they chose.
Respond with ONLY ONE WORD: "knock", "scream", or "unclear"

Common Arabic phrases:
- Knock: طرق، اطرق، دق، اضرب، خبط
- Scream: صراخ، صرخ، استغاثة، نادي، ساعدني، النجدة`
        }]
      })
    }
  );

  const data = await response.json();
  const choice = data.content[0].text.trim().toLowerCase();
  
  // Validate response
  if (!['knock', 'scream', 'unclear'].includes(choice)) {
    return 'unclear';
  }
  
  return choice;
};
```

### Advanced Version with Confidence Score:

```javascript
export const analyzeChoiceAdvanced = async (arabicText, apiKey) => {
  const response = await fetch(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Analyze this Arabic text from a child: "${arabicText}"

Determine their choice and confidence level.
Respond in JSON format:
{
  "choice": "knock" | "scream" | "unclear",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation in English"
}`
        }]
      })
    }
  );

  const data = await response.json();
  const jsonText = data.content[0].text.trim();
  
  // Remove markdown code blocks if present
  const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '');
  
  return JSON.parse(cleanJson);
};
```

---

## 3️⃣ ElevenLabs - Text-to-Speech (Arabic)

### Get API Key:
1. Visit: https://elevenlabs.io
2. Create account (Free tier: 10,000 characters/month)
3. Go to Profile → API Keys
4. Copy key

### Pricing:
- **Free tier:** 10,000 characters/month (good for testing!)
- **Starter:** $5/month - 30,000 characters
- **Creator:** $22/month - 100,000 characters

### Find Arabic Voices:
1. Go to "Voice Library"
2. Filter by Language → Arabic
3. Preview and note the voice_id
4. Recommended voices:
   - `pNInz6obpgDQGcFmaJgB` - Abdul (Youthful, friendly)
   - Other options available in voice library

### Implementation:

```javascript
// src/utils/ttsAPI.js
export const generateSpeech = async (text, voiceId, apiKey) => {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  return await response.blob();
};

export const playAudio = async (audioBlob) => {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  return new Promise((resolve, reject) => {
    audio.onended = resolve;
    audio.onerror = reject;
    audio.play();
  });
};
```

### Pre-generate Audio Files (Recommended for Hackathon):

```javascript
// scripts/generateAudio.js
const ElevenLabs = require('elevenlabs-node');

const voice = new ElevenLabs({
  apiKey: 'YOUR_API_KEY',
  voiceId: 'VOICE_ID'
});

const phrases = {
  intro: 'مرحبا أنا اسمي صبحي، يسعدني اصطحابك في رحلة تعليمية مميزة للنجاة من الكوارث',
  correct: 'أحسنت! الطرق على الأجسام الصلبة هو الخيار الصحيح',
  wrong: 'خيار خاطئ! الصراخ يستنزف طاقتك',
  unclear: 'لم أفهم، من فضلك أعد خيارك',
  hint: 'يجب أن تطرق على الأجسام الصلبة لجذب انتباه فريق الإنقاذ'
};

// Generate all audio files
for (const [name, text] of Object.entries(phrases)) {
  const audio = await voice.textToSpeech({
    text: text,
    modelId: 'eleven_multilingual_v2'
  });
  
  const fs = require('fs');
  fs.writeFileSync(`public/assets/audio/${name}.mp3`, audio);
}
```

---

## 4️⃣ Complete Integration in GameScene

```javascript
// src/components/GameScene.js - Updated version

import { transcribeAudio } from '../utils/voiceAPI';
import { analyzeChoice } from '../utils/claudeAPI';
import { generateSpeech, playAudio } from '../utils/ttsAPI';

// Add to component state
const [audioCache, setAudioCache] = useState({});

// API Keys (In production, use environment variables)
const OPENAI_KEY = process.env.REACT_APP_OPENAI_KEY;
const CLAUDE_KEY = process.env.REACT_APP_CLAUDE_KEY;
const ELEVENLABS_KEY = process.env.REACT_APP_ELEVENLABS_KEY;
const VOICE_ID = process.env.REACT_APP_VOICE_ID;

const processVoiceInput = async (audioBlob) => {
  setStatusMessage('⏳ جاري التحليل... Analyzing...');

  try {
    // Step 1: Speech-to-Text
    const arabicText = await transcribeAudio(audioBlob, OPENAI_KEY);
    console.log('Transcribed:', arabicText);
    
    setStatusMessage(`📝 فهمت: ${arabicText}`);
    await new Promise(r => setTimeout(r, 1000));

    // Step 2: Analyze Intent
    setStatusMessage('🤖 جاري تحليل الاختيار... Analyzing choice...');
    const choice = await analyzeChoice(arabicText, CLAUDE_KEY);
    console.log('Detected choice:', choice);

    // Step 3: Trigger game action
    if (phaserGame) {
      const scene = phaserGame.scene.scenes[0];
      if (scene && scene.handleUserChoice) {
        scene.handleUserChoice(choice);
      }
    }

    // Step 4: Generate and play response audio
    const responseText = getResponseText(choice);
    const audioBlob = await generateSpeech(responseText, VOICE_ID, ELEVENLABS_KEY);
    await playAudio(audioBlob);

    setStatusMessage('✅ تم!');
    setTimeout(() => setStatusMessage(''), 2000);

  } catch (error) {
    console.error('Processing error:', error);
    setStatusMessage('❌ خطأ - حاول مرة أخرى');
  }
};

const getResponseText = (choice) => {
  const responses = {
    knock: 'أحسنت! الطرق على الأجسام الصلبة هو الخيار الصحيح',
    scream: 'خيار خاطئ! الصراخ يستنزف طاقتك',
    unclear: 'لم أفهم، من فضلك أعد خيارك'
  };
  return responses[choice] || responses.unclear;
};
```

---

## 5️⃣ Environment Variables Setup

Create `.env` file in project root:

```bash
# .env
REACT_APP_OPENAI_KEY=sk-...
REACT_APP_CLAUDE_KEY=sk-ant-...
REACT_APP_ELEVENLABS_KEY=...
REACT_APP_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

**⚠️ IMPORTANT:** Add `.env` to `.gitignore`:
```
# .gitignore
.env
.env.local
```

Access in code:
```javascript
const apiKey = process.env.REACT_APP_OPENAI_KEY;
```

---

## 6️⃣ Error Handling & Retries

```javascript
// src/utils/apiHelpers.js

export const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      console.log(`Retry ${i + 1} after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

// Usage:
const text = await retryWithBackoff(() => 
  transcribeAudio(audioBlob, apiKey)
);
```

---

## 7️⃣ Offline Fallback (For Demo/Hackathon)

```javascript
// src/utils/offlineMode.js

export const offlineAnalyzeChoice = (arabicText) => {
  const text = arabicText.toLowerCase();
  
  // Knock keywords
  const knockWords = ['طرق', 'اطرق', 'دق', 'اضرب', 'خبط'];
  if (knockWords.some(word => text.includes(word))) {
    return 'knock';
  }
  
  // Scream keywords
  const screamWords = ['صراخ', 'صرخ', 'استغاثة', 'نادي', 'ساعد', 'نجدة'];
  if (screamWords.some(word => text.includes(word))) {
    return 'scream';
  }
  
  return 'unclear';
};

// Use as fallback
const processVoiceInput = async (audioBlob) => {
  try {
    // Try API first
    const text = await transcribeAudio(audioBlob, apiKey);
    const choice = await analyzeChoice(text, claudeKey);
    return choice;
  } catch (error) {
    console.warn('API failed, using offline mode');
    // Use Web Speech API as backup
    const text = await browserSpeechRecognition();
    return offlineAnalyzeChoice(text);
  }
};
```

---

## 8️⃣ Cost Optimization Tips

### Pre-generate Audio Files
Instead of generating TTS live, pre-generate all possible responses:
```bash
# Generate once, reuse forever
responses/
  correct-knock.mp3
  wrong-scream.mp3
  unclear.mp3
  hint.mp3
```

### Cache API Responses
```javascript
const responseCache = {};

const getCachedChoice = async (text) => {
  if (responseCache[text]) {
    return responseCache[text];
  }
  
  const choice = await analyzeChoice(text, apiKey);
  responseCache[text] = choice;
  return choice;
};
```

### Use Smaller Models
```javascript
// For simple yes/no tasks, use Haiku instead of Sonnet
model: 'claude-haiku-4-20250514' // Much cheaper!
```

---

## 9️⃣ Testing Without APIs (Hackathon)

```javascript
// src/utils/mockAPI.js

export const mockTranscribeAudio = async (audioBlob) => {
  await new Promise(r => setTimeout(r, 1000)); // Simulate delay
  
  // Random Arabic responses
  const responses = [
    'يجب أن أطرق على الصخور',
    'سأصرخ للمساعدة',
    'لا أعرف ماذا أفعل'
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

export const mockAnalyzeChoice = async (text) => {
  await new Promise(r => setTimeout(r, 500));
  
  if (text.includes('طرق')) return 'knock';
  if (text.includes('صرخ')) return 'scream';
  return 'unclear';
};

// Toggle in development
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

export const transcribe = USE_MOCK ? mockTranscribeAudio : transcribeAudio;
export const analyze = USE_MOCK ? mockAnalyzeChoice : analyzeChoice;
```

---

## 🎯 Hackathon Priority

**For demo/hackathon:**
1. ✅ Use pre-recorded audio files (fastest)
2. ✅ Use mock/random responses for testing
3. ✅ Show API integration in code (for judges)
4. ⏰ Add real APIs only if time permits

**After hackathon:**
1. Integrate real APIs
2. Add error handling
3. Optimize costs
4. Scale up

---

## 📊 Cost Estimation (1000 Users)

| Service | Usage | Cost |
|---------|-------|------|
| Whisper API | 1000 kids × 5 min | $30 |
| Claude API | 1000 kids × 3 calls | $2 |
| ElevenLabs | Pre-generated | $0 |
| **Total** | | **$32** |

**Optimization:** $3-5 per 1000 users with caching & pre-generated audio

---

## 🔒 Security Best Practices

1. **Never expose API keys in frontend code**
2. **Use backend proxy** for API calls (recommended)
3. **Rate limiting** to prevent abuse
4. **Monitor usage** to detect anomalies

### Backend Proxy Example (Node.js):

```javascript
// server.js
const express = require('express');
const app = express();

app.post('/api/transcribe', async (req, res) => {
  const audioBlob = req.body.audio;
  
  // Call Whisper API server-side
  const result = await callWhisperAPI(audioBlob);
  
  res.json(result);
});

app.listen(3001);
```

---

## 📞 Support Resources

- **OpenAI Docs:** https://platform.openai.com/docs
- **Claude API Docs:** https://docs.anthropic.com
- **ElevenLabs Docs:** https://docs.elevenlabs.io
- **Community:** Discord, Reddit, Stack Overflow

---

Good luck! 🚀
