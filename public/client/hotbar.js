// hotbar.js - Manages and renders the in-game hotbar

// --- Hotbar State ---
const NUM_SLOTS = 9; // Fixed number of hotbar slots
let hotbar = Array(NUM_SLOTS).fill(null); // Initialize all slots as empty
let activeSlotIndex = 0; // The currently selected slot (0-indexed)

// --- Hotbar Visual Constants (Client-Side) ---
const HOTBAR_SLOT_SIZE = 60;
const HOTBAR_PADDING = 10;
const HOTBAR_SPACING = 5;
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
    'wood_wall': '🧱',
    'food_ration': '🍖',
    'sword': '⚔️'
};

// Load 'Press Start 2P' font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

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

export function initHotbar() {
    addItemToHotbar({ id: 'axe1', type: 'axe', iconSrc: 'axe', name: 'Stone Axe', quantity: 1 });
    addItemToHotbar({ id: 'wall1', type: 'wood_wall', iconSrc: 'wood_wall', name: 'Wood Wall', quantity: 5 });
    addItemToHotbar({ id: 'food1', type: 'food_ration', iconSrc: 'food_ration', name: 'Ration', quantity: 10 });
    addItemToHotbar({ id: 'sword1', type: 'sword', iconSrc: 'sword', name: 'Iron Sword', quantity: 1 });
    console.log("Hotbar initialized:", hotbar);
}

export function drawHotbar(ctx, canvas) {
    const visibleSlots = hotbar.map((item, index) => item ? index : null).filter(i => i !== null);
    const numVisible = visibleSlots.length;
    if (numVisible === 0) return;

    const totalWidth = numVisible * HOTBAR_SLOT_SIZE + (numVisible - 1) * HOTBAR_SPACING;
    const startX = (canvas.width / 2) - (totalWidth / 2);
    const startY = canvas.height - HOTBAR_SLOT_SIZE - HOTBAR_PADDING;

    visibleSlots.forEach((i, visibleIndex) => {
        const slotX = startX + (visibleIndex * (HOTBAR_SLOT_SIZE + HOTBAR_SPACING));
        const slotY = startY;
        const item = hotbar[i];
        const isCurrentActive = (i === activeSlotIndex);

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = HOTBAR_BACKGROUND_COLOR;
        ctx.strokeStyle = isCurrentActive ? HOTBAR_ACTIVE_BORDER_COLOR : HOTBAR_BORDER_COLOR;
        ctx.lineWidth = isCurrentActive ? HOTBAR_ACTIVE_BORDER_WIDTH : HOTBAR_BORDER_WIDTH;

        ctx.beginPath();
        ctx.roundRect(slotX, slotY, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${HOTBAR_SLOT_SIZE * 0.5}px 'Press Start 2P'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(PLACEHOLDER_ICONS[item.iconSrc] || '❓', slotX + HOTBAR_SLOT_SIZE / 2, slotY + HOTBAR_SLOT_SIZE / 2);

        if (item.quantity > 1) {
            ctx.font = `${HOTBAR_ITEM_FONT_SIZE}px 'Press Start 2P'`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = HOTBAR_ITEM_TEXT_COLOR;
            ctx.fillText(item.quantity, slotX + HOTBAR_SLOT_SIZE - 4, slotY + HOTBAR_SLOT_SIZE - 4);
        }

        ctx.font = `${HOTBAR_KEY_FONT_SIZE}px 'Press Start 2P'`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = HOTBAR_KEY_COLOR;
        ctx.fillText(`${i + 1}`, slotX + 4, slotY + 4);
        ctx.restore();
    });
}

export function handleHotbarInput(e) {
    if (document.activeElement.tagName === 'INPUT') return;
    const key = e.key;
    const numKey = parseInt(key, 10);
    if (numKey >= 1 && numKey <= NUM_SLOTS) {
        activeSlotIndex = numKey - 1;
        e.preventDefault();
    }
}

export function addItemToHotbar(item) {
    if (!item || !item.type) return false;
    for (let i = 0; i < NUM_SLOTS; i++) {
        const existingItem = hotbar[i];
        if (existingItem && existingItem.type === item.type && typeof existingItem.quantity === 'number') {
            existingItem.quantity += item.quantity;
            return true;
        }
    }
    const emptyIndex = hotbar.indexOf(null);
    if (emptyIndex !== -1) {
        hotbar[emptyIndex] = { ...item };
        return true;
    }
    return false;
}

export function getActiveItem() {
    return hotbar[activeSlotIndex];
}

export function removeActiveItem(quantityToRemove = 1) {
    const item = hotbar[activeSlotIndex];
    if (!item) return false;
    if (typeof item.quantity === 'number') {
        if (item.quantity >= quantityToRemove) {
            item.quantity -= quantityToRemove;
            if (item.quantity <= 0) hotbar[activeSlotIndex] = null;
            return true;
        }
        return false;
    }
    hotbar[activeSlotIndex] = null;
    return true;
}

// Add roundRect for canvas context if not available
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
