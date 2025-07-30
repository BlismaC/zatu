// weaponSelectionUI.js - Manages the UI and logic for selecting unlocked weapons.

// Add a polyfill for roundRect if it's not natively supported by the browser's CanvasRenderingContext2D.
// This ensures that the roundRect method used for drawing rounded rectangles works consistently.
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        // Normalize the radius input to an object with properties for each corner.
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        } else if (typeof radius === 'object') {
            radius = {
                tl: radius.tl || 0, // Top-left radius, default to 0
                tr: radius.tr || 0, // Top-right radius, default to 0
                br: radius.br || 0, // Bottom-right radius, default to 0
                bl: radius.bl || 0  // Bottom-left radius, default to 0
            };
        } else {
            // Default to no radius if input is invalid.
            radius = { tl: 0, tr: 0, br: 0, bl: 0 };
        }

        // Begin a new path for drawing the rounded rectangle.
        this.beginPath();
        // Move to the starting point (top-left corner after the top-left radius).
        this.moveTo(x + radius.tl, y);
        // Draw the top line.
        this.lineTo(x + width - radius.tr, y);
        // Draw the top-right corner arc.
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        // Draw the right line.
        this.lineTo(x + width, y + height - radius.br);
        // Draw the bottom-right corner arc.
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        // Draw the bottom line.
        this.lineTo(x + radius.bl, y + height);
        // Draw the bottom-left corner arc.
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        // Draw the left line.
        this.lineTo(x, y + radius.tl);
        // Draw the top-left corner arc and close the path.
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this; // Return the context for chaining
    };
}


// Import necessary constants from main.js (for drawing)
// You might need to adjust imports if weapon names become images or more complex
import {
    playerFillColor, playerOutlineColor, playerOutlineWidth // For weapon box styling consistency (though not directly used in this UI file)
} from './main.js';

// Import weapon properties to get weapon details (currently not used in this UI, but good for future expansion)
import { getWeaponProperties } from './weapons.js';

// --- UI Constants ---
const SLOT_SIZE = 60; // Size of each weapon slot (width and height)
const SLOT_SPACING = 10; // Space between slots
const PADDING_X = 20; // Padding from left/right edges of the canvas
const PADDING_Y = 10; // Padding from top edge of the canvas

const BACKGROUND_COLOR = "rgba(0, 0, 0, 0.7)"; // Dark semi-transparent background for the bar
const BORDER_COLOR = "#AAA"; // Light gray border
const ACTIVE_BORDER_COLOR = "#FFFF00"; // Bright yellow for active slot
const INACTIVE_SLOT_COLOR = "rgba(50,50,50,0.5)"; // Color for empty or non-active slots

const TEXT_COLOR = "white"; // Color for weapon names/labels
const FONT_SIZE = 14; // Font size for weapon name
const KEY_LABEL_FONT_SIZE = 12; // Font size for the number key label

// --- Internal State ---
let unlockedWeapons = []; // Stores the names of weapons the player has unlocked
let equippedWeaponName = 'hands'; // The name of the weapon currently equipped, defaults to 'hands'

// This will store Image objects for weapon icons if you add them later
const weaponIcons = {};
// Example: Preload icons (you'll need actual image paths)
// Object.keys(weaponData).forEach(weaponName => {
//     const img = new Image();
//     img.src = `assets/weapons/${weaponName.replace(/ /g, '_')}.png`; // Example path convention
//     img.onload = () => weaponIcons[weaponName] = img;
//     img.onerror = () => console.warn(`Failed to load weapon icon: ${img.src}`);
// });


/**
 * Initializes the weapon selection UI.
 * This function is primarily for conceptual setup as drawing is done on canvas.
 * In a more complex setup, this might set up event listeners or initial state.
 */
export function initWeaponSelectionUI() {
    console.log("Weapon selection UI initialized.");
    // Ensure 'hands' is always the first unlocked weapon by default
    // This is a good place to initialize `unlockedWeapons` if it's not done elsewhere.
    // However, `updateWeaponSelectionUI` will typically manage this based on game state.
}

/**
 * Updates the data displayed by the weapon selection UI.
 * This function should be called by your game logic whenever the player's
 * unlocked weapons or equipped weapon changes (e.g., after aging up, picking up a new weapon).
 * @param {string[]} newUnlockedWeapons - Array of weapon names the player has unlocked.
 * @param {string} newEquippedWeaponName - The name of the weapon currently equipped.
 */
export function updateWeaponSelectionUI(newUnlockedWeapons, newEquippedWeaponName) {
    unlockedWeapons = newUnlockedWeapons;
    equippedWeaponName = newEquippedWeaponName;
    console.log("Weapon selection UI updated. Unlocked:", unlockedWeapons, "Equipped:", equippedWeaponName);
}

/**
 * Draws the weapon selection bar on the canvas.
 * This function should be called in your main game loop every frame.
 * The UI will only be drawn if the player has more than just 'hands' unlocked.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {HTMLCanvasElement} canvas - The canvas element itself.
 */
export function drawWeaponSelectionUI(ctx, canvas) {
    // Only show the UI if there's more than one weapon unlocked (i.e., more than just 'hands')
    if (unlockedWeapons.length <= 1) {
        return;
    }

    // Calculate the total width of the weapon bar based on the number of unlocked weapons.
    const totalWidth = unlockedWeapons.length * SLOT_SIZE + (unlockedWeapons.length - 1) * SLOT_SPACING;
    // Center the weapon bar horizontally on the canvas.
    const startX = (canvas.width / 2) - (totalWidth / 2);
    // Position the weapon bar from the top edge of the canvas.
    const startY = PADDING_Y;

    // Draw background for the entire bar
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.beginPath(); // Start a new path for the background
    ctx.roundRect(startX - PADDING_X / 2, startY - PADDING_Y / 2, totalWidth + PADDING_X, SLOT_SIZE + PADDING_Y, 10);
    ctx.fill();

    // Iterate over each unlocked weapon to draw its slot.
    unlockedWeapons.forEach((weaponName, index) => {
        const slotX = startX + index * (SLOT_SIZE + SLOT_SPACING);
        const slotY = startY;

        ctx.save(); // Save the current canvas state (e.g., fillStyle, strokeStyle, font)

        // Draw slot background
        ctx.fillStyle = INACTIVE_SLOT_COLOR;
        ctx.beginPath(); // Start a new path for the slot
        ctx.roundRect(slotX, slotY, SLOT_SIZE, SLOT_SIZE, 5);
        ctx.fill();

        // Draw slot border (active or inactive)
        if (weaponName === equippedWeaponName) {
            ctx.strokeStyle = ACTIVE_BORDER_COLOR;
            ctx.lineWidth = 3; // Thicker border for the currently equipped weapon
        } else {
            ctx.strokeStyle = BORDER_COLOR;
            ctx.lineWidth = 2;
        }
        ctx.stroke(); // Apply the stroke to the slot path

        // Draw weapon icon/text
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = `${FONT_SIZE}px Arial`;
        ctx.textAlign = "center"; // Center the text horizontally
        ctx.textBaseline = "middle"; // Center the text vertically

        // Use the first word of the weapon name for display (e.g., "Assault Rifle" becomes "Assault")
        const weaponDisplayName = weaponName.split(' ')[0];
        ctx.fillText(weaponDisplayName, slotX + SLOT_SIZE / 2, slotY + SLOT_SIZE / 2);

        // Draw key label (1, 2, 3...) in the top-left corner of the slot
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = `bold ${KEY_LABEL_FONT_SIZE}px Arial`;
        ctx.textAlign = "left"; // Align key label to the left
        ctx.textBaseline = "top"; // Align key label to the top
        ctx.fillText(String(index + 1), slotX + 5, slotY + 5); // Position key in top-left corner with padding

        ctx.restore(); // Restore the canvas state to what it was before drawing this slot
    });
}

/**
 * Handles clicks on the canvas to select a weapon from the hotbar.
 * This function should be attached as an event listener to your canvas for 'click' events.
 * It checks if the click occurred within any weapon slot and emits an 'equip-weapon' event if so.
 * @param {MouseEvent} event - The mouse click event object.
 * @param {object} player - The local player object (to check if player is dead or valid).
 * @param {SocketIO.Socket} socket - The Socket.IO client instance for sending equip events.
 * @returns {boolean} True if a weapon slot was clicked and handled, false otherwise.
 */
export function handleWeaponSelectionClick(event, player, socket) {
    // Don't process clicks if the player is dead or if there's only one weapon (no UI shown).
    if (!player || player.isDead || unlockedWeapons.length <= 1) {
        return false;
    }

    const canvas = event.target;
    // Get the size and position of the canvas relative to the viewport.
    const rect = canvas.getBoundingClientRect();
    // Calculate mouse coordinates relative to the canvas.
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Recalculate bar position to match drawing logic.
    const totalWidth = unlockedWeapons.length * SLOT_SIZE + (unlockedWeapons.length - 1) * SLOT_SPACING;
    const startX = (canvas.width / 2) - (totalWidth / 2);
    const startY = PADDING_Y;

    // Loop through each weapon slot to check for a click.
    for (let i = 0; i < unlockedWeapons.length; i++) {
        const slotX = startX + i * (SLOT_SIZE + SLOT_SPACING);
        const slotY = startY;

        // Check if the mouse click is within the bounds of the current slot.
        if (mouseX >= slotX && mouseX <= slotX + SLOT_SIZE &&
            mouseY >= slotY && mouseY <= slotY + SLOT_SIZE) {

            const selectedWeapon = unlockedWeapons[i];
            // Only attempt to equip the weapon if it's not already the equipped one.
            if (selectedWeapon !== equippedWeaponName) {
                console.log(`Attempting to equip: ${selectedWeapon}`);
                // Emit a Socket.IO event to the server to equip the selected weapon.
                socket.emit('equip-weapon', { weaponName: selectedWeapon });
            }
            return true; // A weapon slot was clicked, so the event is handled.
        }
    }
    return false; // No weapon slot was clicked.
}
