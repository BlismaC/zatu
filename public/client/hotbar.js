// hotbar.js - Manages and renders the in-game hotbar

// --- Hotbar State ---
const NUM_SLOTS = 9; // Fixed number of hotbar slots
export let hotbar = Array(NUM_SLOTS).fill(null); // Initialize all slots as empty
export let activeSlotIndex = 0; // Declared with let, can be modified within this module

// --- Hotbar Visual Constants (Client-Side) ---
export const HOTBAR_SLOT_SIZE = 60; // Exported for main.js click logic
export const HOTBAR_PADDING = 10; // Exported for main.js click logic
export const HOTBAR_SPACING = 5; // Exported for main.js click logic
const HOTBAR_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.4)';
const HOTBAR_BORDER_COLOR = 'rgba(255, 255, 255, 0.2)';
const HOTBAR_ACTIVE_BORDER_COLOR = '#fff700';
const HOTBAR_BORDER_WIDTH = 2;
const HOTBAR_ACTIVE_BORDER_WIDTH = 4;
const HOTBAR_KEY_FONT_SIZE = 12;
const HOTBAR_KEY_COLOR = 'white';
const HOTBAR_ITEM_TEXT_COLOR = 'white';
const HOTBAR_ITEM_FONT_SIZE = 12;

const PLACEHOLDER_ICONS = {
    'axe': '⛏️',
    'wood_wall': '�',
    'food_ration': '🍖',
    'sword': '⚔️',
    'hands': '✊', // Added placeholder for hands
    'bat': '⚾',
    'shield': '🛡️',
    'long sword': '🗡️',
    'gold': '💰', // Added placeholder for gold
    // Add more as needed for your weapons
    'spear': '🔱',
    'dagger': '🔪',
    'battle axe': '🪓',
    'trident': '🔱',
    'javelin': '🪡', // Close enough emoji
    'dual daggers': '🔪🔪',
    'throwing knife': '🗡️',
    'hammer': '🔨',
    'gloves': '🥊',
    'boomerang': '🪃',
    'spiked shield': '🛡️',
    'crossknife': '⚔️', // Re-using sword or throwing knife
    'war hammer': '🔨',
    'brass knuckles': '👊',
};

// Load 'Press Start 2P' font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Apply font globally to canvas text where possible
const applyFont = () => {
    const style = document.createElement('style');
    style.textContent = `
        canvas {
            font-family: 'Press Start 2P', monospace;
        }
    `;
    document.head.appendChild(style);
};
applyFont();

/**
 * Initializes the hotbar with some default items.
 */
export function initHotbar() {
    // You might want to remove these dummy items once your game dynamically adds them.
    addItemToHotbar({ id: 'fists', type: 'weapon', iconSrc: 'hands', name: 'hands', quantity: 1 });
    addItemToHotbar({ id: 'axe1', type: 'weapon', iconSrc: 'axe', name: 'axe', quantity: 1 });
    addItemToHotbar({ id: 'wall1', type: 'building', iconSrc: 'wood_wall', name: 'Wood Wall', quantity: 5 });
    addItemToHotbar({ id: 'food1', type: 'consumable', iconSrc: 'food_ration', name: 'Ration', quantity: 10 });
    addItemToHotbar({ id: 'sword1', type: 'weapon', iconSrc: 'sword', name: 'short sword', quantity: 1 });
    console.log("Hotbar initialized:", hotbar);
}

/**
 * Draws the hotbar on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {HTMLCanvasElement} canvas - The HTML canvas element.
 */
export function drawHotbar(ctx, canvas) {
    // Calculate total width and starting position to center the hotbar for all NUM_SLOTS
    const totalWidth = NUM_SLOTS * HOTBAR_SLOT_SIZE + (NUM_SLOTS - 1) * HOTBAR_SPACING;
    const startX = (canvas.width / 2) - (totalWidth / 2);
    const startY = canvas.height - HOTBAR_SLOT_SIZE - HOTBAR_PADDING;

    // Draw background for the entire bar
    ctx.fillStyle = HOTBAR_BACKGROUND_COLOR;
    ctx.beginPath();
    ctx.roundRect(startX - HOTBAR_PADDING, startY - HOTBAR_PADDING, totalWidth + HOTBAR_PADDING * 2, HOTBAR_SLOT_SIZE + HOTBAR_PADDING * 2, 10);
    ctx.fill();

    // Iterate over all slots (NUM_SLOTS) and draw each one
    for (let i = 0; i < NUM_SLOTS; i++) {
        const slotX = startX + (i * (HOTBAR_SLOT_SIZE + HOTBAR_SPACING));
        const slotY = startY;
        const item = hotbar[i];
        const isCurrentActive = (i === activeSlotIndex);

        ctx.save(); // Save the current drawing state

        // Apply general hotbar slot styling
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = HOTBAR_BACKGROUND_COLOR;
        ctx.strokeStyle = isCurrentActive ? HOTBAR_ACTIVE_BORDER_COLOR : HOTBAR_BORDER_COLOR;
        ctx.lineWidth = isCurrentActive ? HOTBAR_ACTIVE_BORDER_WIDTH : HOTBAR_BORDER_WIDTH;

        // Draw the rounded rectangle for the slot
        ctx.beginPath();
        ctx.roundRect(slotX, slotY, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE, 10);
        ctx.fill();
        ctx.stroke();

        if (item) { // Only draw item icon and quantity if slot is not empty
            // Draw item icon (emoji placeholder)
            ctx.font = `${HOTBAR_SLOT_SIZE * 0.5}px 'Press Start 2P'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(PLACEHOLDER_ICONS[item.iconSrc] || '❓', slotX + HOTBAR_SLOT_SIZE / 2, slotY + HOTBAR_SLOT_SIZE / 2);

            // Draw item quantity if greater than 1
            if (item.quantity > 1) {
                ctx.font = `${HOTBAR_ITEM_FONT_SIZE}px 'Press Start 2P'`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillStyle = HOTBAR_ITEM_TEXT_COLOR;
                ctx.fillText(item.quantity, slotX + HOTBAR_SLOT_SIZE - 4, slotY + HOTBAR_SLOT_SIZE - 4);
            }
        }

        // Draw slot number (1-9)
        ctx.font = `${HOTBAR_KEY_FONT_SIZE}px 'Press Start 2P'`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = HOTBAR_KEY_COLOR;
        ctx.fillText(`${i + 1}`, slotX + 4, slotY + 4);

        ctx.restore(); // Restore the previous drawing state
    }
}

/**
 * Handles keyboard input for hotbar selection.
 * @param {KeyboardEvent} e - The keyboard event.
 * @param {SocketIO.Socket} socket - The Socket.IO client instance.
 */
export function handleHotbarInput(e, socket) { // Added socket parameter
    // Prevent hotbar input if an input field is active
    if (document.activeElement.tagName === 'INPUT') return;
    const key = e.key;
    const numKey = parseInt(key, 10);
    // If a number key from 1 to NUM_SLOTS is pressed, set active slot
    if (!isNaN(numKey) && numKey >= 1 && numKey <= NUM_SLOTS) {
        const index = numKey - 1; // Convert 1-indexed key to 0-indexed array index
        
        // Only set active if the slot is not empty
        if (hotbar[index] !== null) {
            setActiveSlotIndex(index);
            const equippedItem = hotbar[index];
            if (equippedItem && equippedItem.name && socket) { // Ensure socket exists before emitting
                console.log(`Equipping ${equippedItem.name} via hotbar key ${numKey}`);
                socket.emit('equip-weapon', { weaponName: equippedItem.name });
            }
        }
        e.preventDefault(); // Prevent default browser behavior (e.g., scrolling)
    }
}

/**
 * Adds an item to the hotbar. If an item of the same type exists and has quantity,
 * it increments the quantity. Otherwise, it finds an empty slot.
 * @param {object} item - The item to add. Must have `id`, `type`, `iconSrc`, `name`, `quantity`.
 * @returns {boolean} True if the item was added, false otherwise.
 */
export function addItemToHotbar(item) {
    if (!item || !item.type) return false;

    // Try to stack with an existing item of the same type
    for (let i = 0; i < NUM_SLOTS; i++) {
        const existingItem = hotbar[i];
        // Stack only if it's the same type and has a quantity property
        if (existingItem && existingItem.type === item.type && typeof existingItem.quantity === 'number' && item.stackable !== false) {
            existingItem.quantity = (existingItem.quantity || 0) + (item.quantity || 1); // Increment quantity
            return true;
        }
    }

    // Find an empty slot if no stacking occurred
    const emptyIndex = hotbar.indexOf(null);
    if (emptyIndex !== -1) {
        hotbar[emptyIndex] = { ...item }; // Add a copy of the item
        return true;
    }
    return false; // No space or existing stackable item
}

/**
 * Returns the item currently in the active hotbar slot.
 * @returns {object|null} The active item object, or null if the slot is empty.
 */
export function getActiveItem() {
    return hotbar[activeSlotIndex];
}

/**
 * Removes a specified quantity from the active item. If quantity falls to 0 or less,
 * the slot becomes empty.
 * @param {number} quantityToRemove - The amount to remove. Defaults to 1.
 * @returns {boolean} True if items were removed, false otherwise (e.g., not enough quantity).
 */
export function removeActiveItem(quantityToRemove = 1) {
    const item = hotbar[activeSlotIndex];
    if (!item) return false; // No item in the active slot

    if (typeof item.quantity === 'number') {
        if (item.quantity >= quantityToRemove) {
            item.quantity -= quantityToRemove;
            if (item.quantity <= 0) {
                hotbar[activeSlotIndex] = null; // Clear slot if quantity is zero or less
            }
            return true;
        }
        return false; // Not enough quantity to remove
    }

    // If item has no quantity property (and not stackable), just remove it
    hotbar[activeSlotIndex] = null;
    return true;
}

/**
 * Sets the active hotbar slot index.
 * This function is exposed to allow other modules to change the active slot.
 * @param {number} index - The new active slot index.
 */
export function setActiveSlotIndex(index) {
    if (index >= 0 && index < NUM_SLOTS) {
        activeSlotIndex = index;
    } else {
        console.warn(`Attempted to set activeSlotIndex to out-of-bounds value: ${index}`);
    }
}

// Add roundRect for canvas context if not available (polyfill)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        if (typeof radius === 'number') radius = { tl: radius, tr: radius, br: radius, bl: radius };
        else radius = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, radius);
        this.beginPath();
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this;
    };
}
