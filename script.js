const cursor = document.getElementById('custom-cursor');
const map = document.getElementById('map');
const container = document.getElementById('game-container');
const lockHint = document.getElementById('lock-hint');

// Map position tracking
let mapX = -(3000 / 2 - window.innerWidth / 2);
let mapY = -(3000 / 2 - window.innerHeight / 2);

function updateMapTransform() {
    map.style.transform = `translate(${mapX}px, ${mapY}px)`;
}
updateMapTransform();

// ------------------------------------
// 1. CONSTANT SPEED & LOCKED CURSOR LOGIC
// ------------------------------------
let targetMouseX = window.innerWidth / 2;
let targetMouseY = window.innerHeight / 2;
let cursorX = targetMouseX;
let cursorY = targetMouseY;

// --- TWEAKABLE CURSOR SETTINGS ---
const cursorSpeed = 2.5;  // Fixed speed in pixels per frame
const stiffnessStep = 8;  // Pixel step snapping for stiff feel

// Request pointer lock when clicking on the game window
container.addEventListener('click', () => {
    if (document.pointerLockElement !== container) {
        container.requestPointerLock();
    }
});

// Detect when pointer lock state changes
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === container) {
        lockHint.style.opacity = '0'; // Hide lock hint when locked
    } else {
        lockHint.style.opacity = '1'; // Show hint if unlocked
    }
});

// Track mouse movement and lock within screen bounds
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === container) {
        // When locked, add mouse deltas to position
        targetMouseX += e.movementX;
        targetMouseY += e.movementY;
    } else {
        // When unlocked, use raw client coordinates
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    }

    // STRICT BOUNDARY CLAMPING (Never allows cursor target to leave the viewport)
    targetMouseX = Math.max(0, Math.min(window.innerWidth, targetMouseX));
    targetMouseY = Math.max(0, Math.min(window.innerHeight, targetMouseY));
});

function updateCursor() {
    // Calculate distance vector
    const dx = targetMouseX - cursorX;
    const dy = targetMouseY - cursorY;
    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
        if (distance <= cursorSpeed) {
            cursorX = targetMouseX;
            cursorY = targetMouseY;
        } else {
            // Constant speed movement
            cursorX += (dx / distance) * cursorSpeed;
            cursorY += (dy / distance) * cursorSpeed;
        }
    }

    // Apply stiff pixel grid snapping
    const stiffX = Math.round(cursorX / stiffnessStep) * stiffnessStep;
    const stiffY = Math.round(cursorY / stiffnessStep) * stiffnessStep;

    // Render cursor position
    cursor.style.left = `${stiffX - 12}px`;
    cursor.style.top = `${stiffY - 12}px`;
}

// ------------------------------------
// 2. EXPLORABLE MAP PANNING (Drag)
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
const panSpeed = 8;

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
    if (keysPressed['w'] || keysPressed['arrowup']) { mapY += panSpeed; moved = true; }
    if (keysPressed['s'] || keysPressed['arrowdown']) { mapY -= panSpeed; moved = true; }
    if (keysPressed['a'] || keysPressed['arrowleft']) { mapX += panSpeed; moved = true; }
    if (keysPressed['d'] || keysPressed['arrowright']) { mapX -= panSpeed; moved = true; }

    if (moved) {
        updateMapTransform();
    }

    requestAnimationFrame(gameLoop);
}

// Start game loop
gameLoop();
