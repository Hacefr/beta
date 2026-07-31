const cursor = document.getElementById('custom-cursor');
const arrow = document.getElementById('direction-arrow');
const map = document.getElementById('map');
const centerMarker = document.getElementById('center-marker');
const container = document.getElementById('game-container');
const lockHint = document.getElementById('lock-hint');
const coordsHud = document.getElementById('coords-hud');

// Infinite Map World Offset Tracking
let mapX = 0;
let mapY = 0;

// Update map background position and world landmark coordinates
function updateMapTransform() {
    // 1. Shift the infinite tiling grid infinitely
    map.style.backgroundPosition = `${mapX}px ${mapY}px`;

    // 2. Position World Center (0, 0) marker relative to viewport center
    const originScreenX = window.innerWidth / 2 + mapX;
    const originScreenY = window.innerHeight / 2 + mapY;
    centerMarker.style.left = `${originScreenX}px`;
    centerMarker.style.top = `${originScreenY}px`;

    // 3. Update HUD World Coordinates
    const worldX = Math.round(-mapX);
    const worldY = Math.round(-mapY);
    coordsHud.innerText = `X: ${worldX} | Y: ${worldY}`;
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
    // DIRECTION ARROW INDICATOR
    // ------------------------------------
    if (distance > 5) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const rad = Math.atan2(dy, dx);

        const arrowX = stiffX + Math.cos(rad) * 22;
        const arrowY = stiffY + Math.sin(rad) * 22;

        arrow.style.left = `${arrowX - 12}px`;
        arrow.style.top = `${arrowY - 12}px`;
        arrow.style.transform = `rotate(${angle}deg)`;
        arrow.style.opacity = '1';
    } else {
        arrow.style.opacity = '0';
    }
}

// ------------------------------------
// 2. INFINITE MAP PANNING (Drag)
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
// 3. KEYBOARD PANNING (WASD / Arrows)
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

    let moved = false;

    // --- KEYBOARD MOVEMENTS ---
    if (keysPressed['w'] || keysPressed['arrowup']) { mapY += keyPanSpeed; moved = true; }
    if (keysPressed['s'] || keysPressed['arrowdown']) { mapY -= keyPanSpeed; moved = true; }
    if (keysPressed['a'] || keysPressed['arrowleft']) { mapX += keyPanSpeed; moved = true; }
    if (keysPressed['d'] || keysPressed['arrowright']) { mapX -= keyPanSpeed; moved = true; }

    // --- SCREEN EDGE AUTO-PANNING (Pushes map infinitely when touching edges) ---
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
