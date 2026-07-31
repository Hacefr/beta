const cursor = document.getElementById('custom-cursor');
const blueArrow = document.getElementById('direction-arrow');
const whiteArrow = document.getElementById('nearest-dot-arrow');
const map = document.getElementById('map');
const centerMarker = document.getElementById('center-marker');
const container = document.getElementById('game-container');
const posText = document.getElementById('pos-text');
const scoreText = document.getElementById('score-text');
const dotsContainer = document.getElementById('dots-container');

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
        // Random world coordinates between -2500 and +2500
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

// Update map background position, landmarks, and HUD
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
    // Hide enemy select modal
    enemySelectModal.style.display = 'none';
    gameOverModal.style.display = 'none';

    // Request Pointer Lock directly on enemy click
    container.requestPointerLock();

    // Start Enemy Manager
    enemyManager.start(enemyType);
    isGameActive = true;
}

function gameOver() {
    isGameActive = false;
    document.exitPointerLock();
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

window.addEventListener('mousemove', (e) => {
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
        const rad = Math.atan2(dy, dx);

        const arrowX = stiffX + Math.cos(rad) * 22;
        const arrowY = stiffY + Math.sin(rad) * 22;

        blueArrow.style.left = `${arrowX - 12}px`;
        blueArrow.style.top = `${arrowY - 12}px`;
        blueArrow.style.transform = `rotate(${angle}deg)`;
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

    // White Arrow pointing to nearest dot
    if (nearestDot) {
        const dx = nearestDot.screenX - cursorX;
        const dy = nearestDot.screenY - cursorY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const rad = Math.atan2(dy, dx);

        const arrowX = cursorX + Math.cos(rad) * 36;
        const arrowY = cursorY + Math.sin(rad) * 36;

        whiteArrow.style.left = `${arrowX - 12}px`;
        whiteArrow.style.top = `${arrowY - 12}px`;
        whiteArrow.style.transform = `rotate(${angle}deg)`;
        whiteArrow.style.opacity = '1';
    } else {
        whiteArrow.style.opacity = '0';
    }
}

// ------------------------------------
// 3. KEYBOARD & MAP PANNING
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
    updateCursor();
    updateDotsAndNearestArrow();

    if (isGameActive) {
        // Calculate player's current world position
        const playerWorldX = cursorX - (window.innerWidth / 2 + mapX);
        const playerWorldY = cursorY - (window.innerHeight / 2 + mapY);

        // Update Enemy logic and check for player death
        const playerDied = enemyManager.update(playerWorldX, playerWorldY, cursorX, cursorY, mapX, mapY);
        if (playerDied) {
            gameOver();
        }
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

    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();
