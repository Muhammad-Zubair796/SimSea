window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 500;

    // Static dark ocean background before game starts
    ctx.fillStyle = '#00072D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --------------------- InputHandler ---------------------
    class InputHandler {
        constructor(game) {
            this.game = game;
            window.addEventListener('keydown', (e) => {
                if (!this.game.playerFrozen && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') &&
                    this.game.keys.indexOf(e.key) === -1
                ) {
                    this.game.keys.push(e.key);
                }
            });

            window.addEventListener('keyup', (e) => {
                if (this.game.keys.indexOf(e.key) > -1) {
                    this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
                }
            });
        }
    }

    // --------------------- Player ---------------------
    class Player{
        constructor(game){
            this.game = game;
            this.width = 120;
            this.height = 190;
            this.x = 20;
            this.y = 100;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 37;
            this.speedY = 0;
            this.maxSpeed = 2;
            this.projectiles = [];
            this.image = document.getElementById('player');
            this.powerUp = false;
            this.powerUpTimer = 0;
            this.powerUpLimit = 10000;
            this.zeroAmmoShot = false;
        }
        update(deltaTime){
            if(!this.game.playerFrozen && !this.game.paused){
                if(this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed;
                else if(this.game.keys.includes('ArrowDown')) this.speedY = this.maxSpeed;
                else this.speedY = 0;
                this.y += this.speedY;

                if(this.game.keys.includes(' ')){
                    this.game.shootTimer += deltaTime;
                    if(this.game.shootTimer > this.game.shootInterval){
                        this.shootTop();
                        this.game.shootTimer = 0;
                    }
                }
            } else {
                this.speedY = 0;
            }

            if(this.y > this.game.height - this.height*0.5) this.y = this.game.height - this.height*0.5;
            else if(this.y < -this.height*0.5) this.y = -this.height*0.5;

            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;

            if (this.powerUp){
                if(this.powerUpTimer > this.powerUpLimit){
                    this.powerUpTimer = 0;
                    this.powerUp = false;
                    this.frameY = 0;
                } else{
                    this.powerUpTimer += deltaTime;
                    this.frameY = 1;
                    this.game.ammo += 0.1;
                }
            }

            if(this.game.extremePowerUp && !this.game.playerFrozen && !this.game.paused){
                this.game.shootTimer += deltaTime;
                if(this.game.shootTimer > 50){
                    this.shootExtreme();
                    this.game.shootTimer = 0;
                }
            }
        }
        draw(context){
            if(this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            this.projectiles.forEach(projectile => projectile.draw(context));
            context.drawImage(
                this.image, this.frameX*this.width, this.frameY*this.height,
                this.width, this.height, this.x, this.y, this.width, this.height
            );
        }

        shootTop() {
            if (this.game.playerFrozen || this.game.paused) return;
            this.game.playSound('shoot');
            if (this.game.ammo > 0) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 30));
                this.game.ammo--;
                this.zeroAmmoShot = false;
            } else if (this.game.ammo <= 0 && !this.zeroAmmoShot) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 30));
                this.game.ammo--;
                this.zeroAmmoShot = true;
            }
            if (this.powerUp) this.shootBottom();
        }

        shootBottom() {
            if (this.game.playerFrozen || this.game.paused) return;
            if (this.game.ammo > 0) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 175));
                this.game.ammo--;
                this.zeroAmmoShot = false;
            } else if (this.game.ammo <= 0 && !this.zeroAmmoShot) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 175));
                this.game.ammo--;
                this.zeroAmmoShot = true;
            }
        }

        shootExtreme() {
            if (this.game.playerFrozen || this.game.paused || !this.game.extremePowerUp) return;
            const numberOfShots = 12;
            const maxSpread = Math.PI;
            const angleIncrement = maxSpread / (numberOfShots - 1);
            const startAngle = -Math.PI * 0.5;
            const startX = this.x + 80;
            const startYCenter = this.y + this.height * 0.5;

            for (let i = 0; i < numberOfShots; i++) {
                const angle = startAngle + i * angleIncrement;
                this.projectiles.push(new ExtremeProjectile(this.game, startX, startYCenter, angle));
            }
            this.game.playSound('shoot');
        }

        enterPowerUp(){
            this.game.playSound('powerUp');
            this.powerUpTimer = 0;
            this.powerUp = true;
            if(this.game.ammo < this.game.maxAmmo){
                this.game.ammo = this.game.maxAmmo;
            }
        }
    }

    // --------------------- Projectile ---------------------
    class Projectile{
        constructor(game,x,y){
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 10;
            this.height = 3;
            this.speed = 10;
            this.markedForDeletion = false;
            this.image = document.getElementById('projectile');
            this.damage = 1;
        }
        update(){
            if (this.game.paused) return;
            this.x += this.speed;
            if (this.x > this.game.width) this.markedForDeletion = true;
        }
        draw(context){
            if (this.game.debug) {
                 context.fillStyle = 'red';
                 context.fillRect(this.x, this.y, this.width, this.height);
            }
            context.drawImage(this.image, this.x, this.y);
        }
    }

    class ExtremeProjectile extends Projectile {
        constructor(game, x, y, angleOffset) {
            super(game, x, y);
            this.image = document.getElementById('projectile');
            this.baseSpeed = 10;
            this.speedX = this.baseSpeed * Math.cos(angleOffset);
            this.speedY = this.baseSpeed * Math.sin(angleOffset);
            this.waveTimer = 0;
            this.waveAmplitude = 20;
            this.waveFrequency = 0.05;
            this.initialY = y;
            this.damage = 2;
            this.width = 10;
            this.height = 3;
        }

        update() {
            if (this.game.paused) return;
            this.waveTimer++;
            const yOffset = this.waveAmplitude * Math.sin(this.waveTimer * this.waveFrequency);
            this.x += this.speedX - this.game.speed;
            this.y = this.initialY + (this.speedY * this.waveTimer * 0.2) + yOffset;

            if (this.x > this.game.width || this.x < 0 || this.y > this.game.height || this.y < 0) {
                this.markedForDeletion = true;
            }
        }

        draw(context) {
            if (this.game.debug) {
                 context.fillStyle = 'red';
                 context.fillRect(this.x, this.y, this.width, this.height);
            }
            context.drawImage(this.image, this.x, this.y);
        }
    }

    // --------------------- Particle ---------------------
    class Particle{
        constructor(game,x,y){
            this.game = game;
            this.x = x;
            this.y = y;
            this.image = document.getElementById('particle');
            this.frameX = Math.floor(Math.random()*3);
            this.frameY = Math.floor(Math.random()*3);
            this.spriteSize = 50;
            this.sizeModifier = (Math.random()*0.5 + 0.5).toFixed(1);
            this.size = this.spriteSize * this.sizeModifier;
            this.speedX = Math.random()*6 - 3;
            this.speedY = Math.random()*-15;
            this.gravity = 0.5;
            this.markedForDeletion = false;
            this.angle = 0;
            this.va = Math.random()*0.2 - 0.1;
            this.bounced = 0;
            this.bottomBounceBoundary = Math.random()*80 + 60;
        }
        update(){
            if (this.game.paused) return;
            this.angle += this.va;
            this.speedY += this.gravity;
            this.x -= this.speedX + this.game.speed;
            this.y += this.speedY;
            if(this.y > this.game.height + this.size || this.x < 0 - this.size) this.markedForDeletion = true;
            if(this.y > this.game.height - this.bottomBounceBoundary && this.bounced < 2){
                this.bounced++;
                this.speedY *= -0.7;
            }
        }
        draw(context){
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            context.drawImage(
                this.image, this.frameX*this.spriteSize, this.frameY*this.spriteSize,
                this.spriteSize, this.spriteSize, this.size*-0.5, this.size*-0.5,
                this.size, this.size
            );
            context.restore();
        }
    }

    // --------------------- Enemy Base ---------------------
    class Enemy{
        constructor(game){
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random()*-1 - 0.5;
            this.markedForDeletion = false;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 37;
        }
        update(){
            if (this.game.paused) return;
            this.x += this.speedX - this.game.speed;
            if(this.x + this.width < 0) this.markedForDeletion = true;
            if(this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;
        }
        draw(context){
            if(this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            context.drawImage(
                this.image, this.frameX*this.width, this.frameY*this.height,
                this.width, this.height, this.x, this.y, this.width, this.height
            );
            if(this.game.debug){
                context.font = '20px Helvetica';
                context.fillText(this.lives, this.x, this.y);
            }
        }
    }

    class Angler1 extends Enemy{
        constructor(game){
            super(game);
            this.width = 228;
            this.height = 169;
            this.y = Math.random()*(this.game.height*0.95 - this.height);
            this.image = document.getElementById('angler1');
            this.frameY = Math.floor(Math.random()*3);
            this.lives = 3;
            this.score = this.lives;
            this.type = 'angler1';
        }
    }

    class Angler2 extends Enemy{
        constructor(game){
            super(game);
            this.width = 213;
            this.height = 165;
            this.y = Math.random()*(this.game.height*0.95 - this.height);
            this.image = document.getElementById('angler2');
            this.frameY = Math.floor(Math.random()*2);
            this.lives = 4;
            this.score = this.lives;
            this.type = 'angler2';
        }
    }

    class LuckyFish extends Enemy{
        constructor(game){
            super(game);
            this.width = 99;
            this.height = 95;
            this.y = Math.random()*(this.game.height*0.95 - this.height);
            this.image = document.getElementById('lucky');
            this.frameY = Math.floor(Math.random()*2);
            this.lives = 2;
            this.score = 10;
            this.type = 'lucky';
        }
    }

    class HiveWhale extends Enemy{
        constructor(game){
            super(game);
            this.width = 400;
            this.height = 227;
            this.y = Math.random()*(this.game.height*0.95 - this.height);
            this.image = document.getElementById('hiveWhale');
            this.frameY = 0;
            this.lives = 15;
            this.score = this.lives;
            this.type = 'hive';
            this.speedX = Math.random()*-0.8 - 0.2;
        }
    }

    class Drone extends Enemy{
        constructor(game,x,y){
            super(game);
            this.width = 115;
            this.height = 95;
            this.y = y;
            this.x = x;
            this.image = document.getElementById('drone');
            this.frameY = Math.floor(Math.random()*2);
            this.lives = 3;
            this.score = this.lives;
            this.type = 'drone';
            this.speedX = Math.random()*-3 - 2;
        }
    }

    class SuicideBomber extends Enemy {
        constructor(game) {
            super(game);
            this.width = 115;
            this.height = 95;
            this.x = this.game.width + this.width;
            this.y = Math.random() * (this.game.height - this.height);
            this.image = document.getElementById('drone');
            this.frameY = 1;
            this.lives = 30;
            this.score = 5;
            this.type = 'bomber';
            this.speedX = -30;
        }
        update() {
            if (this.game.paused) return;
            this.x += this.speedX - this.game.speed;
            if(this.x + this.width < 0) this.markedForDeletion = true;
            if(this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;
        }
    }

    // --------------------- Background ---------------------
    class Layer{
        constructor(game,image,speedModifier){
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = 1768;
            this.height = 500;
            this.x = 0;
            this.y = 0;
        }
        update(){
            if(this.x <= -this.width) this.x = 0;
            this.x -= this.game.speed * this.speedModifier;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y);
            context.drawImage(this.image, this.x + this.width-1, this.y);
        }
    }

    class BackGround{
        constructor(game){
            this.game = game;
            this.image1 = document.getElementById('layer1');
            this.layer1 = new Layer(this.game, this.image1, 0.2);
            this.image2 = document.getElementById('layer2');
            this.layer2 = new Layer(this.game, this.image2, 0.4);
            this.image3 = document.getElementById('layer3');
            this.layer3 = new Layer(this.game, this.image3, 1);
            this.image4 = document.getElementById('layer4');
            this.layer4 = new Layer(this.game, this.image4, 1.5);
            this.layers = [this.layer1, this.layer2, this.layer3];
        }
        update(){
            this.layers.forEach(layer => layer.update());
            this.layer4.update();
        }
        draw(context){
            this.layers.forEach(layer => layer.draw(context));
            this.layer4.draw(context);
        }
    }

    // --------------------- Explosions ---------------------
    class Explosion{
        constructor(game,x,y){
            this.game = game;
            this.frameX = 0;
            this.fps = 30;
            this.spriteHeight = 200;
            this.timer = 0;
            this.interval = 1000/this.fps;
            this.markedForDeletion = false;
            this.maxFrame = 8;
        }
        update(deltaTime){
            if (this.game.paused) return;
            this.x -= this.game.speed;
            if(this.timer > this.interval){
                this.frameX++;
                this.timer = 0;
            }else {
                this.timer += deltaTime;
            }
            if(this.frameX > this.maxFrame) this.markedForDeletion = true;
        }
        draw(context){
            context.drawImage(
                this.image, this.frameX*this.spriteWidth, 0,
                this.spriteWidth, this.spriteHeight, this.x, this.y,
                this.width, this.height
            );
        }
    }

    class SmokeExplosion extends Explosion{
        constructor(game,x,y){
            super(game,x,y);
            this.image = document.getElementById('smoke');
            this.spriteWidth = 200;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.x = x - this.width*0.5;
            this.y = y - this.height*0.5;
        }
    }

    class FireExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = document.getElementById('fire');
            this.spriteWidth = 200;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.x = x - this.width * 0.5;
            this.y = y - this.height * 0.5;
        }
    }

    // --------------------- UI ---------------------
    class UI{
        constructor(game){
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Bangers';
            this.color = 'white';
            this.displayHealth = null;
            this.lastHealth = null;
            this.healthFlashTimer = 0;
            this.ammoFlashTimer = 0;
        }

        draw(context){
            context.save();
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.shadowColor = 'black';
            context.font = this.fontSize + 'px ' + this.fontFamily;

            context.fillText('Score: ' + this.game.score, 20, 40);
            context.fillText('Highest Score: ' + this.game.highScore, 20, 70);

            if (!this.game.playerFrozen) {
                if (this.game.ammo <= 0) this.ammoFlashTimer = 15;

                context.fillStyle =
                    this.ammoFlashTimer > 0
                        ? 'red'
                        : (this.game.player.powerUp ? '#ffffbd' : 'white');

                if (this.ammoFlashTimer > 0) this.ammoFlashTimer--;

                const ammoY = 80;

                for (let i = 0; i < this.game.ammo; i++) {
                    context.fillRect(20 + i * 5, ammoY, 3, 20);
                }
            }

            if (this.game.difficulty === 'difficult' && this.game.gameStarted) {
                const rawHealth = Math.max(0, Math.min(100, this.game.playerHealth));

                if (this.displayHealth === null) {
                    this.displayHealth = rawHealth;
                    this.lastHealth = rawHealth;
                }

                if (rawHealth < this.lastHealth) this.healthFlashTimer = 10;
                this.lastHealth = rawHealth;

                this.displayHealth += (rawHealth - this.displayHealth) * 0.15;
                this.displayHealth = Math.max(0, Math.min(100, this.displayHealth));

                const barWidth = 150;
                const barHeight = 18;
                const radius = 8;

                const healthX = this.game.width - barWidth - 20;
                const healthY = 60;

                context.fillStyle = '#2b2b2b';
                this.roundRect(context, healthX, healthY, barWidth, barHeight, radius);
                context.fill();

                const gradient = context.createLinearGradient(
                    healthX, 0, healthX + barWidth, 0
                );

                if (this.displayHealth <= 30) {
                    gradient.addColorStop(0, '#ff4d4d');
                    gradient.addColorStop(1, '#b30000');
                } else {
                    gradient.addColorStop(0, '#00ff9c');
                    gradient.addColorStop(1, '#00b36b');
                }

                context.fillStyle = this.healthFlashTimer > 0 ? 'red' : gradient;
                if (this.healthFlashTimer > 0) this.healthFlashTimer--;

                const healthWidth = (this.displayHealth / 100) * barWidth;
                this.roundRect(context, healthX, healthY, healthWidth, barHeight, radius);
                context.fill();

                context.save();
                context.shadowColor = 'transparent';
                context.fillStyle = 'white';
                context.font = '16px ' + this.fontFamily;
                context.textAlign = 'right';
                context.fillText(
                    'HEALTH ' + Math.round(rawHealth) + '%',
                    healthX + barWidth - 6,
                    healthY - 4
                );
                context.restore();

                context.font = this.fontSize + 'px ' + this.fontFamily;
            }

            if (this.game.extremePowerUp) {
                context.fillStyle = 'red';
                const ammoY = 80;
                const gap = 25;
                context.fillText('EXTREME', 20, ammoY + 20 + gap);
            }

            context.fillStyle = 'white';
            context.textAlign = 'right';

            if (this.game.difficulty === 'normal') {
                context.fillText('Time: ' + (this.game.levelTime * 0.001).toFixed(1), this.game.width - 20, 40);
                context.fillText('Level: ' + this.game.level, this.game.width - 20, 80);
                context.fillText('Level Score: ' + this.game.levelScore, this.game.width - 20, 120);
            }

            context.textAlign = 'center';
            context.font = '40px ' + this.fontFamily;
            context.fillStyle = this.game.difficulty === 'difficult' ? 'red' : 'yellow';
            context.fillText(this.game.difficulty.toUpperCase(), this.game.width * 0.5, 40);
            context.fillStyle = 'white';

            if (this.game.showLevelMessage && !this.game.gameOver) {
                context.font = '50px ' + this.fontFamily;
                context.fillText(this.game.levelMessage, this.game.width * 0.5, this.game.height * 0.5);
            }

            if (this.game.gameOver) {
                context.textAlign = 'center';
                context.font = '70px ' + this.fontFamily;

                const msg1 = this.game.isPlayerDead ? 'You Died!' : (this.game.isLevelFailed ? 'Level Failed!' : 'Game Ended');
                const msg2 = this.game.isPlayerDead || this.game.isLevelFailed ? 'Try Again' : 'Congratulations';

                context.fillText(msg1, this.game.width * 0.5, this.game.height * 0.5 - 20);
                context.font = '40px ' + this.fontFamily;
                context.fillText(msg2, this.game.width * 0.5, this.game.height * 0.5 + 40);
            }

            context.restore();
        }

        roundRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }
    }

    // --------------------- Game ---------------------
    class Game{
        constructor(width,height){
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.ui = new UI(this);
            this.background = new BackGround(this);
            this.keys = [];
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.ammoInterval = 350;
            this.shootTimer = 0;
            this.shootInterval = 100;
            this.enemyTimer = 0;
            this.enemyInterval = 1500;
            this.gameOver = false;
            this.playerFrozen = false;
            this.paused = false;

            this.highScore = localStorage.getItem('extremeFishesHighScore1');
            this.highScore = this.highScore ? parseInt(this.highScore) : 0;
            this.score = 0;
            this.levelScore = 0;
            this.level = 1;
            this.maxLevel = 50;
            this.gameTime = 0;
            this.levelTime = 0;
            this.timeLimit = 30000;
            this.speed = 1;
            this.debug = false;
            this.showLevelMessage = false;
            this.levelMessage = '';
            this.soundOn = true;
            this.playFailedSoundOnReset = false;

            this.gameStarted = false;
            this.difficulty = 'normal';
            this.playerHealth = 100;
            this.bomberTimer = 0;
            this.SUICIDE_BOMBER_INTERVAL = 15000;

            this.NORMAL_PASS_SCORE = 80;
            this.NORMAL_LUCKY_FISHES = 3;
            this.DIFFICULT_START_SPEED = 2;
            this.DIFFICULT_START_INTERVAL = 1160;
            this.DIFFICULT_LUCKY_FISHES = 4;

            this.isLevelFailed = false;
            this.isPlayerDead = false;

            this.luckyFishCollisions = 0;
            this.extremePowerUp = false;
            this.extremePowerUpTimer = 0;
            this.extremePowerUpLimit = 5000;

            this.sounds = {
                shoot: document.getElementById('shoot'),
                powerUp: document.getElementById('powerUp'),
                levelUp: document.getElementById('levelUp'),
                collectpoints: document.getElementById('collectpoints'),
                playerexplosion: document.getElementById('playerexplosion'),
                droneattack: document.getElementById('droneattack'),
                levelfailed: document.getElementById('levelfailed'),
                extremepower: document.getElementById('extremepower'),
                whalesound: document.getElementById('whalesound')
            };
        }

        playSound(sound) {
            if(!this.soundOn) return;
            const s = this.sounds[sound];
            if (!s) return;
            setTimeout(() => {
                s.currentTime = 0;
                s.play().catch(() => {});
            }, 0);
        }

        togglePause() {
            if (!this.gameStarted) return;
            this.paused = !this.paused;
            const icon = document.getElementById('pausePlayIcon');
            if (icon) {
                icon.src = this.paused ? 'pngwing.com (39).png' : 'pngwing.com (38).png';
            }
        }

        setDifficultyNormal() {
            if(this.gameStarted) return;
            this.difficulty = 'normal';
            this.luckyFishCollisions = 0;
            this.gameStarted = true;
            this.level = 1;
            this.nextLevel(true);
            startGameAnimation();
        }

        setDifficultyDifficult() {
            if(this.gameStarted) return;
            this.difficulty = 'difficult';
            this.playerHealth = 100;
            this.luckyFishCollisions = 0;
            this.gameStarted = true;
            this.level = 10;
            this.nextLevel(true);
            startGameAnimation();
        }

        enterExtremePowerUp(){
            if (this.extremePowerUp) {
                this.extremePowerUpTimer = 0;
            } else {
                this.extremePowerUp = true;
                this.extremePowerUpTimer = 0;
                this.levelMessage = 'EXTREME POWER-UP!';
                this.showLevelMessage = true;
                this.playSound('extremepower');
                setTimeout(() => { this.showLevelMessage = false; }, 2000);
            }
        }

        handleGameOver(win = false) {
            this.gameOver = true;
            if (win) {
                this.isPlayerDead = false;
                this.isLevelFailed = false;
                this.playerFrozen = true;
            }
            else if (this.difficulty === 'difficult' && this.playerHealth <= 0) {
                this.isPlayerDead = true;
                this.isLevelFailed = false;
                this.playerFrozen = true;
                this.playSound('playerexplosion');
            }
            else if (this.difficulty === 'normal' && this.levelTime >= this.timeLimit && this.levelScore < this.NORMAL_PASS_SCORE) {
                this.isLevelFailed = true;
                this.isPlayerDead = false;
                this.playFailedSoundOnReset = true;
                this.playerFrozen = true;
            }

            const btnRestart = document.getElementById('btnRestart');
            if(btnRestart) btnRestart.style.display = 'inline-block';
        }

        fullReset() {
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }

            this.player = new Player(this);
            this.keys = [];
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.ammo = this.maxAmmo;
            this.ammoTimer = 0;
            this.shootTimer = 0;
            this.enemyTimer = 0;
            this.gameOver = false;
            this.playerFrozen = false;
            this.paused = false;
            this.score = 0;
            this.levelScore = 0;
            this.level = 1;
            this.gameTime = 0;
            this.levelTime = 0;
            this.showLevelMessage = false;
            this.levelMessage = '';
            this.isLevelFailed = false;
            this.isPlayerDead = false;
            this.playFailedSoundOnReset = false;
            this.extremePowerUp = false;
            this.luckyFishCollisions = 0;
            this.playerHealth = 100;
            this.bomberTimer = 0;
            this.gameStarted = false;
            this.difficulty = 'normal';

            const btnRestart = document.getElementById('btnRestart');
            if(btnRestart) btnRestart.style.display = 'none';

            const difficultyContainer = document.getElementById('difficulty-selection');
            if (difficultyContainer) difficultyContainer.style.display = 'block';

            const btnNormal = document.getElementById('btnNormal');
            const btnDifficult = document.getElementById('btnDifficult');
            if (btnNormal) btnNormal.classList.remove('active-difficulty');
            if (btnDifficult) btnDifficult.classList.remove('active-difficulty');

            const icon = document.getElementById('pausePlayIcon');
            if (icon) icon.src = 'pngwing.com (38).png';

            ctx.fillStyle = '#00072D';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        update(deltaTime){
            if(!this.gameStarted) return;

            if(this.difficulty === 'difficult' && this.playerHealth <= 0 && !this.gameOver) {
                this.handleGameOver();
            }

            // WINNING CONDITION CHANGED TO 35000 FOR BOTH MODES
            if (this.score >= 35000 && !this.gameOver){
                this.handleGameOver(true);
            }

            if (this.paused) {
                this.background.update();
                this.background.layer4.update();
                return;
            }

            this.ammoTimer += deltaTime;
            if (this.ammoTimer > this.ammoInterval && !this.playerFrozen) {
                if (this.ammo < this.maxAmmo) this.ammo++;
                this.ammoTimer = 0;
            }

            if (this.extremePowerUp) {
                this.extremePowerUpTimer += deltaTime;
                if (this.extremePowerUpTimer > this.extremePowerUpLimit) {
                    this.extremePowerUpTimer = 0;
                    this.extremePowerUp = false;
                }
            }

            this.gameTime += deltaTime;
            let activeCollisions = !this.playerFrozen;

            if (this.difficulty === 'normal' && !this.isLevelFailed) {
                this.levelTime += deltaTime;
            }

            if (this.difficulty === 'difficult' && !this.isPlayerDead) {
                if (this.gameTime >= this.bomberTimer + this.SUICIDE_BOMBER_INTERVAL) {
                    this.enemies.push(new SuicideBomber(this));
                    this.bomberTimer = this.gameTime;
                    this.playSound('droneattack');
                }
            }

            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('extremeFishesHighScore1', this.highScore);
            }

            if(this.difficulty === 'normal' && this.levelTime >= this.timeLimit && !this.gameOver){
                if(this.levelScore >= this.NORMAL_PASS_SCORE){
                    this.playSound('levelUp');
                    this.nextLevel();
                } else {
                    this.levelMessage = `Level ${this.level} Failed!`;
                    this.showLevelMessage = true;
                    this.handleGameOver();
                }
            }

            this.background.update();
            this.particles.forEach(p => p.update());
            this.explosions.forEach(e => e.update(deltaTime));
            this.player.update(deltaTime);

            this.enemies.forEach(enemy => {
                enemy.update();

                if(activeCollisions && this.checkCollisions(this.player, enemy)){
                    enemy.markedForDeletion = true;
                    if(enemy.type !== 'lucky') this.playSound('playerexplosion');
                    this.addExplosions(enemy);
                    for(let i = 0; i < enemy.score; i++){
                        this.particles.push(new Particle(this, enemy.x + enemy.width*0.5, enemy.y + enemy.height*0.5));
                    }

                    if(enemy.type === 'lucky') {
                        this.player.enterPowerUp();
                        if (this.difficulty === 'difficult') {
                            this.playerHealth = Math.min(100, this.playerHealth + 3);
                        }
                        const req = this.difficulty === 'normal' ? this.NORMAL_LUCKY_FISHES : this.DIFFICULT_LUCKY_FISHES;
                        this.luckyFishCollisions++;
                        if (this.luckyFishCollisions >= req) {
                            this.luckyFishCollisions = 0;
                            this.enterExtremePowerUp();
                        }
                    }
                    else {
                        if (this.difficulty === 'difficult') {
                            this.playerHealth -= enemy.lives;
                        } else {
                            this.score -= enemy.lives;
                            this.levelScore -= enemy.lives;
                        }
                    }
                }

                this.player.projectiles.forEach(projectile => {
                    if(this.checkCollisions(projectile, enemy)){
                        enemy.lives -= (projectile.damage || 1);
                        projectile.markedForDeletion = true;
                        if(enemy.lives <= 0){
                            this.playSound('collectpoints');
                            if(enemy.type === 'hive'){
                                this.playSound('droneattack');
                                for(let i = 0; i < 5; i++){
                                    this.enemies.push(new Drone(this, enemy.x + Math.random()*enemy.width, enemy.y + Math.random()*enemy.height*0.5));
                                }
                            }
                            if (enemy.type === 'lucky' && this.difficulty === 'difficult') {
                                this.playerHealth = Math.min(100, this.playerHealth + 3);
                            }
                            for(let i = 0; i < enemy.score; i++){
                                this.particles.push(new Particle(this, enemy.x + enemy.width*0.5, enemy.y + enemy.height*0.5));
                            }
                            enemy.markedForDeletion = true;
                            this.addExplosions(enemy);
                            this.score += enemy.score;
                            this.levelScore += enemy.score;
                        }
                    }
                });
            });

            this.particles = this.particles.filter(p => !p.markedForDeletion);
            this.explosions = this.explosions.filter(e => !e.markedForDeletion);
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            if (this.enemyTimer > this.enemyInterval && !this.gameOver && !this.isLevelFailed){
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }

            this.player.projectiles.forEach(projectile => projectile.update());
            this.player.projectiles = this.player.projectiles.filter(projectile => !projectile.markedForDeletion);
        }

        draw(context){
            this.background.draw(context);
            this.ui.draw(context);
            this.player.draw(context);
            this.particles.forEach(particle => particle.draw(context));
            this.enemies.forEach(enemy => enemy.draw(context));
            this.explosions.forEach(explosion => explosion.draw(context));
        }

        addEnemy() {
            const randomize = Math.random();
            let enemy;
            if(randomize < 0.3) enemy = new Angler1(this);
            else if(randomize < 0.6) enemy = new Angler2(this);
            else if(randomize < 0.7) enemy = new HiveWhale(this);
            else enemy = new LuckyFish(this);

            if(Math.random() < 0.3){
                const extra = new Drone(this, this.width, Math.random()*(this.height-95));
                this.enemies.push(extra);
            }
            this.enemies.push(enemy);
        }

        addExplosions(enemy){
            const randomize = Math.random();
            const x = enemy.x + enemy.width*0.5;
            const y = enemy.y + enemy.height*0.5;
            if(randomize < 0.5) this.explosions.push(new SmokeExplosion(this, x, y));
            else this.explosions.push(new FireExplosion(this, x, y));
        }

        checkCollisions(rect1,rect2){
            return (
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.height + rect1.y > rect2.y
            );
        }

        nextLevel(initialSetup = false){
            if (!initialSetup) this.level++;
            if(this.level > this.maxLevel && this.difficulty === 'normal'){
                this.handleGameOver(true);
                this.showLevelMessage = false;
                return;
            }

            this.levelTime = 0;
            this.levelScore = 0;
            this.playerFrozen = this.isPlayerDead;
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.enemyTimer = 0;
            this.shootTimer = 0;
            this.extremePowerUp = false;
            this.luckyFishCollisions = 0;
            this.isLevelFailed = false;

            let scalingLevel = this.level;
            if (this.difficulty === 'normal') {
                if (scalingLevel > 5) scalingLevel = 5;
                this.speed = 1 + scalingLevel * 0.2;
                this.enemyInterval = 1500 * (0.95 ** scalingLevel);
                this.levelMessage = `Level ${this.level} Ready!`;
            } else if (this.difficulty === 'difficult') {
                if (initialSetup) {
                    this.speed = this.DIFFICULT_START_SPEED;
                    this.enemyInterval = this.DIFFICULT_START_INTERVAL;
                } else {
                    this.speed += 0.3;
                    this.enemyInterval *= 0.9;
                }
                this.levelMessage = `Level ${this.level} Ready!`;
            }

            if(!initialSetup) this.showLevelMessage = true;
            setTimeout(() => { this.showLevelMessage = false; }, 2000);
        }
    }

    // --------------------- Animation Control ---------------------
    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;
    let animationId = null;

    function animate(timeStamp){
        if (!game.gameStarted) return;

        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.draw(ctx);
        game.update(deltaTime);
        animationId = requestAnimationFrame(animate);
    }

    function startGameAnimation() {
        if (animationId === null) {
            lastTime = performance.now();
            animationId = requestAnimationFrame(animate);
        }
    }

    // --------------------- Audio Unlocker ---------------------
    window.addEventListener('click', () => {
        Object.values(game.sounds).forEach(s => {
            if (s) {
                s.play().catch(() => {});
                s.pause();
                s.currentTime = 0;
            }
        });
    }, { once: true });

    // --------------------- Buttons & UI Logic ---------------------
    const btnNormal = document.getElementById('btnNormal');
    const btnDifficult = document.getElementById('btnDifficult');
    const difficultyContainer = document.getElementById('difficulty-selection');

    function setActiveDifficulty(selectedBtn, otherBtn) {
        selectedBtn.classList.add('active-difficulty');
        otherBtn.classList.remove('active-difficulty');
        if (difficultyContainer) difficultyContainer.style.display = 'none';
    }

    if(btnNormal){
        btnNormal.addEventListener('click', () => {
            game.setDifficultyNormal();
            setActiveDifficulty(btnNormal, btnDifficult);
            btnNormal.blur();
        });
    }

    if(btnDifficult){
        btnDifficult.addEventListener('click', () => {
            game.setDifficultyDifficult();
            setActiveDifficulty(btnDifficult, btnNormal);
            btnDifficult.blur();
        });
    }

    const btnSound = document.getElementById('btnSound');
    const soundIcon = document.getElementById('soundIcon');

    if(btnSound){
        btnSound.addEventListener('click', () => {
            game.soundOn = !game.soundOn;
            soundIcon.src = game.soundOn ? 'volume.png' : 'mute.png';
            btnSound.blur();
        });
    }

    const btnRestart = document.getElementById('btnRestart');
    if(btnRestart){
        btnRestart.addEventListener('click', () => {
            if (game.playFailedSoundOnReset) game.playSound('levelfailed');
            game.fullReset();
            btnRestart.blur();
        });
    }

    const btnRestartIcon = document.getElementById('btnRestartIcon');
    if (btnRestartIcon) {
        btnRestartIcon.addEventListener('click', () => {
            if (game.playFailedSoundOnReset) game.playSound('levelfailed');
            game.fullReset();
            btnRestartIcon.blur();
        });
    }

    const btnPausePlay = document.getElementById('btnPausePlay');
    if (btnPausePlay) {
        btnPausePlay.addEventListener('click', () => {
            game.togglePause();
            btnPausePlay.blur();
        });
    }

    // Mobile touch controls
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnShoot = document.getElementById('btnShoot');

    function startKey(key) {
        if (!game.keys.includes(key)) game.keys.push(key);
    }

    function stopKey(key) {
        const index = game.keys.indexOf(key);
        if (index > -1) game.keys.splice(index, 1);
    }

    if(btnUp){
        btnUp.addEventListener('mousedown', () => startKey('ArrowUp'));
        btnUp.addEventListener('mouseup', () => stopKey('ArrowUp'));
        btnUp.addEventListener('mouseleave', () => stopKey('ArrowUp'));
        btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); startKey('ArrowUp'); });
        btnUp.addEventListener('touchend', (e) => { e.preventDefault(); stopKey('ArrowUp'); });
    }

    if(btnDown){
        btnDown.addEventListener('mousedown', () => startKey('ArrowDown'));
        btnDown.addEventListener('mouseup', () => stopKey('ArrowDown'));
        btnDown.addEventListener('mouseleave', () => stopKey('ArrowDown'));
        btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); startKey('ArrowDown'); });
        btnDown.addEventListener('touchend', (e) => { e.preventDefault(); stopKey('ArrowDown'); });
    }

    if(btnShoot){
        btnShoot.addEventListener('mousedown', () => startKey(' '));
        btnShoot.addEventListener('mouseup', () => stopKey(' '));
        btnShoot.addEventListener('mouseleave', () => stopKey(' '));
        btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); startKey(' '); });
        btnShoot.addEventListener('touchend', (e) => { e.preventDefault(); stopKey(' '); });
    }

    // --------------------- Start Screen Music ---------------------
    const startScreenSong = document.getElementById('startscreensong');
    if (startScreenSong) {
        startScreenSong.volume = 0.4; // Adjust volume as needed
    }

    function checkStartScreenMusic() {
        const difficultyMenu = document.getElementById('difficulty-selection');
        if (difficultyMenu && (difficultyMenu.style.display === '' || difficultyMenu.style.display === 'block')) {
            if (startScreenSong) {
                startScreenSong.play().catch(e => console.log('Auto-play blocked:', e));
            }
        } else {
            if (startScreenSong) {
                startScreenSong.pause();
            }
        }
    }

    // Initial check
    checkStartScreenMusic();

    // Hook into difficulty selection
    const originalSetDifficultyNormal = game.setDifficultyNormal;
    game.setDifficultyNormal = function() {
        originalSetDifficultyNormal.call(this);
        if (startScreenSong) startScreenSong.pause();
    };

    const originalSetDifficultyDifficult = game.setDifficultyDifficult;
    game.setDifficultyDifficult = function() {
        originalSetDifficultyDifficult.call(this);
        if (startScreenSong) startScreenSong.pause();
    };

    // Restart → back to menu → play music again
    const originalFullReset = game.fullReset;
    game.fullReset = function() {
        originalFullReset.call(this);
        setTimeout(checkStartScreenMusic, 150);
    };

    // Unlock audio on first user interaction (for mobile)
    document.body.addEventListener('touchstart', function unlock() {
        checkStartScreenMusic();
        document.body.removeEventListener('touchstart', unlock);
    }, { once: true });

    document.body.addEventListener('click', function unlock() {
        checkStartScreenMusic();
        document.body.removeEventListener('click', unlock);
    }, { once: true });

});