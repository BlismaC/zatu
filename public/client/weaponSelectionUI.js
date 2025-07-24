// weaponSelectionUI.js - Manages the UI and logic for selecting unlocked weapons.

// Import necessary constants from main.js (for drawing)
// You might need to adjust imports if weapon names become images or more complex
import {
    playerFillColor, playerOutlineColor, playerOutlineWidth // For weapon box styling consistency
} from './main.js';

// Import weapon properties to get weapon details
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
let unlockedWeapons = [];
let equippedWeaponName = 'hands'; // Default to hands

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
 * This is primarily for conceptual setup as drawing is done on canvas.
 */
export function initWeaponSelectionUI() {
    console.log("Weapon selection UI initialized.");
}

/**
 * Updates the data displayed by the weapon selection UI.
 * @param {string[]} newUnlockedWeapons - Array of weapon names the player has unlocked.
 * @param {string} newEquippedWeaponName - The name of the weapon currently equipped.
 */
export function updateWeaponSelectionUI(newUnlockedWeapons, newEquippedWeaponName) {
    unlockedWeapons = newUnlockedWeapons;
    equippedWeaponName = newEquippedWeaponName;
}

/**
 * Draws the weapon selection bar on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 */
export function drawWeaponSelectionUI(ctx, canvas) {
    if (unlockedWeapons.length <= 1) { // Only show if more than just 'hands' are unlocked
        return;
    }

    const totalWidth = unlockedWeapons.length * SLOT_SIZE + (unlockedWeapons.length - 1) * SLOT_SPACING;
    const startX = (canvas.width / 2) - (totalWidth / 2);
    const startY = PADDING_Y;

    // Draw background for the entire bar
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.roundRect(startX - PADDING_X / 2, startY - PADDING_Y / 2, totalWidth + PADDING_X, SLOT_SIZE + PADDING_Y, 10);
    ctx.fill();

    unlockedWeapons.forEach((weaponName, index) => {
        const slotX = startX + index * (SLOT_SIZE + SLOT_SPACING);
        const slotY = startY;

        ctx.save(); // Save context state before drawing individual slot

        // Draw slot background
        ctx.fillStyle = INACTIVE_SLOT_COLOR;
        ctx.beginPath();
        ctx.roundRect(slotX, slotY, SLOT_SIZE, SLOT_SIZE, 5);
        ctx.fill();

        // Draw slot border (active or inactive)
        if (weaponName === equippedWeaponName) {
            ctx.strokeStyle = ACTIVE_BORDER_COLOR;
            ctx.lineWidth = 3; // Thicker border for active slot
        } else {
            ctx.strokeStyle = BORDER_COLOR;
            ctx.lineWidth = 2;
        }
        ctx.stroke();

        // Draw weapon icon/text
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = `${FONT_SIZE}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const weaponDisplayName = weaponName.split(' ')[0]; // Use first word for display
        ctx.fillText(weaponDisplayName, slotX + SLOT_SIZE / 2, slotY + SLOT_SIZE / 2);

        // Draw key label (1, 2, 3...)
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = `bold ${KEY_LABEL_FONT_SIZE}px Arial`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(String(index + 1), slotX + 5, slotY + 5); // Position key in top-left corner

        ctx.restore(); // Restore context state
    });
}

/**
 * Handles clicks on the canvas to select a weapon from the hotbar.
 * @param {MouseEvent} event - The mouse click event.
 * @param {object} player - The local player object (to get equippedWeapon, age etc.).
 * @param {SocketIO.Socket} socket - The Socket.IO client instance.
 * @returns {boolean} True if a weapon slot was clicked, false otherwise.
 */
export function handleWeaponSelectionClick(event, player, socket) {
    if (!player || player.isDead || unlockedWeapons.length <= 1) {
        return false;
    }

    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const totalWidth = unlockedWeapons.length * SLOT_SIZE + (unlockedWeapons.length - 1) * SLOT_SPACING;
    const startX = (canvas.width / 2) - (totalWidth / 2);
    const startY = PADDING_Y;

    for (let i = 0; i < unlockedWeapons.length; i++) {
        const slotX = startX + i * (SLOT_SIZE + SLOT_SPACING);
        const slotY = startY;

        // Check if click is within this slot's bounds
        if (mouseX >= slotX && mouseX <= slotX + SLOT_SIZE &&
            mouseY >= slotY && mouseY <= slotY + SLOT_SIZE) {
            
            const selectedWeapon = unlockedWeapons[i];
            // Only equip if it's not already equipped
            if (selectedWeapon !== equippedWeaponName) {
                console.log(`Attempting to equip: ${selectedWeapon}`);
                socket.emit('equip-weapon', { weaponName: selectedWeapon });
            }
            return true; // Click handled
        }
    }
    return false; // No weapon slot clicked
}
