import Phaser from "phaser";

class SurvivalGame extends Phaser.Scene {
  constructor() {
    super({ key: "SurvivalGame" });
    this.character = null;
    this.gamePhase = "intro"; // intro, animating, waiting, processing, complete
    this.updateGameState = null;
    this.characterSprite = null;
    this.dustEmitters = [];
  }

  /* ═══════════════════════════════════════
     PRELOAD — load real assets
     ═══════════════════════════════════════ */
  preload() {
    this.load.image("building", "assets/backgrounds/building.png");
    this.load.image("rubble", "assets/backgrounds/rubble.jpg");
    this.load.audio("explosion", "assets/audio/explosion.mp3");
    this.load.audio("rescue", "assets/audio/rescue.mp3");
    this.load.audio("knock", "assets/audio/knock.mp3");
    this.load.audio("scream", "assets/audio/scream.mp3");
    this.load.audio("coughSobhi", "assets/audio/coughSobhi.mp3");
    this.load.audio("coughLayla", "assets/audio/coughLayla.mp3");
    this.load.audio("coughKareem", "assets/audio/coughKareem.mp3");

    // Character images
    this.load.image("sobhi", "assets/characters/sobhi.png");
    this.load.image("layla", "assets/characters/layla.png");
    this.load.image("kareem", "assets/characters/kareem.png");

    // Fire / rescue images
    this.load.image("fireLeft", "assets/characters/fireLeft.png");
    this.load.image("fireRight", "assets/characters/fireRight.png");

    // Wolf narrator
    this.load.image("wolf", "assets/characters/wolf.png");
    this.load.audio("firstScene", "assets/audio/firstScene.mp3");
    this.load.audio("boombing", "assets/audio/boombing.mp3");
    this.load.audio("knockOrScream", "assets/audio/knockOrScream.mp3");

    // Wolf feedback audio
    this.load.audio("hint", "assets/audio/hint.mp3");
    this.load.audio("wrong", "assets/audio/wrong.mp3");
    this.load.audio("correct", "assets/audio/correct.mp3");
  }

  /* ═══════════════════════════════════════
     CREATE
     ═══════════════════════════════════════ */
  create() {
    this.character = this.registry.get("character");
    this.updateGameState = this.registry.get("updateGameState");

    // Gradient sky background
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    gfx.fillRect(0, 0, 800, 500);

    this.showIntro();
  }

  /* ─────────── helpers ─────────── */
  addArabicText(x, y, text, style = {}) {
    const defaults = {
      fontSize: "20px",
      fontFamily: "Cairo, Tajawal, sans-serif",
      fill: "#eaeaea",
      align: "center",
      wordWrap: { width: 680 },
    };
    const t = this.add.text(x, y, text, { ...defaults, ...style });
    t.setOrigin(0.5);
    return t;
  }

  getCharKey() {
    return this.character?.id || "sobhi";
  }

  /* ─────────── audio management ─────────── */
  // Stop any currently playing wolf narration before starting a new one
  stopWolfAudio() {
    if (this._currentWolfAudio) {
      this._currentWolfAudio.stop();
      this._currentWolfAudio = null;
    }
  }

  playWolfAudio(key, volume = 0.85) {
    this.stopWolfAudio();
    if (this.cache.audio.exists(key)) {
      this._currentWolfAudio = this.sound.add(key, { volume });
      this._currentWolfAudio.play();
      return this._currentWolfAudio;
    }
    return null;
  }

  /* ─────────── wolf overlay (reusable) ─────────── */
  showWolfOverlay(audioKey, duration = 4000) {
    // Wolf image slides in from left
    const wolf = this.add.image(-80, 250, "wolf");
    wolf.setDisplaySize(180, 210);
    wolf.setAlpha(0);
    wolf.setDepth(100);

    // Background dim behind wolf
    const dim = this.add.rectangle(400, 250, 800, 500, 0x000000, 0);
    dim.setDepth(99);
    this.tweens.add({ targets: dim, alpha: 0.3, duration: 300 });

    // Glow ring
    const glow = this.add.circle(-80, 250, 100, 0xe94560, 0);
    glow.setDepth(99);

    // Slide in
    this.tweens.add({
      targets: [wolf, glow],
      x: 140,
      alpha: { value: 1, duration: 400 },
      duration: 600,
      ease: "Back.easeOut",
    });

    // Glow pulse
    this.tweens.add({
      targets: glow,
      alpha: 0.15,
      scaleX: 1.15,
      scaleY: 1.15,
      yoyo: true,
      repeat: -1,
      duration: 600,
      ease: "Sine.easeInOut",
    });

    // Breathing
    this.tweens.add({
      targets: wolf,
      y: 246,
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: "Sine.easeInOut",
    });

    // Sound wave bars while speaking
    const bars = [];
    for (let i = 0; i < 5; i++) {
      const bar = this.add.rectangle(
        100 + i * 18,
        340,
        6,
        10 + Math.random() * 12,
        0xe94560,
        0.8,
      );
      bar.setDepth(101);
      bars.push(bar);
      this.tweens.add({
        targets: bar,
        scaleY: 1.3 + Math.random() * 1.5,
        yoyo: true,
        repeat: -1,
        duration: 180 + i * 50,
        ease: "Sine.easeInOut",
      });
    }

    // Play the audio
    const audio = this.playWolfAudio(audioKey);

    // Auto-remove after audio ends or duration timeout
    const cleanup = () => {
      this.tweens.add({
        targets: [wolf, glow, dim, ...bars],
        alpha: 0,
        x: wolf.x - 60,
        duration: 400,
        onComplete: () => {
          wolf.destroy();
          glow.destroy();
          dim.destroy();
          bars.forEach((b) => b.destroy());
        },
      });
    };

    if (audio) {
      audio.on("complete", cleanup);
      // Safety timeout
      this.time.delayedCall(duration + 2000, () => {
        if (wolf.active) cleanup();
      });
    } else {
      this.time.delayedCall(duration, cleanup);
    }
  }

  /* ─────────── hint (called from React) ─────────── */
  showHint() {
    this.showWolfOverlay("hint", 5000);
  }

  /* ═══════════════════════════════════════
     INTRO SCREEN — Wolf narrator with voice
     ═══════════════════════════════════════ */
  showIntro() {
    // Dark overlay vignette
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.6);
    vignette.fillRect(0, 0, 800, 500);

    // Subtle particle dust floating in background
    for (let i = 0; i < 10; i++) {
      const dust = this.add.circle(
        Math.random() * 800,
        Math.random() * 500,
        1.5 + Math.random() * 2,
        0xffffff,
        0.15 + Math.random() * 0.15,
      );
      this.tweens.add({
        targets: dust,
        y: dust.y - 60 - Math.random() * 80,
        x: dust.x + (Math.random() - 0.5) * 100,
        alpha: 0,
        duration: 4000 + Math.random() * 3000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    // ── Wolf character (large, centered) ──
    const wolf = this.add.image(400, 190, "wolf");
    // Compute final scale for a big 420×400 display size
    const targetScaleX = 420 / wolf.width;
    const targetScaleY = 400 / wolf.height;
    wolf.setAlpha(0);
    wolf.setScale(0.05);

    // Dramatic entrance — scale up + fade in
    this.tweens.add({
      targets: wolf,
      alpha: 1,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: 900,
      ease: "Back.easeOut",
    });

    // Idle breathing after entrance
    this.time.delayedCall(950, () => {
      this.tweens.add({
        targets: wolf,
        y: 186,
        yoyo: true,
        repeat: -1,
        duration: 1600,
        ease: "Sine.easeInOut",
      });
    });

    // Glow ring behind wolf
    const glow = this.add.circle(400, 190, 210, 0xe94560, 0.08);
    glow.setDepth(-1);
    this.tweens.add({
      targets: glow,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.03,
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: "Sine.easeInOut",
    });

    // ── Speech bubble area ──
    const bubbleBg = this.add.rectangle(400, 400, 560, 60, 0x000000, 0.65);
    bubbleBg.setStrokeStyle(1.5, 0xe94560, 0.5);
    bubbleBg.setAlpha(0);

    // Listening indicator (sound wave bars)
    const waveBars = [];
    for (let i = 0; i < 5; i++) {
      const bar = this.add.rectangle(
        370 + i * 15,
        400,
        5,
        8 + Math.random() * 14,
        0xe94560,
        0.7,
      );
      bar.setAlpha(0);
      waveBars.push(bar);
    }

    // ── Play firstScene.mp3 voice ──
    const voiceSound = this.sound.add("firstScene", { volume: 0.85 });
    let voiceFinished = false;

    this.time.delayedCall(1000, () => {
      voiceSound.play();
      bubbleBg.setAlpha(1);
      // Animate wave bars while speaking
      waveBars.forEach((bar, i) => {
        bar.setAlpha(1);
        this.tweens.add({
          targets: bar,
          scaleY: 1.2 + Math.random() * 1.5,
          yoyo: true,
          repeat: -1,
          duration: 200 + i * 60,
          ease: "Sine.easeInOut",
        });
      });

      voiceSound.on("complete", () => {
        voiceFinished = true;
        // Stop wave bars
        waveBars.forEach((bar) => {
          this.tweens.killTweensOf(bar);
          bar.setAlpha(0);
        });
        // Enable the next button
        btnBg.setFillStyle(0xe94560);
        btnBg.setAlpha(1);
        btnLabel.setAlpha(1);
        btnBg.setInteractive({ useHandCursor: true });
        // Pulse button to attract attention
        this.tweens.add({
          targets: [btnBg, btnLabel],
          scaleX: 1.06,
          scaleY: 1.06,
          yoyo: true,
          repeat: 2,
          duration: 350,
          ease: "Sine.easeInOut",
        });
      });
    });

    // ── Next button (disabled until voice ends) ──
    const btnBg = this.add.rectangle(400, 465, 200, 46, 0x555555);
    btnBg.setAlpha(0.5);
    const btnLabel = this.addArabicText(400, 465, "التالي ←", {
      fontSize: "20px",
      fill: "#ffffff",
      fontStyle: "bold",
    });
    btnLabel.setAlpha(0.4);

    btnBg.on("pointerover", () => {
      if (voiceFinished) btnBg.setFillStyle(0xc0392b);
    });
    btnBg.on("pointerout", () => {
      if (voiceFinished) btnBg.setFillStyle(0xe94560);
    });
    btnBg.on("pointerdown", () => {
      if (!voiceFinished) return;
      voiceSound.stop();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.children.removeAll(true);
        this.cameras.main.fadeIn(200, 0, 0, 0);
        this.startBombingAnimation();
      });
    });
  }

  /* ═══════════════════════════════════════
     BOMBING ANIMATION
     ═══════════════════════════════════════ */
  startBombingAnimation() {
    this.gamePhase = "animating";

    // Sky
    const skyGfx = this.add.graphics();
    skyGfx.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x1a1a2e, 0x1a1a2e, 1);
    skyGfx.fillRect(0, 0, 800, 350);

    // Ground
    this.add.rectangle(400, 425, 800, 150, 0x5d4e37);
    this.add.rectangle(400, 499, 800, 2, 0x3e3428);

    // --- Buildings (use image or fallback) ---
    let building1, building2;
    if (this.textures.exists("building")) {
      building1 = this.add.image(200, 270, "building").setDisplaySize(180, 310);
      building2 = this.add.image(600, 270, "building").setDisplaySize(180, 310);
    } else {
      building1 = this.add.rectangle(200, 270, 160, 310, 0x606060);
      building2 = this.add.rectangle(600, 270, 160, 310, 0x505050);
      // windows
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 3; col++) {
          this.add.rectangle(
            155 + col * 35,
            160 + row * 50,
            18,
            26,
            0xffd700,
            0.6,
          );
          this.add.rectangle(
            555 + col * 35,
            160 + row * 50,
            18,
            26,
            0xffd700,
            0.6,
          );
        }
      }
    }

    // Warning banner
    const warningBg = this.add.rectangle(400, 36, 380, 40, 0x000000, 0.85);
    warningBg.setStrokeStyle(1, 0xff0000, 0.6);
    const warningText = this.addArabicText(400, 36, "⚠️ قصف وشيك!", {
      fontSize: "22px",
      fill: "#ff4444",
      fontStyle: "bold",
    });

    // Flashing warning
    this.tweens.add({
      targets: [warningBg, warningText],
      alpha: 0.3,
      yoyo: true,
      repeat: 6,
      duration: 350,
    });

    // --- Wolf narrator says boombing ---
    const boombingSound = this.sound.add("boombing", { volume: 0.85 });
    boombingSound.play();

    // Wolf small avatar in corner during bombing
    const wolfNarrator = this.add
      .image(70, 60, "wolf")
      .setDisplaySize(70, 80)
      .setAlpha(0);
    this.tweens.add({ targets: wolfNarrator, alpha: 0.9, duration: 500 });
    // Speaking glow
    const wolfGlow = this.add.circle(70, 60, 42, 0xe94560, 0);
    wolfGlow.setDepth(-1);
    this.tweens.add({
      targets: wolfGlow,
      alpha: 0.2,
      scaleX: 1.2,
      scaleY: 1.2,
      yoyo: true,
      repeat: 4,
      duration: 400,
    });

    // --- Explosion sequence ---
    const explosionSound = this.sound.add("explosion", { volume: 0.5 });

    this.time.delayedCall(800, () => {
      this.createExplosion(180, 160);
      explosionSound.play();
      this.cameras.main.shake(250, 0.012);
    });

    this.time.delayedCall(1800, () => {
      this.createExplosion(620, 200);
      explosionSound.play();
      this.cameras.main.shake(250, 0.012);
    });

    this.time.delayedCall(2800, () => {
      this.createExplosion(400, 120);
      explosionSound.play();
      this.cameras.main.shake(400, 0.025);

      // Building collapse
      this.tweens.add({
        targets: building1,
        angle: -12,
        y: building1.y + 20,
        alpha: 0.6,
        duration: 1200,
        ease: "Bounce.easeOut",
      });
      this.tweens.add({
        targets: building2,
        angle: 9,
        y: building2.y + 15,
        alpha: 0.6,
        duration: 1200,
        ease: "Bounce.easeOut",
      });

      // Falling debris
      for (let i = 0; i < 25; i++) {
        const d = this.add.rectangle(
          100 + Math.random() * 600,
          -20 - Math.random() * 100,
          6 + Math.random() * 14,
          6 + Math.random() * 14,
          Phaser.Math.RND.pick([0x808080, 0x999999, 0x666666, 0x707070]),
          0.7,
        );
        this.tweens.add({
          targets: d,
          y: 380 + Math.random() * 80,
          angle: Math.random() * 360,
          duration: 1000 + Math.random() * 600,
          ease: "Quad.easeIn",
          onComplete: () => d.setAlpha(0.3),
        });
      }
    });

    // Screen flash
    this.time.delayedCall(2800, () => {
      this.cameras.main.flash(300, 255, 200, 150);
    });

    // Transition to gameplay with character stumbling scene
    this.time.delayedCall(4500, () => {
      warningText.destroy();
      warningBg.destroy();

      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.children.removeAll(true);
        this.cameras.main.fadeIn(400, 0, 0, 0);
        this.showPostExplosionScene();
      });
    });
  }

  /* ─────────── explosion effect ─────────── */
  createExplosion(x, y) {
    // Orange fireball
    const fireball = this.add.circle(x, y, 8, 0xff6600);
    this.tweens.add({
      targets: fireball,
      scaleX: 10,
      scaleY: 10,
      alpha: 0,
      duration: 500,
      ease: "Power2",
      onComplete: () => fireball.destroy(),
    });

    // Inner white flash
    const flash = this.add.circle(x, y, 6, 0xffffff);
    this.tweens.add({
      targets: flash,
      scaleX: 5,
      scaleY: 5,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    // Debris particles
    for (let i = 0; i < 14; i++) {
      const size = 2 + Math.random() * 5;
      const color = Phaser.Math.RND.pick([
        0x808080, 0x999999, 0xff8800, 0x666666,
      ]);
      const debris = this.add.rectangle(x, y, size, size, color);
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 120;
      this.tweens.add({
        targets: debris,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist + 40,
        angle: Math.random() * 360,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        ease: "Power2",
        onComplete: () => debris.destroy(),
      });
    }
  }

  /* ═══════════════════════════════════════
     POST-EXPLOSION — character stumbles & falls
     ═══════════════════════════════════════ */
  showPostExplosionScene() {
    // Dusty dark background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x2a2020, 0x2a2020, 1);
    bg.fillRect(0, 0, 800, 500);

    // ── Wolf narrator says knockOrScream ──
    const knockOrScreamSound = this.sound.add("knockOrScream", {
      volume: 0.85,
    });
    this.time.delayedCall(2800, () => {
      knockOrScreamSound.play();
    });

    // Wolf small avatar in top-left during this scene
    const wolfSmall = this.add
      .image(70, 60, "wolf")
      .setDisplaySize(65, 75)
      .setAlpha(0);
    this.tweens.add({
      targets: wolfSmall,
      alpha: 0.9,
      duration: 600,
      delay: 2800,
    });
    const wolfGlow2 = this.add.circle(70, 60, 40, 0xe94560, 0);
    wolfGlow2.setDepth(-1);
    this.time.delayedCall(2800, () => {
      this.tweens.add({
        targets: wolfGlow2,
        alpha: 0.2,
        scaleX: 1.2,
        scaleY: 1.2,
        yoyo: true,
        repeat: 5,
        duration: 400,
      });
    });

    // Smoke/dust clouds floating
    for (let i = 0; i < 12; i++) {
      const cloud = this.add.circle(
        Math.random() * 800,
        200 + Math.random() * 200,
        30 + Math.random() * 50,
        0x666655,
        0.15 + Math.random() * 0.15,
      );
      this.tweens.add({
        targets: cloud,
        x: cloud.x + (Math.random() - 0.5) * 100,
        y: cloud.y - 40 - Math.random() * 60,
        alpha: 0,
        duration: 2500 + Math.random() * 1500,
        ease: "Sine.easeOut",
      });
    }

    // Ground rubble
    this.add.rectangle(400, 430, 800, 140, 0x4a4035);
    for (let i = 0; i < 20; i++) {
      const rx = 40 + Math.random() * 720;
      const ry = 370 + Math.random() * 80;
      this.add
        .rectangle(
          rx,
          ry,
          10 + Math.random() * 40,
          8 + Math.random() * 20,
          Phaser.Math.RND.pick([0x696969, 0x808080, 0x5a5a5a]),
          0.6,
        )
        .setAngle(Math.random() * 40 - 20);
    }

    // Character stumbles in from left side
    const charKey = this.getCharKey();
    let charImg;
    if (this.textures.exists(charKey)) {
      charImg = this.add.image(-60, 340, charKey);
      charImg.setDisplaySize(100, 140);
      charImg.setAngle(15); // leaning/stumbling
      charImg.setAlpha(0);
    } else {
      charImg = this.add.text(-60, 320, this.character?.emoji || "\u{1F466}", {
        fontSize: "70px",
      });
      charImg.setOrigin(0.5);
      charImg.setAlpha(0);
    }

    // Fade in + stumble walk to center
    this.tweens.add({
      targets: charImg,
      x: 400,
      alpha: 1,
      duration: 1800,
      ease: "Quad.easeOut",
    });

    // Stumble wobble while walking
    this.tweens.add({
      targets: charImg,
      angle: { from: 15, to: -10 },
      yoyo: true,
      repeat: 3,
      duration: 400,
      ease: "Sine.easeInOut",
    });

    // Character falls to knees at ~1.8s
    this.time.delayedCall(1800, () => {
      // Drop down (kneel)
      this.tweens.add({
        targets: charImg,
        y: charImg.y + 30,
        scaleY: charImg.scaleY * 0.85,
        angle: 0,
        duration: 400,
        ease: "Bounce.easeOut",
      });

      // Dust puff on landing
      for (let i = 0; i < 8; i++) {
        const puff = this.add.circle(
          400 + (Math.random() - 0.5) * 60,
          380,
          4 + Math.random() * 6,
          0xbbaa88,
          0.6,
        );
        this.tweens.add({
          targets: puff,
          x: puff.x + (Math.random() - 0.5) * 80,
          y: puff.y - 20 - Math.random() * 40,
          alpha: 0,
          scaleX: 3,
          scaleY: 3,
          duration: 700,
          onComplete: () => puff.destroy(),
        });
      }

      // "Cough" text bubbles + character-specific cough sound
      const coughKey = `cough${this.getCharKey().charAt(0).toUpperCase() + this.getCharKey().slice(1)}`;

      this.time.delayedCall(500, () => {
        if (this.cache.audio.exists(coughKey)) {
          this.sound.play(coughKey, { volume: 0.7 });
        }
        const cough1 = this.addArabicText(430, 290, "*كحة*", {
          fontSize: "16px",
          fill: "#ccbbaa",
          fontStyle: "italic",
        });
        this.tweens.add({
          targets: cough1,
          y: 260,
          alpha: 0,
          duration: 1000,
          onComplete: () => cough1.destroy(),
        });
      });

      this.time.delayedCall(1100, () => {
        if (this.cache.audio.exists(coughKey)) {
          this.sound.play(coughKey, { volume: 0.5 });
        }
        const cough2 = this.addArabicText(370, 300, "*كحة*", {
          fontSize: "14px",
          fill: "#ccbbaa",
          fontStyle: "italic",
        });
        this.tweens.add({
          targets: cough2,
          y: 270,
          alpha: 0,
          duration: 800,
          onComplete: () => cough2.destroy(),
        });
      });
    });

    // Status text
    this.time.delayedCall(600, () => {
      const statusText = this.addArabicText(400, 80, "بعد القصف...", {
        fontSize: "28px",
        fill: "#e94560",
        fontStyle: "bold",
      });
      statusText.setAlpha(0);
      this.tweens.add({ targets: statusText, alpha: 1, duration: 800 });
    });

    this.time.delayedCall(2600, () => {
      const trapped = this.addArabicText(400, 130, "أنت محاصر تحت الأنقاض...", {
        fontSize: "20px",
        fill: "#ddccbb",
      });
      trapped.setAlpha(0);
      this.tweens.add({ targets: trapped, alpha: 1, duration: 600 });
    });

    // Screen shakes slightly (aftershock)
    this.time.delayedCall(2200, () => {
      this.cameras.main.shake(300, 0.006);
    });

    // Transition to actual gameplay
    this.time.delayedCall(4200, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(600, () => {
        this.children.removeAll(true);
        this.cameras.main.fadeIn(400, 0, 0, 0);
        this.startGameplay();
      });
    });
  }

  /* ═══════════════════════════════════════
     GAMEPLAY — trapped in rubble
     ═══════════════════════════════════════ */
  startGameplay() {
    // Use rubble image as background if available
    if (this.textures.exists("rubble")) {
      const bg = this.add.image(400, 250, "rubble");
      bg.setDisplaySize(800, 500);
      bg.setAlpha(0.7);
    } else {
      this.add.rectangle(400, 250, 800, 500, 0x333333);
    }

    // Dark overlay for contrast
    this.add.rectangle(400, 250, 800, 500, 0x000000, 0.45);

    // Rubble debris scattered
    for (let i = 0; i < 18; i++) {
      const rx = 60 + Math.random() * 680;
      const ry = 100 + Math.random() * 340;
      const rw = 20 + Math.random() * 50;
      const rh = 15 + Math.random() * 35;
      const c = Phaser.Math.RND.pick([0x696969, 0x808080, 0x5a5a5a, 0x7a7a6a]);
      const rock = this.add.rectangle(rx, ry, rw, rh, c, 0.5);
      rock.setAngle(Math.random() * 40 - 20);
    }

    // ── Character trapped under rubble (off-center, no box/mask) ──
    const charKey = this.getCharKey();
    // Position character to the right, between rubble piles
    const charX = 500;
    const charY = 290;
    if (this.textures.exists(charKey)) {
      this.characterSprite = this.add.image(charX, charY, charKey);
      this.characterSprite.setDisplaySize(110, 150);
      // No mask — full character visible
      // Subtle breathing bob
      this.tweens.add({
        targets: this.characterSprite,
        y: charY - 3,
        yoyo: true,
        repeat: -1,
        duration: 1400,
        ease: "Sine.easeInOut",
      });
    } else {
      this.characterSprite = this.add.text(
        charX,
        charY,
        this.character?.emoji || "👦",
        { fontSize: "60px" },
      );
      this.characterSprite.setOrigin(0.5);
    }

    // ── Rubble piled around/on top of character ──
    // Big slab across lower body (on top of character layer)
    this.rubblePieces = [];
    const slab = this.add.rectangle(
      charX + 10,
      charY + 50,
      160,
      30,
      0x5c5c5c,
      0.85,
    );
    slab.setAngle(-6);
    this.rubblePieces.push(slab);
    // Cross beam
    const beam = this.add.rectangle(
      charX - 30,
      charY + 30,
      25,
      90,
      0x6a6a5a,
      0.8,
    );
    beam.setAngle(14);
    this.rubblePieces.push(beam);
    // Smaller debris piled on character
    const debrisData = [
      { dx: 40, dy: 55, w: 50, h: 22, a: -12 },
      { dx: -20, dy: 60, w: 55, h: 18, a: 8 },
      { dx: 15, dy: 65, w: 40, h: 25, a: -3 },
      { dx: -40, dy: 45, w: 35, h: 16, a: -18 },
      { dx: 55, dy: 40, w: 42, h: 18, a: 10 },
    ];
    debrisData.forEach((d) => {
      const p = this.add.rectangle(
        charX + d.dx,
        charY + d.dy,
        d.w,
        d.h,
        Phaser.Math.RND.pick([0x707060, 0x555548, 0x686858, 0x5a5a4e]),
        0.8,
      );
      p.setAngle(d.a);
      this.rubblePieces.push(p);
    });
    // Dust overlay on character
    for (let i = 0; i < 5; i++) {
      this.add.circle(
        charX - 15 + Math.random() * 30,
        charY + Math.random() * 30,
        3 + Math.random() * 4,
        0x8a7a60,
        0.2,
      );
    }

    // ── Rock piles flanking the scene ──
    // Left rock pile (knockable)
    this.leftRock = this.add.rectangle(220, 340, 130, 90, 0x555555, 0.9);
    this.leftRock.setAngle(-5);
    this.add.rectangle(190, 310, 60, 40, 0x666656, 0.7).setAngle(-12);
    this.add.rectangle(255, 315, 50, 35, 0x5a5a4a, 0.6).setAngle(8);
    // Right rock pile
    this.add.rectangle(680, 340, 120, 80, 0x555555, 0.9).setAngle(4);
    this.add.rectangle(650, 310, 55, 40, 0x606050, 0.7).setAngle(-8);
    // Ground rubble
    this.add.rectangle(400, 410, 250, 40, 0x555555, 0.7);

    // Hand reaching out
    const hand = this.addArabicText(charX + 35, charY - 30, "✋", {
      fontSize: "24px",
    });
    this.tweens.add({
      targets: hand,
      y: charY - 36,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: "Sine.easeInOut",
    });

    // Floating dust particles
    for (let i = 0; i < 30; i++) {
      const dot = this.add.circle(
        Math.random() * 800,
        Math.random() * 500,
        1 + Math.random() * 2,
        0xaaaaaa,
        0.2 + Math.random() * 0.3,
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - 30 - Math.random() * 50,
        x: dot.x + (Math.random() - 0.5) * 40,
        alpha: 0,
        duration: 3000 + Math.random() * 3000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    // Scenario text
    const boxBg = this.add.rectangle(400, 60, 660, 80, 0x000000, 0.8);
    boxBg.setStrokeStyle(1, 0xe94560, 0.3);
    this.addArabicText(400, 50, "أنت محاصر تحت الأنقاض!", {
      fontSize: "26px",
      fill: "#e94560",
      fontStyle: "bold",
    });
    this.addArabicText(400, 78, "ماذا ستفعل: تطرق على الصخر أم تصرخ؟", {
      fontSize: "16px",
      fill: "#a0a0b0",
    });

    // Instruction bar at bottom
    this.add.rectangle(400, 472, 500, 36, 0x000000, 0.7);
    this.addArabicText(400, 472, "🎤 تحدث بصوتك", {
      fontSize: "14px",
      fill: "#f5c518",
    });

    this.gamePhase = "waiting";
    if (this.updateGameState) this.updateGameState("waiting", "");
  }

  /* ═══════════════════════════════════════
     HANDLE USER CHOICE
     ═══════════════════════════════════════ */
  handleUserChoice(choice) {
    if (this.gamePhase !== "waiting") return;
    this.gamePhase = "processing";

    if (choice === "knock") {
      this.handleCorrectChoice();
    } else if (choice === "scream") {
      this.handleWrongChoice();
    } else {
      this.handleUnclearChoice();
    }
  }

  /* ─── CORRECT: knock ─── */
  handleCorrectChoice() {
    // Play knock sound
    if (this.cache.audio.exists("knock")) {
      this.sound.play("knock", { volume: 0.7 });
    }

    // Wolf appears and says "correct!"
    this.time.delayedCall(500, () => {
      this.showWolfOverlay("correct", 4000);
    });

    // Character turns/leans toward the left rock
    if (this.characterSprite) {
      this.tweens.killTweensOf(this.characterSprite);
      this.tweens.add({
        targets: this.characterSprite,
        x: this.characterSprite.x - 80,
        angle: -10,
        duration: 700,
        ease: "Back.easeOut",
      });
    }

    // Dramatic zoom-in on the action area
    this.cameras.main.zoomTo(1.15, 800, "Sine.easeInOut");

    // Knocking effects — rhythmic impacts on the left rock
    this.time.delayedCall(700, () => {
      for (let i = 0; i < 7; i++) {
        this.time.delayedCall(i * 400, () => {
          const kx = 260 + Math.random() * 20;
          const ky = 340 + Math.random() * 20;

          // Camera micro-shake per knock
          this.cameras.main.shake(80, 0.004);

          // Character bob toward rock (small so stays in mask)
          if (this.characterSprite) {
            this.tweens.add({
              targets: this.characterSprite,
              x: this.characterSprite.x - 8,
              yoyo: true,
              duration: 100,
              ease: "Power2",
            });
          }

          // Impact spark burst
          for (let s = 0; s < 5; s++) {
            const spark = this.add.circle(
              kx,
              ky,
              2 + Math.random() * 3,
              Phaser.Math.RND.pick([0xf5c518, 0xffaa00, 0xffffff]),
            );
            const ang = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 40;
            this.tweens.add({
              targets: spark,
              x: kx + Math.cos(ang) * dist,
              y: ky + Math.sin(ang) * dist,
              alpha: 0,
              duration: 300 + Math.random() * 200,
              onComplete: () => spark.destroy(),
            });
          }

          // Expanding sound-wave rings
          for (let j = 0; j < 4; j++) {
            const wave = this.add.circle(kx, ky, 8 + j * 10);
            wave.setStrokeStyle(2 - j * 0.3, 0xf5c518, 0.7 - j * 0.15);
            this.tweens.add({
              targets: wave,
              scaleX: 3.5,
              scaleY: 3.5,
              alpha: 0,
              duration: 700,
              delay: j * 80,
              onComplete: () => wave.destroy(),
            });
          }

          // Floating knock text
          const knockTexts = ["🔨 طق!", "💪 طق!", "🔨 طق طق!"];
          const txt = this.add.text(
            kx - 30,
            ky - 30,
            knockTexts[i % knockTexts.length],
            { fontSize: "18px", fontFamily: "Cairo", fill: "#f5c518" },
          );
          this.tweens.add({
            targets: txt,
            y: ky - 75,
            alpha: 0,
            duration: 600,
            onComplete: () => txt.destroy(),
          });

          // Rock crack lines
          if (i >= 3 && this.leftRock) {
            const crack = this.add.graphics();
            crack.lineStyle(1.5, 0xdddddd, 0.5);
            crack.beginPath();
            crack.moveTo(kx, ky);
            crack.lineTo(
              kx + (Math.random() - 0.5) * 30,
              ky + (Math.random() - 0.5) * 20,
            );
            crack.strokePath();
          }

          // Rubble pieces jitter on each knock
          if (this.rubblePieces) {
            this.rubblePieces.forEach((piece) => {
              this.tweens.add({
                targets: piece,
                x: piece.x + (Math.random() - 0.5) * 4,
                y: piece.y + (Math.random() - 0.5) * 3,
                yoyo: true,
                duration: 80,
              });
            });
          }
        });
      }
    });

    // Rescue arrival (after knocking)
    this.time.delayedCall(3800, () => {
      // Zoom back
      this.cameras.main.zoomTo(1, 600, "Sine.easeInOut");

      // Play rescue sound
      if (this.cache.audio.exists("rescue")) {
        this.sound.play("rescue", { volume: 0.6 });
      }

      // Rubble pieces fly out (being cleared by rescuers)
      if (this.rubblePieces) {
        this.rubblePieces.forEach((piece, idx) => {
          this.tweens.add({
            targets: piece,
            x: piece.x + (Math.random() - 0.5) * 300,
            y: piece.y - 60 - Math.random() * 100,
            angle: piece.angle + (Math.random() - 0.5) * 90,
            alpha: 0,
            duration: 700 + idx * 100,
            delay: 300 + idx * 70,
            ease: "Power2",
          });
        });
      }

      // Character rises out of rubble
      if (this.characterSprite) {
        this.tweens.add({
          targets: this.characterSprite,
          y: this.characterSprite.y - 50,
          angle: 0,
          duration: 1200,
          delay: 500,
          ease: "Back.easeOut",
        });
      }

      // Bright light beam from above
      const lightBeam = this.add.graphics();
      lightBeam.fillStyle(0xffffff, 0.1);
      lightBeam.fillTriangle(350, 0, 450, 0, 430, 350);
      lightBeam.setAlpha(0);
      this.tweens.add({
        targets: lightBeam,
        alpha: 1,
        duration: 1000,
        yoyo: true,
        hold: 2000,
      });

      // Banner
      const rescueBg = this.add.rectangle(400, 160, 500, 60, 0x000000, 0.85);
      rescueBg.setStrokeStyle(2, 0x2ecc71, 0.8);
      const rescueText = this.addArabicText(400, 160, "🚨 فريق الإنقاذ وصل!", {
        fontSize: "26px",
        fill: "#2ecc71",
        fontStyle: "bold",
      });
      rescueText.setAlpha(0);
      this.tweens.add({ targets: rescueText, alpha: 1, duration: 600 });

      // Rescuer figures running in (fire truck images)
      const fireL = this.add
        .image(-60, 300, "fireLeft")
        .setScale(0.35)
        .setAlpha(0.9);
      const fireR = this.add
        .image(860, 300, "fireRight")
        .setScale(0.35)
        .setAlpha(0.9);

      // Flashing red/blue siren glow behind each
      const sirenL = this.add.circle(-60, 270, 18, 0xe74c3c, 0.6);
      const sirenR = this.add.circle(860, 270, 18, 0x3498db, 0.6);

      // Drive-in animation with slight bounce
      this.tweens.add({
        targets: [fireL, sirenL],
        x: 280,
        duration: 2000,
        ease: "Power2",
        onUpdate: () => {
          // Slight vertical shake while driving
          fireL.y = 300 + Math.sin(Date.now() * 0.015) * 3;
          sirenL.x = fireL.x;
        },
      });
      this.tweens.add({
        targets: [fireR, sirenR],
        x: 520,
        duration: 2000,
        ease: "Power2",
        onUpdate: () => {
          fireR.y = 300 + Math.sin(Date.now() * 0.015) * 3;
          sirenR.x = fireR.x;
        },
      });

      // Siren colour alternating pulse
      this.tweens.add({
        targets: sirenL,
        fillColor: { from: 0xe74c3c, to: 0x3498db },
        alpha: { from: 0.7, to: 0.2 },
        duration: 300,
        yoyo: true,
        repeat: 8,
      });
      this.tweens.add({
        targets: sirenR,
        fillColor: { from: 0x3498db, to: 0xe74c3c },
        alpha: { from: 0.7, to: 0.2 },
        duration: 300,
        yoyo: true,
        repeat: 8,
      });

      // Arrival brake effect — scale bump when they stop
      this.time.delayedCall(2000, () => {
        this.tweens.add({
          targets: fireL,
          scaleX: 0.38,
          scaleY: 0.38,
          duration: 150,
          yoyo: true,
          ease: "Bounce",
        });
        this.tweens.add({
          targets: fireR,
          scaleX: 0.38,
          scaleY: 0.38,
          duration: 150,
          yoyo: true,
          ease: "Bounce",
        });
        // Dust clouds when trucks stop
        for (let d = 0; d < 6; d++) {
          const dx = 280 + (d < 3 ? -20 - d * 12 : 240 + (d - 3) * 12);
          const dust = this.add.circle(
            dx,
            340,
            4 + Math.random() * 5,
            0xbdc3c7,
            0.5,
          );
          this.tweens.add({
            targets: dust,
            y: 320 - Math.random() * 30,
            alpha: 0,
            scale: 2,
            duration: 600 + Math.random() * 300,
            onComplete: () => dust.destroy(),
          });
        }
      });

      // Screen flash green
      this.cameras.main.flash(400, 46, 204, 113);

      // Celebration particles
      this.time.delayedCall(1200, () => {
        for (let i = 0; i < 20; i++) {
          const px = 300 + Math.random() * 200;
          const color = Phaser.Math.RND.pick([
            0x2ecc71, 0xf5c518, 0x3498db, 0xffffff,
          ]);
          const particle = this.add.circle(
            px,
            200,
            3 + Math.random() * 4,
            color,
          );
          this.tweens.add({
            targets: particle,
            y: 100 + Math.random() * 60,
            x: px + (Math.random() - 0.5) * 120,
            alpha: 0,
            duration: 1200 + Math.random() * 600,
            ease: "Quad.easeOut",
            onComplete: () => particle.destroy(),
          });
        }
      });

      this.time.delayedCall(3200, () => {
        const message = `أحسنت! 🎉 الطرق على الأجسام الصلبة هو الخيار الصحيح.\n\nيساعد فريق الإنقاذ على تحديد موقعك بدون أن تستنزف طاقتك.\n\nWell done! Knocking is correct — it helps rescuers locate you without exhausting your energy.`;
        this.updateGameState("victory", message);
      });
    });
  }

  /* ─── WRONG: scream ─── */
  handleWrongChoice() {
    // Play scream sound
    if (this.cache.audio.exists("scream")) {
      this.sound.play("scream", { volume: 0.6 });
    }

    // Wolf appears and says "wrong!"
    this.time.delayedCall(500, () => {
      this.showWolfOverlay("wrong", 4000);
    });

    // Dramatic zoom on character
    this.cameras.main.zoomTo(1.2, 500, "Sine.easeInOut");

    // Character shakes violently in place (stays visible under rubble)
    if (this.characterSprite) {
      this.tweens.killTweensOf(this.characterSprite);

      // Violent shaking — small range so it stays within mask
      this.tweens.add({
        targets: this.characterSprite,
        x: this.characterSprite.x - 4,
        yoyo: true,
        repeat: 14,
        duration: 50,
        ease: "Sine.easeInOut",
      });

      // Character sinks deeper into rubble (losing strength)
      this.tweens.add({
        targets: this.characterSprite,
        y: this.characterSprite.y + 25,
        alpha: 0.6,
        duration: 3500,
        ease: "Quad.easeIn",
      });
      // Extra rubble falls on top of character
      for (let r = 0; r < 4; r++) {
        const extraRock = this.add.rectangle(
          this.characterSprite.x + (Math.random() - 0.5) * 60,
          -20,
          20 + Math.random() * 30,
          12 + Math.random() * 18,
          0x5a5a4e,
          0.7,
        );
        extraRock.setAngle(Math.random() * 30 - 15);
        this.tweens.add({
          targets: extraRock,
          y: this.characterSprite.y + 20 + Math.random() * 40,
          duration: 600 + r * 200,
          delay: 800 + r * 400,
          ease: "Bounce.easeOut",
        });
      }
    }

    // Scream text waves radiating outward
    const screamPhrases = ["النجدة!!", "ساعدوني!!", "أنقذوني!!"];
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 600, () => {
        const screamTxt = this.addArabicText(
          400,
          230 - i * 20,
          `😱 ${screamPhrases[i]}`,
          {
            fontSize: `${28 - i * 3}px`,
            fill: "#ff4444",
            fontStyle: "bold",
          },
        );
        // Text flies upward and fades
        this.tweens.add({
          targets: screamTxt,
          y: screamTxt.y - 80 - i * 30,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 1200,
          ease: "Quad.easeOut",
          onComplete: () => screamTxt.destroy(),
        });

        // Sound wave rings from character mouth
        for (let j = 0; j < 5; j++) {
          const waveRing = this.add.circle(400, 240, 15 + j * 14);
          waveRing.setStrokeStyle(2 - j * 0.3, 0xff4444, 0.5);
          this.tweens.add({
            targets: waveRing,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 900,
            delay: j * 60,
            onComplete: () => waveRing.destroy(),
          });
        }
      });
    }

    // Pulsing red vignette (heartbeat-like fading)
    const redOverlay = this.add.rectangle(400, 250, 800, 500, 0xff0000, 0);
    this.tweens.add({
      targets: redOverlay,
      alpha: 0.2,
      yoyo: true,
      repeat: 5,
      duration: 300,
      ease: "Sine.easeInOut",
    });

    // Energy bar draining
    this.time.delayedCall(800, () => {
      const barBg = this.add.rectangle(400, 445, 260, 18, 0x333333, 0.9);
      barBg.setStrokeStyle(1, 0xff4444, 0.6);
      const barFill = this.add.rectangle(275, 445, 240, 12, 0xff8800);
      barFill.setOrigin(0, 0.5);

      const energyLabel = this.addArabicText(400, 428, "⚡ الطاقة تنفد...", {
        fontSize: "14px",
        fill: "#ff8800",
      });

      // Drain the bar
      this.tweens.add({
        targets: barFill,
        scaleX: 0,
        duration: 2200,
        ease: "Quad.easeIn",
        onComplete: () => {
          // Bar turns red at the end
          barFill.setFillStyle(0xff0000);
        },
      });

      // Color shifts orange → red
      this.time.delayedCall(1200, () => {
        barFill.setFillStyle(0xff4400);
        energyLabel.setText("💔 لا طاقة متبقية...");
        energyLabel.setStyle({ fill: "#ff4444" });
      });
    });

    // Character collapses
    this.time.delayedCall(2800, () => {
      if (this.characterSprite) {
        this.tweens.add({
          targets: this.characterSprite,
          angle: 90,
          y: this.characterSprite.y + 30,
          alpha: 0.4,
          duration: 800,
          ease: "Quad.easeIn",
        });
      }

      // Darken screen
      const darkOverlay = this.add.rectangle(400, 250, 800, 500, 0x000000, 0);
      this.tweens.add({
        targets: darkOverlay,
        alpha: 0.5,
        duration: 1500,
      });
    });

    // Zoom back and show result
    this.time.delayedCall(4000, () => {
      this.cameras.main.zoomTo(1, 500);
      const message = `خيار خاطئ! ❌ الصراخ يستنزف طاقتك وقد لا يسمعك أحد.\n\nالطريقة الأفضل هي الطرق على الأجسام الصلبة لجذب انتباه فرق الإنقاذ.\n\nWrong choice! Screaming wastes energy. Knock on solid objects instead to attract rescue teams.`;
      this.updateGameState("gameover", message);
    });
  }

  /* ─── UNCLEAR ─── */
  handleUnclearChoice() {
    const box = this.add.rectangle(400, 250, 480, 80, 0x000000, 0.85);
    box.setStrokeStyle(1, 0xf5c518, 0.5);
    const confused = this.addArabicText(
      400,
      240,
      "❓ لم أفهم... أعد المحاولة",
      {
        fontSize: "22px",
        fill: "#f5c518",
      },
    );
    const sub = this.addArabicText(400, 268, "Please repeat your choice", {
      fontSize: "14px",
      fill: "#a0a0b0",
    });

    this.time.delayedCall(2500, () => {
      box.destroy();
      confused.destroy();
      sub.destroy();
      this.gamePhase = "waiting";
      // Re-enable React controls so the user can use mic/buttons again
      if (this.updateGameState) this.updateGameState("waiting", "");
    });
  }

  update() {
    // Reserved for future per-frame logic
  }
}

export default SurvivalGame;
