// ---------------------- index2.js ----------------------
let game; // global

window.addEventListener('load', function() {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = 1200;
  canvas.height = 500;

  // ------------------- Game Class -------------------
  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.gameStarted = true;
      this.keys = [];
      this.paused = false;
      this.soundOn = true;

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

    playSound(name) {
      if (!this.soundOn) return;
      const s = this.sounds[name];
      if (!s) return;
      s.currentTime = 0;
      s.play().catch(() => {}); // avoid autoplay errors
    }

    togglePause() {
      this.paused = !this.paused;
      const icon = document.getElementById('pausePlayIcon');
      if (icon) icon.src = this.paused ? 'assets/pngwing.com (39).png' : 'assets/pngwing.com (38).png';
    }

    setDifficultyNormal() { 
      this.difficulty = "Normal";
      alert("Normal mode selected"); 
    }

    setDifficultyDifficult() { 
      this.difficulty = "Difficult";
      alert("Difficult mode selected"); 
    }

    fullReset() { 
      alert("Game Restarted");
      this.paused = false;
      const icon = document.getElementById('pausePlayIcon');
      if(icon) icon.src = 'assets/pngwing.com (38).png';
    }

    update(deltaTime) {
      // Add game logic here
    }

    draw(ctx) {
      ctx.clearRect(0, 0, this.width, this.height);
      // Add drawing logic here
    }
  }

  game = new Game(canvas.width, canvas.height); // define game before buttons

  // ------------------- Animation Loop -------------------
  let lastTime = 0;
  function animate(timeStamp) {
    if (!game.gameStarted || game.paused) {
      requestAnimationFrame(animate);
      return;
    }
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    game.update(deltaTime);
    game.draw(ctx);

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // ------------------- Buttons -------------------
  document.getElementById('btnNormal').addEventListener('click', ()=>game.setDifficultyNormal());
  document.getElementById('btnDifficult').addEventListener('click', ()=>game.setDifficultyDifficult());

  const btnSound = document.getElementById('btnSound');
  const soundIcon = document.getElementById('soundIcon');
  btnSound.addEventListener('click', () => {
    game.soundOn = !game.soundOn;
    soundIcon.src = game.soundOn ? 'assets/volume.png' : 'assets/mute.png';
  });

  document.getElementById('btnPausePlay').addEventListener('click', ()=>game.togglePause());
  document.getElementById('btnRestart').addEventListener('click', ()=>game.fullReset());

  // ------------------- Mobile Controls -------------------
  function startKey(key) { if(!game.keys.includes(key)) game.keys.push(key); }
  function stopKey(key) { const i = game.keys.indexOf(key); if(i>-1) game.keys.splice(i,1); }

  ['Up','Down','Shoot'].forEach(btn => {
    const el = document.getElementById('btn'+btn);
    if(!el) return;
    const keyMap = { Up:'ArrowUp', Down:'ArrowDown', Shoot:' ' };
    el.addEventListener('mousedown', ()=>startKey(keyMap[btn]));
    el.addEventListener('mouseup', ()=>stopKey(keyMap[btn]));
    el.addEventListener('mouseleave', ()=>stopKey(keyMap[btn]));
    el.addEventListener('touchstart', e=>{ e.preventDefault(); startKey(keyMap[btn]); });
    el.addEventListener('touchend', e=>{ e.preventDefault(); stopKey(keyMap[btn]); });
  });

  // ------------------- Unlock Audio -------------------
  function unlockAudio() {
    Object.values(game.sounds).forEach(s => { 
      s.play().catch(()=>{}); 
      s.pause(); 
      s.currentTime = 0; 
    });
  }
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
});
