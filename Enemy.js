class EnemyManager {
    constructor() {
        this.type = null; // 1, 2, or 3
        this.element = document.getElementById('enemy-element');
        this.blastElement = document.getElementById('blast-radius');
        
        // Enemy 1: Path History (Shadow)
        this.pathHistory = [];
        this.historyDelay = 70; // Number of frames delayed behind player

        // Enemy 2: Snail (Direct Follower)
        this.worldX = 250;
        this.worldY = 250;
        this.snailSpeed = 1.1;

        // Enemy 3: Pulse Mine
        this.mineWorldX = -300;
        this.mineWorldY = -300;
        this.mineSpeed = 2.0;
        this.mineState = 'FOLLOWING'; // FOLLOWING, CHARGING, EXPLODING
        this.stateTimer = 0;
        this.blastMaxRadius = 140; // Max explosion radius in pixels
        this.currentBlastRadius = 0;
    }

    start(enemyType) {
        this.type = enemyType;
        this.element.className = `type-${enemyType}`;
        this.element.style.display = 'block';
        this.blastElement.style.display = 'none';

        // Reset tracking states
        this.pathHistory = [];
        this.worldX = 250;
        this.worldY = 250;
        this.mineWorldX = -300;
        this.mineWorldY = -300;
        this.mineState = 'FOLLOWING';
        this.stateTimer = 0;
    }

    reset() {
        this.element.style.display = 'none';
        this.blastElement.style.display = 'none';
        this.type = null;
    }

    // Updates enemy position and returns TRUE if player died
    update(playerWorldX, playerWorldY, cursorX, cursorY, mapX, mapY) {
        if (!this.type) return false;

        const originScreenX = window.innerWidth / 2 + mapX;
        const originScreenY = window.innerHeight / 2 + mapY;

        // ----------------------------------------------------
        // ENEMY 1: THE SHADOW (Exact Movement History Trail)
        // ----------------------------------------------------
        if (this.type === 1) {
            this.pathHistory.push({ x: playerWorldX, y: playerWorldY });

            if (this.pathHistory.length > this.historyDelay) {
                const enemyPos = this.pathHistory.shift();

                const screenX = originScreenX + enemyPos.x;
                const screenY = originScreenY + enemyPos.y;

                this.element.style.left = `${screenX}px`;
                this.element.style.top = `${screenY}px`;

                const dist = Math.hypot(screenX - cursorX, screenY - cursorY);
                if (dist < 18) {
                    return true; // Player Dies!
                }
            } else {
                this.element.style.left = `-9999px`;
            }
        }

        // ----------------------------------------------------
        // ENEMY 2: SLOW SNAIL (Creeps directly toward player)
        // ----------------------------------------------------
        else if (this.type === 2) {
            const dx = playerWorldX - this.worldX;
            const dy = playerWorldY - this.worldY;
            const distance = Math.hypot(dx, dy);

            if (distance > 0) {
                this.worldX += (dx / distance) * this.snailSpeed;
                this.worldY += (dy / distance) * this.snailSpeed;
            }

            const screenX = originScreenX + this.worldX;
            const screenY = originScreenY + this.worldY;

            this.element.style.left = `${screenX}px`;
            this.element.style.top = `${screenY}px`;

            const playerDist = Math.hypot(screenX - cursorX, screenY - cursorY);
            if (playerDist < 20) {
                return true; // Player Dies!
            }
        }

        // ----------------------------------------------------
        // ENEMY 3: PULSE MINE (Follows, Charges, & Explodes)
        // ----------------------------------------------------
        else if (this.type === 3) {
            this.stateTimer++;

            if (this.mineState === 'FOLLOWING') {
                this.blastElement.style.display = 'none';
                
                const dx = playerWorldX - this.mineWorldX;
                const dy = playerWorldY - this.mineWorldY;
                const distance = Math.hypot(dx, dy);

                if (distance > 0) {
                    this.mineWorldX += (dx / distance) * this.mineSpeed;
                    this.mineWorldY += (dy / distance) * this.mineSpeed;
                }

                if (this.stateTimer > 180) { // 3 seconds
                    this.mineState = 'CHARGING';
                    this.stateTimer = 0;
                }
            }
            else if (this.mineState === 'CHARGING') {
                this.blastElement.style.display = 'block';

                const progress = Math.min(1, this.stateTimer / 90);
                this.currentBlastRadius = progress * this.blastMaxRadius;

                if (this.stateTimer > 90) { // 1.5 seconds
                    this.mineState = 'EXPLODING';
                    this.stateTimer = 0;
                }
            }
            else if (this.mineState === 'EXPLODING') {
                this.blastElement.style.border = '3px solid #ff4757';
                this.blastElement.style.background = 'rgba(255, 71, 87, 0.6)';

                const enemyScreenX = originScreenX + this.mineWorldX;
                const enemyScreenY = originScreenY + this.mineWorldY;
                const playerDist = Math.hypot(enemyScreenX - cursorX, enemyScreenY - cursorY);

                if (playerDist <= this.blastMaxRadius) {
                    return true;
                }

                if (this.stateTimer > 30) {
                    this.mineState = 'FOLLOWING';
                    this.stateTimer = 0;
                    this.blastElement.style.border = '2px dashed #ff4757';
                    this.blastElement.style.background = 'rgba(255, 71, 87, 0.2)';
                }
            }

            const screenX = originScreenX + this.mineWorldX;
            const screenY = originScreenY + this.mineWorldY;

            this.element.style.left = `${screenX}px`;
            this.element.style.top = `${screenY}px`;

            if (this.mineState !== 'FOLLOWING') {
                this.blastElement.style.left = `${screenX}px`;
                this.blastElement.style.top = `${screenY}px`;
                this.blastElement.style.width = `${this.currentBlastRadius * 2}px`;
                this.blastElement.style.height = `${this.currentBlastRadius * 2}px`;
            }
        }

        return false;
    }
}
