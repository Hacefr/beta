const cursor = document.getElementById('custom-cursor');
const blueArrow = document.getElementById('direction-arrow');
const whiteArrow = document.getElementById('nearest-dot-arrow');
const map = document.getElementById('map');
const centerMarker = document.getElementById('center-marker');
const container = document.getElementById('game-container');
const lockHint = document.getElementById('lock-hint');
const posText = document.getElementById('pos-text');
const scoreText = document.getElementById('score-text');
const dotsContainer = document.getElementById('dots-container');

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
    for (let i = 0; i < TOTAL_DOTS; i++) {
        // Random world coordinates between -2500 and +2500
        const x = Math.round((Math.random() - 0.5) * 5000);
        const y = Math.round((Math.random() - 0.5) * 5000);

        const el = document.createElement('div');
        el.className = 'dot';
        dotsContainer.appendChild(el);

        dots.push({ x, y, collected: false, element: el });
    }
}
spawnDots();

// Update map background position, landmarks, and dots
function updateMapTransform() {
    // 1. Shift the infinite tiling grid infinitely
    map.style.backgroundPosition = `${mapX}px ${mapY}px`;

    // 2. Position World Center (0, 0) marker
    const originScreenX = window.innerWidth / 2 + mapX;
    const originScreenY = window.innerHeight / 2 + mapY;
    centerMarker.style.left = `${originScreenX}px`;
    centerMarker.style.top = `${originScreenY}px`;

    // 3. Update HUD World Coordinates
    const worldX = Math.round(-mapX);
    const worldY = Math.round(-mapY);
    posText.innerText = `X: ${worldX} | Y: ${worldY}`;
}
updateMapTransform();

// ------------------------------------
// 1. CONSTANT SPEED & LOCKED CURSOR LOGIC
// ------------------------------------
let targetMouseX = window.innerWidth / 2;
let targetMouseY = window.innerHeight / 2;
let cursorX = targetMouseX;
let cursorY = targetMouseY;

// --- TWEAKABLE CURSOR & PANNING SETTINGS ---
const cursorSpeed = 2.5;    // Fixed cursor speed in pixels per frame
const stiffnessStep = 8;    // Pixel step snapping for stiff feel
const edgeThreshold = 60;   // Distance in pixels from screen edge to trigger auto-scroll
const edgePanSpeed = 10;    // Speed of infinite map auto-scrolling

// Request pointer lock when clicking on the game window
container.addEventListener('click', () => {
    if (document.pointerLockElement !== container) {
        container.requestPointerLock();
    }
});

// Detect when pointer lock state changes
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === container) {
        lockHint.style.opacity = '0';
    } else {
        lockHint.style.opacity = '1';
    }
});

// Track mouse movement using real mouse sensitivity
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === container) {
        targetMouseX += e.movementX;
        targetMouseY += e.movementY;
    } else {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    }

    // STRICT BOUNDARY CLAMPING FOR CURSOR TARGET
    targetMouseX = Math.max(0, Math.min(window.innerWidth, targetMouseX));
    targetMouseY = Math.max(0, Math.min(window.innerHeight, targetMouseY));
});

function updateCursor() {
    // Calculate distance vector between current cursor and real mouse target
    const dx = targetMouseX - cursorX;
    const dy = targetMouseY - cursorY;
    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
        if (distance <= cursorSpeed) {
            cursorX = targetMouseX;
            cursorY = targetMouseY;
        } else {
            // Move slow custom cursor at constant speed
            cursorX += (dx / distance) * cursorSpeed;
            cursorY += (dy / distance) * cursorSpeed;
        }
    }

    // Apply stiff pixel grid snapping
    const stiffX = Math.round(cursorX / stiffnessStep) * stiffnessStep;
    const stiffY = Math.round(cursorY / stiffnessStep) * stiffnessStep;

    // Render custom cursor position
    cursor.style.left = `${stiffX - 12}px`;
    cursor.style.top = `${stiffY - 12}px`;

    // ------------------------------------
    // BLUE DIRECTION ARROW (Real Mouse Trajectory)
    // ------------------------------------
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

        // Compute dot's current screen position
        const screenX = originScreenX + dot.x;
        const screenY = originScreenY + dot.y;

        // Render dot position
        dot.element.style.left = `${screenX}px`;
        dot.element.style.top = `${screenY}px`;

        // Calculate distance from custom cursor to dot
        const dist = Math.hypot(screenX - cursorX, screenY - cursorY);

        // Check for collection collision (within 20px)
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
            // Check if this dot is the nearest one
            if (dist < minDistance) {
                minDistance = dist;
                nearestDot = { screenX, screenY, dist };
            }
        }
    });

    // ------------------------------------
    // WHITE ARROW INDICATOR (Points to Nearest Dot)
    // ------------------------------------
    if (nearestDot) {
        const dx = nearestDot.screenX - cursorX;
        const dy = nearestDot.screenY - cursorY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const rad = Math.atan2(dy, dx);

        // Position white arrow slightly further out (36px) from custom cursor
        const arrowX = cursorX + Math.cos(rad) * 36;
        const arrowY = cursorY + Math.sin(rad) * 36;

        whiteArrow.style.left = `${arrowX - 12}px`;
        whiteArrow.style.top = `${arrowY - 12}px`;
        whiteArrow.style.transform = `rotate(${angle}deg)`;
        whiteArrow.style.opacity = '1';
    } else {
        whiteArrow.style.opacity = '0'; // Hide white arrow when all dots are collected
    }
}

// ------------------------------------
// 3. INFINITE MAP PANNING (Drag)
// ------------------------------------
let isDragging = false;
let startX = 0;
let startY = 0;

container.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - mapX;
    startY = e.clientY - mapY;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    if (document.pointerLockElement === container) {
        mapX += e.movementX;
        mapY += e.movementY;
    } else {
        mapX = e.clientX - startX;
        mapY = e.clientY - startY;
    }
    updateMapTransform();
});

// ------------------------------------
// 4. KEYBOARD PANNING (WASD / Arrows)
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
