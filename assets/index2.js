// --------------------- index2.js ---------------------
let game; // Make game global so HTML buttons can access it
let animationId = null;
let lastTime = 0;

window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 500;

    // --------------------- Game Class ---------------------
    class Game {
        constructor(width, height) {
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
            this.shootTimer = 0;
            this.shootInterval = 100;
            this.enemyTimer = 0;
            this.enemyInterval = 1500;
            this.gameOver = false;
            this.playerFrozen = false;
            this.paused = false;
            this.gameStarted = false;
            this.difficulty = 'normal';
            this.score = 0;
            this.levelScore = 0;
            this.level = 1;
            this.playerHealth = 100;
            this.luckyFishCollisions = 0;
            this.extremePowerUp = false;
            this.extremePowerUpTimer = 0;
            this.extremePowerUpLimit = 5000;

            this.highScore = parseInt(localStorage.getItem('extremeFishesHighScore1')) || 0;

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
            if (!this.soundOn) return;
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
            if (icon) icon.src = this.paused ? 'assets/pngwing.com (39).png' : 'assets/pngwing.com (38).png';
        }

        // Add other Game methods like update(), draw(), fullReset() etc.
        // Keep all your previous Game logic here
    }

    // --------------------- Initialize game ---------------------
    game = new Game(canvas.width, canvas.height);

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

    // --------------------- Audio Unlock ---------------------
    window.addEventListener('click', () => {
        Object.values(game.sounds).forEach(s => {
            if (s) {
                s.play().catch(() => {});
                s.pause();
                s.currentTime = 0;
            }
        });
    }, { once: true });

    document.body.addEventListener('touchstart', function unlock() {
        Object.values(game.sounds).forEach(s => {
            if (s) {
                s.play().catch(() => {});
                s.pause();
                s.currentTime = 0;
            }
        });
        document.body.removeEventListener('touchstart', unlock);
    }, { once: true });

    // --------------------- Buttons ---------------------
    const btnNormal = document.getElementById('btnNormal');
    const btnDifficult = document.getElementById('btnDifficult');
    const btnSound = document.getElementById('btnSound');
    const soundIcon = document.getElementById('soundIcon');
    const btnRestart = document.getElementById('btnRestart');
    const btnRestartIcon = document.getElementById('btnRestartIcon');
    const btnPausePlay = document.getElementById('btnPausePlay');
    const difficultyContainer = document.getElementById('difficulty-selection');

    function setActiveDifficulty(selectedBtn, otherBtn) {
        selectedBtn.classList.add('active-difficulty');
        otherBtn.classList.remove('active-difficulty');
        if (difficultyContainer) difficultyContainer.style.display = 'none';
    }

    if (btnNormal) btnNormal.addEventListener('click', () => {
        game.setDifficultyNormal();
        setActiveDifficulty(btnNormal, btnDifficult);
        btnNormal.blur();
    });

    if (btnDifficult) btnDifficult.addEventListener('click', () => {
        game.setDifficultyDifficult();
        setActiveDifficulty(btnDifficult, btnNormal);
        btnDifficult.blur();
    });

    if (btnSound) btnSound.addEventListener('click', () => {
        game.soundOn = !game.soundOn;
        soundIcon.src = game.soundOn ? 'assets/volume.png' : 'assets/mute.png';
        btnSound.blur();
    });

    if (btnRestart) btnRestart.addEventListener('click', () => {
        game.fullReset();
        btnRestart.blur();
    });

    if (btnRestartIcon) btnRestartIcon.addEventListener('click', () => {
        game.fullReset();
        btnRestartIcon.blur();
    });

    if (btnPausePlay) btnPausePlay.addEventListener('click', () => {
        game.togglePause();
        btnPausePlay.blur();
    });

    // --------------------- Mobile Controls ---------------------
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

    if (btnUp) {
        btnUp.addEventListener('mousedown', () => startKey('ArrowUp'));
        btnUp.addEventListener('mouseup', () => stopKey('ArrowUp'));
        btnUp.addEventListener('mouseleave', () => stopKey('ArrowUp'));
        btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); startKey('ArrowUp'); });
        btnUp.addEventListener('touchend', (e) => { e.preventDefault(); stopKey('ArrowUp'); });
    }

    if (btnDown) {
        btnDown.addEventListener('mousedown', () => startKey('ArrowDown'));
        btnDown.addEventListener('mouseup', () => stopKey('ArrowDown'));
        btnDown.addEventListener('mouseleave', () => stopKey('ArrowDown'));
        btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); startKey('ArrowDown'); });
        btnDown.addEventListener('touchend', (e) => { e.preventDefault(); stopKey('ArrowDown'); });
    }

    if (btnShoot) {
        btnShoot.addEventListener('mousedown', () => startKey(' '));
        btnShoot.addEventListener('mouseup', () => stopKey(' '));
        btnShoot.addEventListener('mouseleave', () => stopKey(' '));
        btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); startKey(' '); });
        btnShoot.addEventListener('touchend', (e) => { e.preventDefault(); stopKey(' '); });
    }

    // --------------------- Start Animation ---------------------
    function startGame() {
        if (!game.gameStarted) return;
        if (animationId === null) startGameAnimation();
    }
});
