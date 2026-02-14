// SinWaveShot.js
export class SinWaveProjectile extends Projectile {
    constructor(game, x, y, offset) {
        super(game, x, y);
        this.baseY = y;
        this.angle = offset;
        this.frequency = 0.1;
        this.amplitude = 20;
    }

    update() {
        this.x += this.speed;
        this.angle += this.frequency;
        this.y = this.baseY + Math.sin(this.angle) * this.amplitude;

        if (this.x > this.game.width * 0.9) {
            this.markedForDeletion = true;
        }
    }
}

export class SinWaveShot {
    static fire(player) {
        if (player.game.ammo <= 0) return;

        const sections = 6;

        for (let i = 0; i < sections; i++) {
            const yOffset = (player.height / sections) * i;
            player.projectiles.push(
                new SinWaveProjectile(
                    player.game,
                    player.x + 80,
                    player.y + yOffset,
                    i
                )
            );
        }

        player.game.ammo -= 2;
        if (player.game.ammo < 0) player.game.ammo = 0;
    }
}
