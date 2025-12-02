import "./style.css";
import Phaser from "phaser";
// IMPORTANT: Extension check karna (.jpg hai ya .png)
import dogAsset from "./dog.png";

// --- 1. CONFIGURATION ---
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#2d2d2d",
  parent: "app",
  // PHYSICS ADD KIYA HAI (Gravity ke liye)
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 500 }, // Niche khinchne ki taqat
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

// Global variables taaki hum inhe update() mein use kar sakein
let player;
let cursors;

// --- 2. PRELOAD ---
function preload() {
  console.log("Phase 1: Preload - Loading assets...");

  // CHANGE: 'load.image' ki jagah 'load.spritesheet'
  this.load.spritesheet("dog", dogAsset, {
    frameWidth: 140, // 3600 / 4 = 900
    frameHeight: 190, // 2400 / 2 = 1200
  });
}

// --- 3. CREATE ---
function create() {
  console.log("Phase 2: Create - Setting up scene...");

  // 1. Controls Setup (Arrow Keys)
  cursors = this.input.keyboard.createCursorKeys();

  // 2. Player Setup (Physics Sprite)
  // Hum screen ke beech mein player bana rahe hain
  player = this.physics.add.sprite(400, 300, "dog");

  // Player Settings
  player.setCollideWorldBounds(true); // Screen se bahar nahi girega
  player.setScale(0.7); // Image bahut badi hai (900px), isliye 15% size kiya
  player.setBounce(0.2); // Girne par thoda bounce karega

  // 3. Create Animation (Running)
  // Hum upar wali line (frames 0, 1, 2, 3) use karenge run ke liye
  this.anims.create({
    key: "run",
    frames: this.anims.generateFrameNumbers("dog", { start: 0, end: 3 }),
    frameRate: 10, // Speed of animation
    repeat: -1, // Loop (-1 matlab chalta rahega)
  });

  // 4. Create Animation (Idle/Rukna)
  this.anims.create({
    key: "idle",
    frames: [{ key: "dog", frame: 0 }], // Sirf pehla frame
    frameRate: 20,
  });

  // Instructions Text
  this.add.text(10, 10, "Arrow Keys: Move & Jump", {
    fontSize: "18px",
    fill: "#fff",
  });
}

// --- 4. UPDATE ---
function update() {
  // Yeh function har second 60 baar chalta hai - Logic yahan likho

  // LEFT Movement
  if (cursors.left.isDown) {
    player.setVelocityX(-200); // Left speed
    player.anims.play("run", true); // Animation on
    player.flipX = true; // Kutta left side dekhega (Mirror)
  }
  // RIGHT Movement
  else if (cursors.right.isDown) {
    player.setVelocityX(200); // Right speed
    player.anims.play("run", true);
    player.flipX = false; // Kutta right side dekhega (Normal)
  }
  // NO Movement (Rukna)
  else {
    player.setVelocityX(0);
    player.anims.play("idle");
  }

  // JUMP (Up Arrow) - Sirf tab jab zameen par ho (blocked.down)
  if (cursors.up.isDown && player.body.blocked.down) {
    player.setVelocityY(-400); // Upar uchhalna
  }
}
