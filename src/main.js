import "./style.css";
import Phaser from "phaser";
import dogAsset from "./Doggy1.png";
import backgroundImage from "./background.png";

// --- 1. CONFIGURATION ---
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#2d2d2d",
  parent: "app",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 },
      debug: false, // Ise true karoge to boxes dikhenge (Testing ke liye)
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

// Global Variables
let player;
let cursors;
let score = 0;
let scoreText;
let platforms;
let stars;
let bombs;

// --- 2. PRELOAD ---
function preload() {
  this.load.image("bg", backgroundImage);

  this.load.spritesheet("dog", dogAsset, {
    frameWidth: 188,
    frameHeight: 265,
  });

  // --- MAGIC: Agar images nahi hain to code se banao ---
  // Platform (Green Bar)
  const platformGraphics = this.make.graphics();
  platformGraphics.fillStyle(0x228b22, 1); // Forest Green
  platformGraphics.fillRect(0, 0, 200, 32);
  platformGraphics.generateTexture("ground", 200, 32);

  // Star (Yellow Coin)
  const starGraphics = this.make.graphics();
  starGraphics.fillStyle(0xffd700, 1); // Gold
  starGraphics.fillCircle(10, 10, 10);
  starGraphics.generateTexture("star", 20, 20);

  // Bomb (Red Ball) Code se banayenge
  const bombGraphics = this.make.graphics();
  bombGraphics.fillStyle(0xff0000, 1); // Laal Rang
  bombGraphics.fillCircle(14, 14, 14); // Size
  bombGraphics.generateTexture("bomb", 28, 28);
}

// --- 3. CREATE ---
function create() {
  score = 0;
  // 1. Background
  const bg = this.add.image(0, 0, "bg");
  bg.setOrigin(0, 0);
  bg.setScale(0.3); // Adjust as per your image

  // Duniya ki width set karo background ke hisab se
  const levelWidth = bg.displayWidth;
  const levelHeight = bg.displayHeight;
  this.physics.world.setBounds(0, 0, levelWidth, levelHeight);

  // --- IMPROVEMENT: PLATFORMS ADD KIYE ---
  platforms = this.physics.add.staticGroup();

  // Zameen (Niche wali floor) - Lambi banayi hai
  // (x, y, texture).setScale().refreshBody()
  platforms.create(200, 580, "ground").setScale(4, 2).refreshBody();
  platforms.create(800, 580, "ground").setScale(4, 2).refreshBody();

  // Hawa mein platforms (Jump karne ke liye)
  platforms.create(400, 450, "ground");
  platforms.create(750, 350, "ground");
  platforms.create(100, 300, "ground");

  // --- FIX: PLAYER SETUP (Sirf EK baar) ---
  player = this.physics.add.sprite(100, 450, "dog"); // Height adjust ki
  player.setCollideWorldBounds(true);
  player.setScale(0.6);
  player.setBounce(0.2);

  player.body.setSize(100, 110);

  // --- Camera Setup ---
  this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);
  this.cameras.main.startFollow(player);

  // --- IMPROVEMENT: STARS ADD KIYE ---
  stars = this.physics.add.group({
    key: "star",
    repeat: 5, // 5 aur stars (Total 6)
    setXY: { x: 300, y: 0, stepX: 150 }, // Har 150px par star
  });

  // Stars thoda bounce karenge
  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  // --- NEW: BOMBS (Dushman) ---
  // Hum bombs ka group banayenge
  bombs = this.physics.add.group();

  // Bomb aur Platform ki takkar (Taaki bomb zameen par chale)
  this.physics.add.collider(bombs, platforms);

  // Bomb aur Player ki takkar (Game Over logic)
  this.physics.add.collider(player, bombs, hitBomb, null, this);

  // --- COLLISIONS (Takkar) ---
  // Player zameen par khada ho sake
  this.physics.add.collider(player, platforms);
  // Stars zameen par girein, aar-paar na jayein
  this.physics.add.collider(stars, platforms);
  // Jab player star ko chuye to collect kare
  this.physics.add.overlap(player, stars, collectStar, null, this);

  // --- Animations ---
  this.anims.create({
    key: "run",
    frames: this.anims.generateFrameNumbers("dog", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "idle",
    frames: [{ key: "dog", frame: 0 }],
    frameRate: 20,
  });

  // Controls
  cursors = this.input.keyboard.createCursorKeys();

  // --- FIX: TEXT SETUP ---
  // Text ko function ke ANDAR laya aur fix kiya
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fill: "#fff",
    backgroundColor: "#000000",
  });
  scoreText.setScrollFactor(0); // Screen par chipka rahega
}

// --- 4. UPDATE ---
function update() {
  if (cursors.left.isDown) {
    player.setVelocityX(-140);
    player.anims.play("run", true);
    player.flipX = true;
  } else if (cursors.right.isDown) {
    player.setVelocityX(140);
    player.anims.play("run", true);
    player.flipX = false;
  } else {
    player.setVelocityX(0);
    player.anims.play("idle");
  }

  // 1. JUMP (Upar jane ke liye)
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-520); // Upar
  }

  // 2. FAST FALL (Tezi se neeche aane ke liye) --- NEW CODE ---
  // Condition: Agar DOWN dabaya hai AUR dog hawa mein hai (!player.body.touching.down)
  else if (cursors.down.isDown && !player.body.touching.down) {
    player.setVelocityY(500); // 600 ki speed se neeche girega
  }
}

// --- 5. HELPER FUNCTION ---
function collectStar(player, star) {
  star.disableBody(true, true);
  score += 10;
  scoreText.setText("Score: " + score);

  // Agar saare stars collect ho gaye
  if (stars.countActive(true) === 0) {
    // Saare stars wapas le aao
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    // --- NEW: EK NAYA BOMB BANAO ---
    // Player se door bomb spawn karo (x coordinate decide kar rahe hain)
    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    // Bomb create karo (Magic Graphics se 'bomb' texture banayenge niche)
    var bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1); // Poora bounce karega
    bomb.setCollideWorldBounds(true); // Screen se bahar nahi jayega
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20); // Random speed
  }
}

function hitBomb(player, bomb) {
  // Physics rok do
  this.physics.pause();

  // Player ko laal rang ka kar do (Chot lag gayi)
  player.setTint(0xff0000);

  // Idle animation chalao
  player.anims.play("idle");

  // Game Over text dikhao
  let gameOverText = this.add.text(300, 250, "GAME OVER", {
    fontSize: "48px",
    fill: "#ff0000",
    backgroundColor: "#000",
    padding: { x: 10, y: 10 },
  });
  gameOverText.setOrigin(0.5); // Text ko center align karne ke liye
  gameOverText.setScrollFactor(0); // Camera ke saath move na kare

  // 3. RESTART BUTTON Text
  let restartText = this.add.text(400, 320, "Press here to continue", {
    fontSize: "24px",
    fill: "#ffffff",
    backgroundColor: "#000000",
    padding: { x: 5, y: 5 },
  });
  restartText.setOrigin(0.5);
  restartText.setScrollFactor(0);

  // --- INTERACTIVE BUTTON LOGIC ---

  // Text ko clickable banao
  restartText.setInteractive({ useHandCursor: true }); // Isse mouse le jane par 'Hand' ban jayega

  // Jab button par click ho, tabhi restart karo
  restartText.on("pointerdown", () => {
    this.scene.restart();
  });
}
