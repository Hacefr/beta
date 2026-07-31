const cursor = document.getElementById('custom-cursor');
const blueArrow = document.getElementById('direction-arrow');
const whiteArrow = document.getElementById('nearest-dot-arrow');
const map = document.getElementById('map');
const centerMarker = document.getElementById('center-marker');
const container = document.getElementById('game-container');
const posText = document.getElementById('pos-text');
const scoreText = document.getElementById('score-text');
const dotsContainer = document.getElementById('dots-container');
const abilityStatus = document.getElementById('ability-status');

const enemySelectModal = document.getElementById('enemy-select-modal');
const gameOverModal = document.getElementById('game-over-modal');

// Create Enemy Manager instance
const enemyManager = new EnemyManager();

let isGameActive = false;

// Infinite Map World Offset Tracking
let mapX = 0;
let mapY = 0;

// ------------------------------------
// 0. SPAWN 50 COLLECTIBLE DOTS
// ------------------------------------
const TOTAL_DOTS = 50;
const dots = [];
let collectedCount = 0;

function spawnDots() {
    dotsContainer.innerHTML = '';
    dots.length = 0;
    collectedCount = 0;

    for (let i = 0; i < TOTAL_DOTS; i++) {
        const x = Math.round((Math.random() - 0.5) * 5000);
        const y = Math.round((Math.random() - 0.5) * 5000);

        const el = document.createElement('div');
        el.className = 'dot';
        dotsContainer.appendChild(el);

        dots.push({ x, y, collected: false, element: el });
    }
    scoreText.innerText = `Dots: 0 / ${TOTAL_DOTS}`;
}
spawnDots();

function updateMapTransform() {
    map.style.backgroundPosition = `${mapX}px ${mapY}px`;

    const originScreenX = window.innerWidth / 2 + mapX;
    const originScreenY = window.innerHeight / 2 + mapY;
    centerMarker.style.left = `${originScreenX}px`;
    centerMarker.style.top = `${originScreenY}px`;

    const worldX = Math.round(-mapX);
    const worldY = Math.round(-mapY);
    posText.innerText = `X: ${worldX} | Y: ${worldY}`;
}
updateMapTransform();

// ------------------------------------
// ENEMY SELECTION & POINTER LOCK
// ------------------------------------
function selectEnemy(enemyType) {
    enemySelectModal.style.display = 'none';
    gameOverModal.style.display = 'none';

    cursor.style.display = 'block';
    document.body.style.cursor = 'none';

    targetMouseX = window.innerWidth / 2;
    targetMouseY = window.innerHeight / 2;
    cursorX = targetMouseX;
    cursorY = targetMouseY;

    container.requestPointerLock();

    enemyManager.start(enemyType);
    isGameActive = true;
    resetFlashStepCooldown();
}

function gameOver() {
    isGameActive = false;
    document.exitPointerLock();
    document.body.style.cursor = 'auto';
    cursor.style.display = 'none';
    blueArrow.style.opacity = '0';
    whiteArrow.style.opacity = '0';
    gameOverModal.style.display = 'flex';
}

function resetGame() {
    mapX = 0;
    mapY = 0;
    updateMapTransform();
    spawnDots();
    enemyManager.reset();

    gameOverModal.style.display = 'none';
    enemySelectModal.style.display = 'flex';
    document.body.style.cursor = 'auto';
}

// ------------------------------------
// 1. CONSTANT SPEED & LOCKED CURSOR LOGIC
// ------------------------------------
let targetMouseX = window.innerWidth / 2;
let targetMouseY = window.innerHeight / 2;
let cursorX = targetMouseX;
let cursorY = targetMouseY;

const cursorSpeed = 2.5;    // Fixed cursor speed in pixels per frame
const stiffnessStep = 8;    // Pixel step snapping for stiff feel
const edgeThreshold = 60;   // Distance in pixels from screen edge to trigger auto-scroll
const edgePanSpeed = 10;    // Speed of infinite map auto-scrolling

// ------------------------------------
// FLASH STEP ABILITY LOGIC (SPACEBAR)
// ------------------------------------
const flashStepDistance = 220; // Teleport distance in pixels
let isFlashStepReady = true;
let flashStepCooldownTimer = null;

function resetFlashStepCooldown() {
    isFlashStepReady = true;
    abilityStatus.className = 'ready';
    abilityStatus.innerText = '[READY]';
}

window.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.code === 'Space') && isGameActive && isFlashStepReady) {
        e.preventDefault();

        // Calculate direction vector toward real mouse target
        const dx = targetMouseX - cursorX;
        const dy = targetMouseY - cursorY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            // Instant Teleport Forward along facing direction
            cursorX += (dx / dist) * flashStepDistance;
            cursorY += (dy / dist) * flashStepDistance;
        } else {
            // Default forward if stationary
            cursorX += flashStepDistance;
        }

        // Clamp within screen bounds
        cursorX = Math.max(0, Math.min(window.innerWidth, cursorX));
        cursorY = Math.max(0, Math.min(window.innerHeight, cursorY));

        // Start 3-second Cooldown
        isFlashStepReady = false;
        abilityStatus.className = 'cooldown';
        let timeLeft = 3.0;
        abilityStatus.innerText = `[${timeLeft.toFixed(1)}s]`;

        const cooldownInterval = setInterval(() => {
            timeLeft -= 0.1;
            if (timeLeft <= 0) {
                clearInterval(cooldownInterval);
                resetFlashStepCooldown();
            } else {
                abilityStatus.innerText = `[${timeLeft.toFixed(1)}s]`;
            }
        }, 100);
    }
});

window.addEventListener('mousemove', (e) => {
    if (!isGameActive) return;

    if (document.pointerLockElement === container) {
        targetMouseX += e.movementX;
        targetMouseY += e.movementY;
    } else {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    }

    targetMouseX = Math.max(0, Math.min(window.innerWidth, targetMouseX));
    targetMouseY = Math.max(0, Math.min(window.innerHeight, targetMouseY));
});

function updateCursor() {
    if (!isGameActive) return;

    const dx = targetMouseX - cursorX;
    const dy = targetMouseY - cursorY;
    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
        if (distance <= cursorSpeed) {
            cursorX = targetMouseX;
            cursorY = targetMouseY;
        } else {
            cursorX += (dx / distance) * cursorSpeed;
            cursorY += (dy / distance) * cursorSpeed;
        }
    }

    const stiffX = Math.round(cursorX / stiffnessStep) * stiffnessStep;
    const stiffY = Math.round(cursorY / stiffnessStep) * stiffnessStep;

    cursor.style.left = `${stiffX - 12}px`;
    cursor.style.top = `${stiffY - 12}px`;

    // Blue direction arrow
    if (distance > 5) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        blueArrow.style.left = `${stiffX - 12}px`;
        blueArrow.style.top = `${stiffY - 12}px`;
        blueArrow.style.transform = `rotate(${angle}deg) translateX(24px)`;
        blueArrow.style.opacity = '1';
    } else {
        blueArrow.style.opacity = '0';
    }
}

// ------------------------------------
// 2. UPDATE DOT POSITIONS & WHITE ARROW
// ------------------------------------
function updateDotsAndNearestArrow() {
    const originScreenX = window.innerWidth / 2 + mapX;
    const originScreenY = window.innerHeight / 2 + mapY;

    let nearestDot = null;
    let minDistance = Infinity;

    dots.forEach(dot => {
        if (dot.collected) return;

        const screenX = originScreenX + dot.x;
        const screenY = originScreenY + dot.y;

        dot.element.style.left = `${screenX}px`;
        dot.element.style.top = `${screenY}px`;

        if (!isGameActive) return;

        const dist = Math.hypot(screenX - cursorX, screenY - cursorY);

        if (dist < 20) {
            dot.collected = true;
            dot.element.classList.add('collected');
            collectedCount++;

            if (collectedCount === TOTAL_DOTS) {
                scoreText.innerText = 'ALL DOTS COLLECTED! 🏆';
            } else {
                scoreText.innerText = `Dots: ${collectedCount} / ${TOTAL_DOTS}`;
            }
        } else {
            if (dist < minDistance) {
                minDistance = dist;
                nearestDot = { screenX, screenY, dist };
            }
        }
    });

    // White nearest-dot arrow
    if (isGameActive && nearestDot) {
        const dx = nearestDot.screenX - cursorX;
        const dy = nearestDot.screenY - cursorY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        whiteArrow.style.left = `${cursorX - 12}px`;
        whiteArrow.style.top = `${cursorY - 12}px`;
        whiteArrow.style.transform = `rotate(${angle}deg) translateX(38px)`;
        whiteArrow.style.opacity = '1';
    } else {
        whiteArrow.style.opacity = '0';
    }
}

// ------------------------------------
// 3. KEYBOARD CONTROL
// ------------------------------------
const keysPressed = {};
const keyPanSpeed = 8;

window.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

// ------------------------------------
// MAIN GAME LOOP
// ------------------------------------
function gameLoop() {
    if (isGameActive) {
        updateCursor();

        const playerWorldX = cursorX - (window.innerWidth / 2 + mapX);
        const playerWorldY = cursorY - (window.innerHeight / 2 + mapY);

        const playerDied = enemyManager.update(playerWorldX, playerWorldY, cursorX, cursorY, mapX, mapY);
        if (playerDied) {
            gameOver();
        }

        let moved = false;

        // KEYBOARD MOVEMENTS
        if (keysPressed['w'] || keysPressed['arrowup']) { mapY += keyPanSpeed; moved = true; }
        if (keysPressed['s'] || keysPressed['arrowdown']) { mapY -= keyPanSpeed; moved = true; }
        if (keysPressed['a'] || keysPressed['arrowleft']) { mapX += keyPanSpeed; moved = true; }
        if (keysPressed['d'] || keysPressed['arrowright']) { mapX -= keyPanSpeed; moved = true; }

        // SCREEN EDGE AUTO-PANNING
        if (cursorX < edgeThreshold) { mapX += edgePanSpeed; moved = true; }
        if (cursorX > window.innerWidth - edgeThreshold) { mapX -= edgePanSpeed; moved = true; }
        if (cursorY < edgeThreshold) { mapY += edgePanSpeed; moved = true; }
        if (cursorY > window.innerHeight - edgeThreshold) { mapY -= edgePanSpeed; moved = true; }

        if (moved) {
            updateMapTransform();
        }
    }

    updateDotsAndNearestArrow();
    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();
