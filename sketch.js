let player1, player2;
let sprite1Img, sprite2Img;
let bgImg;
let particles = [];
let bullets = [];
let health = 100;
let gameOver = false;
let winner = null;

function preload() {
  // 載入所有圖片
  sprite1Img = loadImage('all1-1.png');
  sprite2Img = loadImage('all2-1.png');
  bgImg = loadImage('0.png');
}

function setup() {
  // 直接設定為全螢幕
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  player1 = new Player(
    width/4, height/2,
    color(255, 0, 0),
    sprite1Img,
    65,    // A
    68,    // D
    87,    // W
    83     // S
  );
  player2 = new Player(
    3*width/4, height/2,
    color(0, 0, 255),
    sprite2Img,
    LEFT_ARROW,
    RIGHT_ARROW,
    UP_ARROW,
    DOWN_ARROW
  );
}

// 當視窗大小改變時調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (gameOver) {
    if (key === 'r' || key === 'R') {
      resetGame();
      return;
    }
  }
  
  // 只保留射擊控制
  if (keyCode === player1.shootKey) {
    player1.shoot();
  }
  if (keyCode === player2.shootKey) {
    player2.shoot();
  }
  if (key === ' ') {
    let bullet = new Bullet(player1.x, player1.y, player1.direction === 1 ? 'right' : 'left', 'player1');
    bullets.push(bullet);
  }
  if (key === '/') {
    let bullet = new Bullet(player2.x, player2.y, player2.direction === 1 ? 'right' : 'left', 'player2');
    bullets.push(bullet);
  }
}

function draw() {
  // 固定背景，縮放以填滿螢幕
  if (bgImg) {
    let bgRatio = bgImg.width / bgImg.height;
    let screenRatio = width / height;
   
    if (screenRatio > bgRatio) {
      // 如果螢幕比較寬，以寬度為基準
      image(bgImg, width/2, height/2, width, width/bgRatio);
    } else {
      // 如果螢幕比較高，以高度為基準
      image(bgImg, width/2, height/2, height*bgRatio, height);
    }
  }
 
  // 更新和顯示粒子
  updateParticles();
 
  // 更新和顯示玩家
  player1.update();
  player1.display();
  player2.update();
  player2.display();

  // 顯示兩個玩家的血條
  drawPlayerHealthBars();
  
  // 檢查遊戲是否結束
  checkGameOver();
  
  // 如果遊戲結束，顯示結束畫面
  if (gameOver) {
    displayGameOver();
    return;
  }
  
  // 更新和繪製子彈，並檢查碰撞
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].display();
    
    // ���查子彈是否擊中玩家
    if (checkBulletHit(bullets[i], player1)) {
      player1.takeDamage(10);
      bullets.splice(i, 1);
      continue;
    }
    if (checkBulletHit(bullets[i], player2)) {
      player2.takeDamage(10);
      bullets.splice(i, 1);
      continue;
    }
    
    // 移除超出畫面的子彈
    if (bullets[i].isOffscreen()) {
      bullets.splice(i, 1);
    }
  }
  
  // 在所有繪製之後添加操作說明
  displayControls();
}

function displayInstructions() {
  push();
  fill(255);
  textSize(max(12, windowWidth/80));
  textAlign(LEFT, BOTTOM);
  text('玩家1：WASD移動，F射擊\n玩家2：方向鍵移動，/射擊', 10, height - 10);
  pop();
}

class Player {
  constructor(x, y, color, spriteImg, leftKey, rightKey, upKey, downKey) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.spriteImg = spriteImg;
    this.speed = 5;
    this.direction = 1;
   
    // 移動按鍵
    this.leftKey = leftKey;
    this.rightKey = rightKey;
    this.upKey = upKey;
    this.downKey = downKey;
   
    if (spriteImg === sprite1Img) {
      this.frameWidth = 541/7;
      this.frameHeight = 81;
    } else {
      this.frameWidth = 481/6;
      this.frameHeight = 85;
    }
   
    // ���置顯示大小
    this.displayHeight = 120;
    this.displayWidth = (this.frameWidth/this.frameHeight) * this.displayHeight;
   
    // 動畫相關
    this.currentFrame = 0;
    this.frameCount = 3;
    this.animationSpeed = 100;
    this.lastFrameUpdate = 0;
    this.isMoving = false;
    this.health = 100;
    this.maxHealth = 100;
  }

  update() {
    // 移動邏輯
    if (keyIsDown(this.leftKey)) {
      this.x -= this.speed;
      this.direction = -1;
      this.isMoving = true;
    } else if (keyIsDown(this.rightKey)) {
      this.x += this.speed;
      this.direction = 1;
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    if (keyIsDown(this.upKey)) {
      this.y -= this.speed;
      this.isMoving = true;
    } else if (keyIsDown(this.downKey)) {
      this.y += this.speed;
      this.isMoving = true;
    }

    // 更新動畫
    let currentTime = millis();
    if (currentTime - this.lastFrameUpdate > this.animationSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.lastFrameUpdate = currentTime;
    }

    // 邊界檢查
    this.x = constrain(this.x, this.displayWidth/2, width - this.displayWidth/2);
    this.y = constrain(this.y, this.displayHeight/2, height - this.displayHeight/2);
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(this.direction, 1);

    if (this.spriteImg) {
      let sourceX = this.currentFrame * this.frameWidth;
      image(this.spriteImg,
            -this.displayWidth/2, -this.displayHeight/2,  
            this.displayWidth, this.displayHeight,        
            sourceX, 0,              
            this.frameWidth, this.frameHeight  
      );
    }
    pop();
  }

  takeDamage(damage) {
    this.health = max(0, this.health - damage);
  }
}

class Particle {
  constructor(x, y, color, isExplosion = false) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.alpha = 255;
    this.size = random(2, 6);
    this.speedX = isExplosion ? random(-3, 3) : random(-1, 1);
    this.speedY = isExplosion ? random(-3, 3) : random(-1, 1);
    this.life = 255;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 10;
    this.alpha = this.life;
  }

  display() {
    let c = color(this.color);
    c.setAlpha(this.alpha);
    fill(c);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

function updateParticles() {
  for(let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if(particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function setGradientBackground(c1, c2) {
  for(let y = 0; y < height; y++){
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawGrid() {
  stroke(255, 255, 255, 20);
  for(let i = 0; i < width; i += 30) {
    line(i, 0, i, height);
  }
  for(let i = 0; i < height; i += 30) {
    line(0, i, width, i);
  }
}

function displayHealthAndEnergy() {
  drawBar(10, 20, player1.health, 100, '#FF4444', 'HP');
  drawBar(10, 40, player1.energy, 100, '#44FF44', 'EP');
 
  drawBar(width - 210, 20, player2.health, 100, '#4444FF', 'HP');
  drawBar(width - 210, 40, player2.energy, 100, '#44FF44', 'EP');
}

function drawBar(x, y, value, max, color, label) {
  fill(0, 0, 0, 100);
  noStroke();
  rect(x, y, 200, 15);
 
  fill(color);
  rect(x, y, map(value, 0, max, 0, 200), 15);
 
  fill(255);
  textSize(12);
  text(`${label}: ${ceil(value)}`, x + 5, y + 12);
}

class Bullet {
  constructor(x, y, direction, shooter) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = 10;
    this.size = 10;
    this.shooter = shooter;
  }
  
  update() {
    // 根據方向移動子彈
    if (this.direction === 'right') {
      this.x += this.speed;
    } else if (this.direction === 'left') {
      this.x -= this.speed;
    }
  }
  
  display() {
    fill(255, 255, 0);
    ellipse(this.x, this.y, this.size);
  }
  
  isOffscreen() {
    return this.x < 0 || this.x > width;
  }
}

function drawPlayerHealthBars() {
  // 玩家1的血條（右上角）
  fill(0, 0, 0, 100);
  rect(width - 210, 10, 200, 20);
  fill(255, 0, 0);
  rect(width - 210, 10, map(player1.health, 0, player1.maxHealth, 0, 200), 20);
  fill(255);
  textAlign(RIGHT, CENTER);
  text(`P1 HP: ${ceil(player1.health)}`, width - 15, 20);
  
  // 玩家2的血條（左上角）
  fill(0, 0, 0, 100);
  rect(10, 10, 200, 20);
  fill(0, 0, 255);
  rect(10, 10, map(player2.health, 0, player2.maxHealth, 0, 200), 20);
  fill(255);
  textAlign(LEFT, CENTER);
  text(`P2 HP: ${ceil(player2.health)}`, 15, 20);
}

function checkBulletHit(bullet, player) {
  let distance = dist(bullet.x, bullet.y, player.x, player.y);
  return distance < player.displayHeight / 3;
}

function checkGameOver() {
  if (player1.health <= 0) {
    gameOver = true;
    winner = 'Player 2';
  } else if (player2.health <= 0) {
    gameOver = true;
    winner = 'Player 1';
  }
}

function displayGameOver() {
  // 半透明背景
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // 顯示獲勝者
  textSize(64);
  textAlign(CENTER, CENTER);
  fill(255);
  text(`${winner} 勝！`, width/2, height/2 - 50);
  
  // 顯示重啟提示
  textSize(32);
  text('按 R 鍵重新開始遊戲', width/2, height/2 + 50);
}

function resetGame() {
  // 重置玩家位置和血量
  player1 = new Player(
    width/4, height/2,
    color(255, 0, 0),
    sprite1Img,
    65,    // A
    68,    // D
    87,    // W
    83     // S
  );
  
  player2 = new Player(
    3*width/4, height/2,
    color(0, 0, 255),
    sprite2Img,
    LEFT_ARROW,
    RIGHT_ARROW,
    UP_ARROW,
    DOWN_ARROW
  );
  
  // 清空子彈
  bullets = [];
  
  // 重置遊戲狀態
  gameOver = false;
  winner = null;
}

// 添加新的操作說明顯示函數
function displayControls() {
  push();
  textSize(20);
  
  // 玩家1操作說明（左下角）
  // 先畫半透明白色背景
  fill(255, 255, 255, 200);
  noStroke();
  rectMode(CORNER);
  rect(10, height - 140, 200, 130);
  
  // 黑色文字
  fill(0);
  textAlign(LEFT, BOTTOM);
  text('玩家1控制：\n' +
       'W：向上移動\n' +
       'S：向下移動\n' +
       'A：向左移動\n' +
       'D：向右移動\n' +
       '空格鍵：發射子彈', 
       20, height - 20);
  
  // 玩家2操作說明（右下角）
  // 先畫半透明白色背景
  fill(255, 255, 255, 200);
  rect(width - 210, height - 140, 200, 130);
  
  // 黑色文字
  fill(0);
  textAlign(RIGHT, BOTTOM);
  text('玩家2控制：\n' +
       '↑：向上移動\n' +
       '↓：向下移動\n' +
       '←：向左移動\n' +
       '→：向右移動\n' +
       '/：發射子彈', 
       width - 20, height - 20);
  pop();
}