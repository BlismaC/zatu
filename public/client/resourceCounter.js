// --- Imports from main.js (Constants for UI positioning and resource types) ---
import {
    RESOURCE_TYPES,
    RESOURCE_OUTLINE_COLOR, RESOURCE_OUTLINE_WIDTH // Needed for drawing resource sprites as icons
} from './main.js';

// --- Imports from resourceDesigns.js (Resource Sprite Generation) ---
import { getResSprite } from './resourceDesigns.js';

// --- Imports from utils.js for rendering new food icon (renderCircle, renderLeaf) ---
import { renderCircle, renderLeaf } from './utils.js'; // Keeping for general use if needed by custom icons

// --- Resource Counter Specific Constants ---
const COUNTER_FONT_SIZE = 40; // Bigger text
const COUNTER_ICON_SIZE = 40; // Bigger icons
const COUNTER_TEXT_COLOR = "white"; // White text for better contrast on darker background
const COUNTER_BACKGROUND_COLOR = "rgba(30,30,30,0.5)"; // Slightly darker gray with lower opacity
const COUNTER_BORDER_RADIUS = 0; // Square boxes

const ITEM_BOX_VERTICAL_PADDING = 0;  // Reduced padding to make the box much shorter (height equals icon/font size)
const ITEM_BOX_HORIZONTAL_PADDING = 5; // Reduced horizontal padding to make the box less 'long'
const ITEM_BOX_SPACING = 25;           // Increased space between individual resource boxes

const ICON_MARGIN_LEFT = 8; // Space between number and icon

// Cache for generated icon sprites to improve performance
const iconSpriteCache = {};

// Helper to get or create a cached icon sprite from resourceDesigns
// This ensures we draw the actual in-game sprites for wood/stone, scaled down
function getCachedIconSprite(resourceType, size, outlineColor, outlineWidth) {
    const cacheKey = `icon_${resourceType}_${size}_${outlineColor}_${outlineWidth}`;
    if (!iconSpriteCache[cacheKey]) {
        // getResSprite expects an object with a 'type' property
        const dummyResourceObj = { type: resourceType };
        // Pass the desired icon size as resourceDrawSize for the sprite generation
        // getResSprite handles centering and scaling the internal drawing.
        iconSpriteCache[cacheKey] = getResSprite(dummyResourceObj, size, outlineColor, outlineWidth);
    }
    return iconSpriteCache[cacheKey];
}

// Function to draw a tree icon (uses the actual tree sprite from resourceDesigns)
function drawTreeIcon(ctx, x, y, size) {
    const sprite = getCachedIconSprite(RESOURCE_TYPES.WOOD, size, RESOURCE_OUTLINE_COLOR, RESOURCE_OUTLINE_WIDTH / 2);
    if (sprite) {
        // drawImage will scale the cached sprite (which is already sized for 'size' by getResSprite)
        // so it fills the 'size' square at x,y.
        ctx.drawImage(sprite, x, y, size, size);
    }
}

// Function to draw a stone icon (uses the actual stone sprite from resourceDesigns)
function drawStoneIcon(ctx, x, y, size) {
    const sprite = getCachedIconSprite(RESOURCE_TYPES.STONE, size, RESOURCE_OUTLINE_COLOR, RESOURCE_OUTLINE_WIDTH / 2);
    if (sprite) {
        ctx.drawImage(sprite, x, y, size, size);
    }
}

// Function to draw an apple icon (re-implementing user's original logic)
function drawAppleIcon(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2); // Center drawing relative to x,y
    ctx.scale(size / 40, size / 40); // Scale to fit desired size (concept scaled for 40x40)

    // Apple body
    ctx.fillStyle = '#c15555'; // Red apple color
    ctx.strokeStyle = 'black'; // Add stroke for better definition
    ctx.lineWidth = 2; // Default line width for definition

    renderCircle(0, 0, 15, ctx); // Base radius for apple

    // Leaf
    ctx.fillStyle = '#89a54c'; // Green leaf color
    ctx.strokeStyle = 'black'; // Add stroke for leaf
    let leafDir = -(Math.PI / 2); // Pointing upwards relative to apple center
    // Adjust leaf position and length relative to the scaled apple
    renderLeaf(15 * Math.cos(leafDir), 15 * Math.sin(leafDir), 15, leafDir + Math.PI / 2, ctx); // Leaf length and position adjusted

    ctx.restore();
}

// Function to draw a gold icon (uses the actual gold sprite from resourceDesigns)
function drawGoldIcon(ctx, x, y, size) {
    const sprite = getCachedIconSprite(RESOURCE_TYPES.GOLD, size, RESOURCE_OUTLINE_COLOR, RESOURCE_OUTLINE_WIDTH / 2);
    if (sprite) {
        ctx.drawImage(sprite, x, y, size, size);
    }
}


// Function to draw the resource counter UI
export function drawResourceCounter(ctx, canvas, me) {
    if (!me || !me.inventory) return;

    const inventory = me.inventory;
    const resourcesToDisplay = [
        { type: RESOURCE_TYPES.WOOD, iconDraw: drawTreeIcon },
        { type: RESOURCE_TYPES.STONE, iconDraw: drawStoneIcon },
        { type: RESOURCE_TYPES.FOOD, iconDraw: drawAppleIcon } // Use apple icon for food
        // Removed gold from here as it's now displayed separately in HTML
    ];

    // Configure text style once
    ctx.font = `${COUNTER_FONT_SIZE}px Arial`;
    ctx.textBaseline = "middle";

    // Determine the common width needed for each individual resource box
    let maxContentWidth = 0;
    resourcesToDisplay.forEach(res => {
        const testValue = "9999"; // Placeholder for max possible digits (e.g., 4 digits)
        const textWidth = ctx.measureText(testValue).width;
        maxContentWidth = Math.max(maxContentWidth, textWidth + ICON_MARGIN_LEFT + COUNTER_ICON_SIZE);
    });
    // This calculation makes the box wider only as needed by the content.
    // The ITEM_BOX_HORIZONTAL_PADDING directly controls the padding on the sides.
    const commonBoxWidth = maxContentWidth + 2 * ITEM_BOX_HORIZONTAL_PADDING;

    // Calculate height for each individual box
    // With ITEM_BOX_VERTICAL_PADDING = 0, height is effectively just COUNTER_ICON_SIZE
    const individualBoxHeight = COUNTER_ICON_SIZE + 2 * ITEM_BOX_VERTICAL_PADDING;
    const itemBoxGap = individualBoxHeight + ITEM_BOX_SPACING; // Height of box + spacing to next one

    // Calculate the total height of the block of resource boxes
    const totalBlockHeight = resourcesToDisplay.length * itemBoxGap - ITEM_BOX_SPACING;

    // Determine the starting Y position for the entire block of resource boxes
    const blockX = canvas.width - commonBoxWidth - ITEM_BOX_HORIZONTAL_PADDING; // Right-aligned overall
    let currentBoxY = canvas.height - totalBlockHeight - ITEM_BOX_HORIZONTAL_PADDING; // Start from bottom of screen

    // Draw each resource item in its own box, from bottom to top
    // Iterate in reverse to naturally draw from bottom-up visually
    for (let i = resourcesToDisplay.length - 1; i >= 0; i--) {
        const res = resourcesToDisplay[i]; // Corrected to use resourcesToDisplay
        const valueText = `${Math.floor(inventory[res.type])}`; // Get the number only

        // Draw individual box background
        ctx.fillStyle = COUNTER_BACKGROUND_COLOR;
        ctx.beginPath();
        // Use fillRect for perfect squares/rectangles, as border radius is 0
        ctx.fillRect(blockX, currentBoxY, commonBoxWidth, individualBoxHeight);
        ctx.fill();

        // Calculate positions of text and icon within this specific box
        const textWidthForThisItem = ctx.measureText(valueText).width;
        
        // Icon is fixed to the right side of the box (with horizontal padding from its own box edge)
        const iconX = blockX + commonBoxWidth - ITEM_BOX_HORIZONTAL_PADDING - COUNTER_ICON_SIZE;
        const iconY = currentBoxY + ITEM_BOX_VERTICAL_PADDING; // Align icon top with box top padding

        // Text is positioned to the left of the icon, respecting margin
        const textX = iconX - ICON_MARGIN_LEFT - textWidthForThisItem;
        const textY = currentBoxY + individualBoxHeight / 2; // Center text vertically within box

        // Draw the number
        ctx.fillStyle = COUNTER_TEXT_COLOR;
        ctx.textAlign = "left"; // Text will be left-aligned within its calculated starting X
        ctx.fillText(valueText, textX, textY);

        // Draw the specific icon
        res.iconDraw(ctx, iconX, iconY, COUNTER_ICON_SIZE);

        // Move up for the next box
        currentBoxY += itemBoxGap;
    }
}
