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
// 1. CONSTANT SPEED & STIFF CURSOR LOGIC
// ------------------------------------
let targetMouseX = window.innerWidth / 2;
let targetMouseY = window.innerHeight / 2;
let cursorX = targetMouseX;
let cursorY = targetMouseY;

// --- TWEAKABLE CURSOR SETTINGS ---
const cursorSpeed = 2.5;  // Fixed speed in pixels per frame (lower = slower)
const stiffnessStep = 8; // Pixel step snapping for stiff/robotic feel

// Track actual mouse position
window.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
});

function updateCursor() {
    // Calculate distance vector to the target mouse position
    const dx = targetMouseX - cursorX;
    const dy = targetMouseY - cursorY;
    const distance = Math.hypot(dx, dy);

    // If cursor is not already at target position
    if (distance > 0) {
        if (distance <= cursorSpeed) {
            // Snap directly if very close
            cursorX = targetMouseX;
            cursorY = targetMouseY;
        } else {
            // Move toward target at a completely CONSTANT speed
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
