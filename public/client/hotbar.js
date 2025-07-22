// hotbar.js - Manages and renders the in-game hotbar

// --- Hotbar State ---
const NUM_SLOTS = 9; // Fixed number of hotbar slots
let hotbar = Array(NUM_SLOTS).fill(null); // Initialize all slots as empty
let activeSlotIndex = 0; // The currently selected slot (0-indexed)

// --- Hotbar Visual Constants (Client-Side) ---
const HOTBAR_SLOT_SIZE = 60; // Size of each square hotbar slot
const HOTBAR_PADDING = 10; // Padding around the hotbar
const HOTBAR_SPACING = 5; // Spacing between slots
const HOTBAR_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent black
const HOTBAR_BORDER_COLOR = '#444'; // Dark gray border
const HOTBAR_ACTIVE_BORDER_COLOR = '#FFFF00'; // Yellow for active slot
const HOTBAR_BORDER_WIDTH = 2; // Border width for slots
const HOTBAR_ACTIVE_BORDER_WIDTH = 4; // Thicker border for active slot
const HOTBAR_KEY_FONT_SIZE = 16;
const HOTBAR_KEY_COLOR = 'white';
const HOTBAR_ITEM_TEXT_COLOR = 'white'; // For item quantity/name
const HOTBAR_ITEM_FONT_SIZE = 14;

// Placeholder icons for demonstration. In a real game, these would be actual image paths.
const PLACEHOLDER_ICONS = {
    'axe': '⛏️', // Pickaxe emoji as a placeholder for an axe
    'wood_wall': '🧱', // Brick wall emoji
    'food_ration': '🍖', // Meat bone emoji
    'sword': '⚔️' // Crossed swords emoji
};

/**
 * Initializes the hotbar with some example items.
 * In a real game, items would be added dynamically.
 */
export function initHotbar() {
    // Add some example items to the hotbar for testing
    addItemToHotbar({ id: 'axe1', type: 'axe', iconSrc: 'axe', name: 'Stone Axe', quantity: 1 });
    addItemToHotbar({ id: 'wall1', type: 'wood_wall', iconSrc: 'wood_wall', name: 'Wood Wall', quantity: 5 });
    addItemToHotbar({ id: 'food1', type: 'food_ration', iconSrc: 'food_ration', name: 'Ration', quantity: 10 });
    addItemToHotbar({ id: 'sword1', type: 'sword', iconSrc: 'sword', name: 'Iron Sword', quantity: 1 });

    console.log("Hotbar initialized:", hotbar);
}

/**
 * Draws the hotbar on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 */
export function drawHotbar(ctx, canvas) {
    const totalHotbarWidth = (HOTBAR_SLOT_SIZE * NUM_SLOTS) + (HOTBAR_SPACING * (NUM_SLOTS - 1));
    const startX = (canvas.width / 2) - (totalHotbarWidth / 2);
    const startY = canvas.height - HOTBAR_SLOT_SIZE - HOTBAR_PADDING;

    for (let i = 0; i < NUM_SLOTS; i++) {
        const slotX = startX + (i * (HOTBAR_SLOT_SIZE + HOTBAR_SPACING));
        const slotY = startY;

        const isCurrentActive = (i === activeSlotIndex);
        const item = hotbar[i];

        // Draw slot background
        ctx.fillStyle = HOTBAR_BACKGROUND_COLOR;
        ctx.fillRect(slotX, slotY, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE);

        // Draw slot border
        ctx.strokeStyle = isCurrentActive ? HOTBAR_ACTIVE_BORDER_COLOR : HOTBAR_BORDER_COLOR;
        ctx.lineWidth = isCurrentActive ? HOTBAR_ACTIVE_BORDER_WIDTH : HOTBAR_BORDER_WIDTH;
        ctx.strokeRect(slotX, slotY, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE);

        if (item) {
            // Draw item icon (using emoji for now)
            ctx.font = `${HOTBAR_SLOT_SIZE * 0.7}px Arial`; // Make emoji large
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white'; // Emojis usually ignore fillStyle, but good practice
            ctx.fillText(PLACEHOLDER_ICONS[item.iconSrc] || '❓', slotX + HOTBAR_SLOT_SIZE / 2, slotY + HOTBAR_SLOT_SIZE / 2);

            // Draw item quantity (if applicable)
            if (item.quantity !== undefined && item.quantity > 1) {
                ctx.font = `${HOTBAR_ITEM_FONT_SIZE}px Arial`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillStyle = HOTBAR_ITEM_TEXT_COLOR;
                ctx.fillText(item.quantity, slotX + HOTBAR_SLOT_SIZE - 5, slotY + HOTBAR_SLOT_SIZE - 5);
            }
        }

        // Draw key label (1-9)
        ctx.font = `${HOTBAR_KEY_FONT_SIZE}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = HOTBAR_KEY_COLOR;
        ctx.fillText(`${i + 1}`, slotX + 5, slotY + 5);
    }
}

/**
 * Handles keyboard input for hotbar selection.
 * @param {KeyboardEvent} e - The keyboard event.
 */
export function handleHotbarInput(e) {
    const key = e.key;
    const numKey = parseInt(key, 10);

    if (numKey >= 1 && numKey <= NUM_SLOTS) {
        // Set active slot based on 1-indexed number key
        activeSlotIndex = numKey - 1;
        console.log(`Hotbar: Selected slot ${activeSlotIndex + 1}`);
        // Prevent default browser behavior for number keys if needed
        e.preventDefault();
    }
}

/**
 * Adds an item to the first available slot in the hotbar.
 * If the item is stackable and already exists, it updates quantity.
 * @param {object} item - The item object to add (e.g., { id: 'axe1', type: 'axe', iconSrc: 'axe', name: 'Stone Axe', quantity: 1 }).
 * @returns {boolean} True if item was added/stacked, false otherwise (hotbar full).
 */
export function addItemToHotbar(item) {
    if (!item || !item.type) {
        console.warn("Attempted to add invalid item to hotbar:", item);
        return false;
    }

    // Check for stackable items (simple example: if type matches and quantity exists)
    for (let i = 0; i < NUM_SLOTS; i++) {
        const existingItem = hotbar[i];
        if (existingItem && existingItem.type === item.type && typeof existingItem.quantity === 'number' && typeof item.quantity === 'number') {
            existingItem.quantity += item.quantity;
            console.log(`Hotbar: Stacked ${item.quantity} of ${item.name}. New quantity: ${existingItem.quantity}`);
            return true;
        }
    }

    // Find the first empty slot
    const emptySlotIndex = hotbar.indexOf(null);
    if (emptySlotIndex !== -1) {
        hotbar[emptySlotIndex] = { ...item }; // Add a copy of the item
        console.log(`Hotbar: Added ${item.name} to slot ${emptySlotIndex + 1}`);
        return true;
    } else {
        console.warn("Hotbar is full! Cannot add item:", item);
        return false;
    }
}

/**
 * Returns the item currently equipped (selected in the active slot).
 * @returns {object|null} The active item object, or null if the slot is empty.
 */
export function getActiveItem() {
    return hotbar[activeSlotIndex];
}

/**
 * Removes a specified quantity of the active item from the hotbar.
 * If quantity goes to 0 or less, the slot becomes null.
 * @param {number} quantityToRemove - The amount to remove. Defaults to 1.
 * @returns {boolean} True if item was removed, false otherwise (not enough quantity).
 */
export function removeActiveItem(quantityToRemove = 1) {
    const item = hotbar[activeSlotIndex];
    if (item && typeof item.quantity === 'number') {
        if (item.quantity >= quantityToRemove) {
            item.quantity -= quantityToRemove;
            if (item.quantity <= 0) {
                hotbar[activeSlotIndex] = null; // Clear slot if quantity is zero or less
                console.log(`Hotbar: Removed ${item.name} from slot ${activeSlotIndex + 1}. Slot now empty.`);
            } else {
                console.log(`Hotbar: Removed ${quantityToRemove} of ${item.name}. New quantity: ${item.quantity}`);
            }
            return true;
        } else {
            console.warn(`Hotbar: Not enough ${item.name} to remove ${quantityToRemove}. Current: ${item.quantity}`);
            return false;
        }
    } else if (item) {
        // Item exists but has no quantity property, remove it entirely
        hotbar[activeSlotIndex] = null;
        console.log(`Hotbar: Removed non-stackable item ${item.name} from slot ${activeSlotIndex + 1}.`);
        return true;
    }
    console.warn("Hotbar: No item in active slot to remove.");
    return false;
}
