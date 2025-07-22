// --- Hotbar State ---
const NUM_SLOTS = 9;
let hotbar = Array(NUM_SLOTS).fill(null);
let activeSlotIndex = 0;

// --- Hotbar Visual Constants ---
const HOTBAR_SLOT_SIZE = 60;
const HOTBAR_PADDING = 10;
const HOTBAR_SPACING = 5;
const HOTBAR_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.6)';
const HOTBAR_BORDER_COLOR = 'rgba(0, 0, 0, 0.6)';
const HOTBAR_ACTIVE_BORDER_COLOR = 'white';
const HOTBAR_BORDER_WIDTH = 2;
const HOTBAR_ACTIVE_BORDER_WIDTH = 4;
const HOTBAR_KEY_FONT_SIZE = 12;
const HOTBAR_KEY_COLOR = 'white';
const HOTBAR_ITEM_TEXT_COLOR = 'white';
const HOTBAR_ITEM_FONT_SIZE = 12;
const HOTBAR_FONT_FAMILY = '"Press Start 2P", monospace';

const PLACEHOLDER_ICONS = {
  'axe': '⛏️',
  'wood_wall': '🧱',
  'food_ration': '🍖',
  'sword': '⚔️'
};

export function initHotbar() {
  addItemToHotbar({ id: 'axe1', type: 'axe', iconSrc: 'axe', name: 'Stone Axe', quantity: 1 });
  addItemToHotbar({ id: 'wall1', type: 'wood_wall', iconSrc: 'wood_wall', name: 'Wood Wall', quantity: 5 });
  addItemToHotbar({ id: 'food1', type: 'food_ration', iconSrc: 'food_ration', name: 'Ration', quantity: 10 });
  addItemToHotbar({ id: 'sword1', type: 'sword', iconSrc: 'sword', name: 'Iron Sword', quantity: 1 });

  console.log("Hotbar initialized:", hotbar);
}

export function drawHotbar(ctx, canvas) {
  const totalWidth = (HOTBAR_SLOT_SIZE * NUM_SLOTS) + (HOTBAR_SPACING * (NUM_SLOTS - 1));
  const startX = (canvas.width / 2) - (totalWidth / 2);
  const startY = canvas.height - HOTBAR_SLOT_SIZE - HOTBAR_PADDING;

  for (let i = 0; i < NUM_SLOTS; i++) {
    const x = startX + i * (HOTBAR_SLOT_SIZE + HOTBAR_SPACING);
    const y = startY;
    const item = hotbar[i];
    const isActive = i === activeSlotIndex;

    // Draw slot background with smooth animation
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = HOTBAR_BACKGROUND_COLOR;
    ctx.fillRect(x, y, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE);
    ctx.restore();

    // Border with transition effect
    ctx.save();
    ctx.strokeStyle = isActive ? HOTBAR_ACTIVE_BORDER_COLOR : HOTBAR_BORDER_COLOR;
    ctx.lineWidth = isActive ? HOTBAR_ACTIVE_BORDER_WIDTH : HOTBAR_BORDER_WIDTH;
    ctx.strokeRect(x, y, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE);
    ctx.restore();

    // Item icon
    if (item) {
      ctx.save();
      ctx.font = `${HOTBAR_SLOT_SIZE * 0.6}px ${HOTBAR_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(PLACEHOLDER_ICONS[item.iconSrc] || '❓', x + HOTBAR_SLOT_SIZE / 2, y + HOTBAR_SLOT_SIZE / 2);
      ctx.restore();

      if (item.quantity > 1) {
        ctx.save();
        ctx.font = `${HOTBAR_ITEM_FONT_SIZE}px ${HOTBAR_FONT_FAMILY}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = HOTBAR_ITEM_TEXT_COLOR;
        ctx.fillText(item.quantity, x + HOTBAR_SLOT_SIZE - 5, y + HOTBAR_SLOT_SIZE - 5);
        ctx.restore();
      }
    }

    // Key label
    ctx.save();
    ctx.font = `${HOTBAR_KEY_FONT_SIZE}px ${HOTBAR_FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = HOTBAR_KEY_COLOR;
    ctx.fillText(i + 1, x + 4, y + 4);
    ctx.restore();
  }
}

export function handleHotbarInput(e) {
  if (document.activeElement.tagName === 'INPUT') return;
  const numKey = parseInt(e.key, 10);
  if (!isNaN(numKey) && numKey >= 1 && numKey <= NUM_SLOTS) {
    activeSlotIndex = numKey - 1;
    e.preventDefault();
    console.log(`Hotbar: selected slot ${activeSlotIndex + 1}`);
  }
}

export function addItemToHotbar(item) {
  for (let i = 0; i < NUM_SLOTS; i++) {
    const slot = hotbar[i];
    if (slot && slot.type === item.type && typeof slot.quantity === 'number') {
      slot.quantity += item.quantity;
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

export function removeActiveItem(qty = 1) {
  const item = hotbar[activeSlotIndex];
  if (!item) return false;

  if (typeof item.quantity === 'number') {
    item.quantity -= qty;
    if (item.quantity <= 0) hotbar[activeSlotIndex] = null;
  } else {
    hotbar[activeSlotIndex] = null;
  }

  return true;
}
