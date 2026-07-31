const cursor = document.getElementById('custom-cursor');
const map = document.getElementById('map');
const container = document.getElementById('game-container');

// Map position tracking
let mapX = -(3000 / 2 - window.innerWidth / 2);
let mapY = -(3000 / 2 - window.innerHeight / 2);

function updateMapTransform() {
    map.style.transform = `translate(${mapX}px, ${mapY}px)`;
}
updateMapTransform();

// ------------------------------------
// 1. SLOW & STIFF CURSOR LOGIC
// ------------------------------------
let targetMouseX = window.innerWidth / 2;
let targetMouseY = window.innerHeight / 2;
let cursorX = targetMouseX;
let cursorY = targetMouseY;

// Tweakable cursor settings
const cursorSpeed = 0.04; // Lower = slower/heavier drag
const stiffnessStep = 10;  // Higher = stiffer / step-snapped movement

// Track actual mouse position
window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
});

function updateCursor() {
    // Move cursor slowly towards target mouse position
    cursorX += (targetMouseX - cursorX) * cursorSpeed;
    cursorY += (targetMouseY - cursorY) * cursorSpeed;

    // Make movement stiff by snapping to pixel increments
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
    mapX = e.clientX - startX;
    mapY = e.clientY - startY;
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
    // Update cursor position every frame
    updateCursor();

    // Update map keyboard movement
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
