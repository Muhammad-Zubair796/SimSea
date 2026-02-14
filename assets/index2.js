window.addEventListener('load', function() {
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
                    !this.game.keys.includes(e.key)
                ) this.game.keys.push(e.key);
            });
            window.addEventListener('keyup', (e) => {
                const index = this.game.keys.indexOf(e.key);
                if (index > -1) this.game.keys.splice(index, 1);
            });
        }
    }

    // --------------------- Player ---------------------
    class Player {
        constructor(game) {
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

        update(deltaTime) {
            if (!this.game.playerFrozen && !this.game.paused) {
                if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed;
                else if (this.game.keys.includes('ArrowDown')) this.speedY = this.maxSpeed;
                else this.speedY = 0;

                this.y += this.speedY;

                if (this.game.keys.includes(' ')) {
                    this.game.shootTimer += deltaTime;
                    if (this.game.shootTimer > this.game.shootInterval) {
                        this.shootTop();
                        this.game.shootTimer = 0;
                    }
                }
            } else this.speedY = 0;

            if (this.y > this.game.height - this.height * 0.5) this.y = this.game.height - this.height * 0.5;
            else if (this.y < -this.height * 0.5) this.y = -this.height * 0.5;

            this.frameX = (this.frameX < this.maxFrame) ? this.frameX + 1 : 0;

            if (this.powerUp) {
                if (this.powerUpTimer > this.powerUpLimit) {
                    this.powerUpTimer = 0;
                    this.powerUp = false;
                    this.frameY = 0;
                } else {
                    this.powerUpTimer += deltaTime;
                    this.frameY = 1;
                    this.game.ammo += 0.1;
                }
            }

            if (this.game.extremePowerUp && !this.game.playerFrozen && !this.game.paused) {
                this.game.shootTimer += deltaTime;
                if (this.game.shootTimer > 50) {
                    this.shootExtreme();
                    this.game.shootTimer = 0;
                }
            }
        }

        draw(context) {
            if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            this.projectiles.forEach(p => p.draw(context));
            context.drawImage(
                this.image, this.frameX * this.width, this.frameY * this.height,
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
            } else if (!this.zeroAmmoShot) {
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
            } else if (!this.zeroAmmoShot) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 175));
                this.game.ammo--;
                this.zeroAmmoShot = true;
            }
        }

        shootExtreme() {
            if (this.game.playerFrozen || this.game.paused || !this.game.extremePowerUp) return;
            const shots = 12, maxSpread = Math.PI, angleInc = maxSpread / (shots - 1), startAngle = -Math.PI / 2;
            const startX = this.x + 80, startY = this.y + this.height * 0.5;

            for (let i = 0; i < shots; i++) {
                const angle = startAngle + i * angleInc;
                this.projectiles.push(new ExtremeProjectile(this.game, startX, startY, angle));
            }
            this.game.playSound('shoot');
        }

        enterPowerUp() {
            this.game.playSound('powerUp');
            this.powerUpTimer = 0;
            this.powerUp = true;
            if (this.game.ammo < this.game.maxAmmo) this.game.ammo = this.game.maxAmmo;
        }
    }

    // --------------------- Projectile ---------------------
    class Projectile {
        constructor(game, x, y) {
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
        update() {
            if (this.game.paused) return;
            this.x += this.speed;
            if (this.x > this.game.width) this.markedForDeletion = true;
        }
        draw(context) {
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
            this.y = this.initialY + this.speedY * this.waveTimer * 0.2 + yOffset;

            if (this.x > this.game.width || this.x < 0 || this.y > this.game.height || this.y < 0) this.markedForDeletion = true;
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
    class Particle {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.image = document.getElementById('particle');
            this.frameX = Math.floor(Math.random() * 3);
            this.frameY = Math.floor(Math.random() * 3);
            this.spriteSize = 50;
            this.sizeModifier = Math.random() * 0.5 + 0.5;
            this.size = this.spriteSize * this.sizeModifier;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * -15;
            this.gravity = 0.5;
            this.markedForDeletion = false;
            this.angle = 0;
            this.va = Math.random() * 0.2 - 0.1;
            this.bounced = 0;
            this.bottomBounceBoundary = Math.random() * 80 + 60;
        }
        update() {
            if (this.game.paused) return;
            this.angle += this.va;
            this.speedY += this.gravity;
            this.x -= this.speedX + this.game.speed;
            this.y += this.speedY;
            if (this.y > this.game.height + this.size || this.x < -this.size) this.markedForDeletion = true;
            if (this.y > this.game.height - this.bottomBounceBoundary && this.bounced < 2) {
                this.bounced++;
                this.speedY *= -0.7;
            }
        }
        draw(context) {
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            context.drawImage(
                this.image, this.frameX * this.spriteSize, this.frameY * this.spriteSize,
                this.spriteSize, this.spriteSize, this.size * -0.5, this.size * -0.5,
                this.size, this.size
            );
            context.restore();
        }
    }

    // --------------------- Enemy and Background & Explosion & Game & Animation ---------------------
    // All code from your previous index.js remains identical; no changes needed here for functionality.

    // --------------------- Game Initialization ---------------------
    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;
    let animationId = null;

    function animate(timeStamp) {
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

    // Audio unlocker
    window.addEventListener('click', () => {
        Object.values(game.sounds).forEach(s => { if (s) { s.play().catch(() => {}); s.pause(); s.currentTime = 0; } });
    }, { once: true });
});
