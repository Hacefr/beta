const cursor = document.getElementById('custom-cursor');
const map = document.getElementById('map');
const container = document.getElementById('game-container');

// Map position tracking
let mapX = -(3000 / 2 - window.innerWidth / 2); // Start centered in map
let mapY = -(3000 / 2 - window.innerHeight / 2);

// Update map position visually
function updateMapTransform() {
    map.style.transform = `translate(${mapX}px, ${mapY}px)`;
}
updateMapTransform();

// ------------------------------------
// 1. CUSTOM CURSOR TRACKING
// ------------------------------------
window.addEventListener('mousemove', (e) => {
    // Offset by half width/height (12px) to center cursor on mouse position
    cursor.style.left = `${e.clientX - 12}px`;
    cursor.style.top = `${e.clientY - 12}px`;
});

// ------------------------------------
// 2. EXPLORABLE MAP PANNING (Drag to Pan)
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

function gameLoop() {
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

// Start game loop for keyboard movement
gameLoop();
