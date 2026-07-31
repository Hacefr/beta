const cursor = document.getElementById('custom-cursor');
const arrow = document.getElementById('direction-arrow');
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

    // STRICT BOUNDARY CLAMPING
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
    // DIRECTION ARROW INDICATOR (Real Mouse Trajectory)
    // ------------------------------------
    if (distance > 5) {
        // Calculate angle towards real mouse target
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const rad = Math.atan2(dy, dx);

        // Position arrow slightly ahead of the cursor ring
        const arrowX = stiffX + Math.cos(rad) * 22;
        const arrowY = stiffY + Math.sin(rad) * 22;

        arrow.style.left = `${arrowX - 12}px`;
        arrow.style.top = `${arrowY - 12}px`;
        arrow.style.transform = `rotate(${angle}deg)`;
        arrow.style.opacity = '1'; // Show arrow when mouse is moving ahead
    } else {
        arrow.style.opacity = '0'; // Hide arrow when cursor reaches destination
    }
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
