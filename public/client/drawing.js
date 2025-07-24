// drawing.js - Handles all canvas drawing operations

// --- Imports from main.js (Constants and Global State Access) ---
import {
    worldWidth, worldHeight, MAX_HEALTH, PLAYER_SMOOTHING_FACTOR, TRAIL_LENGTH, TRAIL_MAX_ALPHA,
    playerBodyRadiusX, playerBodyRadiusY, handRadius, handSideOffset, handForwardOffset,
    SWING_DURATION, SWING_REACH, SWING_INWARD_AMOUNT,
    healthBarWidth, healthBarHeight, healthBarVerticalOffsetFromPlayerBottom, healthBarBorderRadius,
    fullHealthColor, lowHealthColor, healthBarBackgroundColor, healthBarOutlineColor, healthBarOutlineWidth,
    backgroundColor, worldBorderColor, gridColor, playerFillColor, playerOutlineColor, playerOutlineWidth,
    gridSize,
    RESOURCE_TYPES, // Keep RESOURCE_TYPES as it's used elsewhere
    PING_FONT_SIZE, PING_TEXT_COLOR, PING_BACKGROUND_COLOR, PING_BORDER_RADIUS, PING_PADDING_X, PING_PADDING_Y,

    // Player Damage Visual Constants (updated for temporary flash)
    PLAYER_DAMAGE_WIGGLE_STRENGTH, PLAYER_DAMAGE_WIGGLE_DECAY_RATE,
    HIT_FLASH_DURATION, HIT_FLASH_COLOR, HIT_FLASH_OPACITY, // New constants for the hit flash

    // Resource constants needed for drawing their sprites (ensure these are imported for getResSprite call)
    RESOURCE_DRAW_SIZE,
    RESOURCE_OUTLINE_COLOR,
    RESOURCE_OUTLINE_WIDTH,

    // NEW: Chat Bubble Constants
    CHAT_BUBBLE_OFFSET_Y,
    CHAT_BUBBLE_FONT_SIZE,
    CHAT_BUBBLE_TEXT_COLOR,
    CHAT_BUBBLE_BACKGROUND_COLOR,
    CHAT_BUBBLE_PADDING_X,
    CHAT_BUBBLE_PADDING_Y,
    CHAT_BUBBLE_BORDER_RADIUS,

    // NEW: Dead Player Hide Delay
    DEAD_PLAYER_HIDE_DELAY
} from './main.js';

// --- Imports from utils.js (Helper Functions) ---
import { interpolateColor, lerpAngle } from './utils.js';

// --- Imports from resourceDesigns.js (Resource Sprite Generation) ---
import { getResSprite } from './resourceDesigns.js';

// --- NEW: Import drawMinimap from its dedicated file ---
import { drawMinimap } from './map.js';
// Note: drawHotbar is called directly from main.js, so it's not imported here
// Note: drawWeaponSelectionUI is called directly from main.js, so it's not imported here

// NEW: Load the skull image asset
const skullImage = new Image();
skullImage.src = 'assets/Skull.webp';
skullImage.onerror = () => {
    console.error("Failed to load skull image: assets/Skull.webp");
};


// --- Ageing System UI Constants ---
const XP_BAR_WIDTH = 250;
const XP_BAR_HEIGHT = 20;
const XP_BAR_BORDER_RADIUS = 10;
const XP_BAR_BACKGROUND_COLOR = "rgba(0,0,0,0.7)"; // Dark background
const XP_BAR_FILL_COLOR = "#FFFFFF"; // Changed to WHITE
const XP_BAR_OUTLINE_COLOR = "black";
const XP_BAR_OUTLINE_WIDTH = 2;

const AGE_FONT_SIZE = 24;
const AGE_TEXT_COLOR = "white";
const AGE_TEXT_OUTLINE_COLOR = "black";
const AGE_TEXT_OUTLINE_WIDTH = 4;

// --- Drawing Functions ---

/**
 * Main drawing function for the game canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {HTMLCanvasElement} canvas - The game canvas element.
 * @param {object} players - Object containing all player data.
 * @param {string} myId - The ID of the local player.
 * @param {object} resources - Object containing all resource data.
 * @param {number} cameraX - The camera's current X position.
 * @param {number} cameraY - The camera's current Y position.
 * @param {number} deltaTime - Time elapsed since the last frame in seconds.
 * @param {number} currentPing - Current network ping in milliseconds.
 * @param {number} chatBubbleDuration - Duration for chat bubbles to display.
 * @param {string|null} topKillerId - The ID of the current top killer, or null if none.
 */
export function draw(ctx, canvas, players, myId, resources, cameraX, cameraY, deltaTime, currentPing, chatBubbleDuration, topKillerId) {
    // Clear canvas background with world border color
    ctx.fillStyle = worldBorderColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const me = players[myId];
    // If 'me' is dead, we still want to draw the world where they died,
    // but we might not want to update their visual position or trail.
    // The main menu will cover the screen, so the game world behind it
    // can just stay static.
    // The check for `me.visualX === undefined` is still important for initial load.
    if (!me || me.visualX === undefined) {
        // If the player object isn't fully initialized yet, draw a static background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return; // Exit early if player data isn't ready
    }


    // Player visual interpolation
    const interpFactor = 1 - Math.exp(-PLAYER_SMOOTHING_FACTOR * deltaTime);
    const now = Date.now(); // Get current time once per frame for consistent timing

    for (const id in players) {
        const p = players[id];
        if (p.visualX !== undefined) {
            // Only update visual position and trail if player is NOT dead
            if (!p.isDead) {
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > TRAIL_LENGTH) {
                    p.trail.shift();
                }
                p.visualX += (p.x - p.visualX) * interpFactor;
                p.visualY += (p.y - p.visualY) * interpFactor;
                p.visualAngle = lerpAngle(p.visualAngle, p.angle, interpFactor);
            } else {
                // If player is dead, clear their trail and keep their visual position static
                p.trail = [];
                // Their visualX/Y should remain at the death spot, which is handled by not updating them here.
            }
            
            if (p.isSwinging && now - p.swingStartTime > SWING_DURATION) {
                p.isSwinging = false;
                p.currentSwingingHand = null;
            }

            // Apply decay to player damage wiggle (only if currently wiggling)
            if (p.damageWiggleX !== 0 || p.damageWiggleY !== 0) {
                const decayFactor = Math.pow(PLAYER_DAMAGE_WIGGLE_DECAY_RATE, deltaTime * 60); // decay per second
                p.damageWiggleX *= decayFactor;
                p.damageWiggleY *= decayFactor;
                // Snap to zero if very small to prevent indefinite tiny wiggles
                if (Math.abs(p.damageWiggleX) < 0.1) p.damageWiggleX = 0;
                if (Math.abs(p.damageWiggleY) < 0.1) p.damageWiggleY = 0;
            }
            
            // Handle chat message fade out
            if (p.lastMessage && (now - p.messageDisplayTime > chatBubbleDuration)) {
                p.lastMessage = ''; // Clear message after duration
                p.messageDisplayTime = 0;
            }
        }
    }

    // --- Resource wiggle decay logic is handled in main.js's update function ---

    // Translate canvas for camera view
    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Draw world background and grid
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, worldWidth, worldHeight);
    drawGrid(ctx, canvas, cameraX, cameraY, worldWidth, worldHeight, gridSize, gridColor);

    // --- Corrected Drawing Order: Player Bodies/Names/Health -> Resources ---

    // 1. Draw Player Bodies (without names/health - these will be drawn later)
    // This ensures player base visuals are drawn first
    for (const id in players) {
        const p = players[id];
        // Only draw player if they are not dead OR if they are dead but still within the hide delay
        if (!p.isDead || (p.isDead && (now - p.deathTime < DEAD_PLAYER_HIDE_DELAY))) {
            drawPlayer(ctx, p, now); // Pass 'now' for hit flash
        }
    }

    // 2. Draw ALL Resources (Trees, Bushes, Stones) using their sprites
    // Resources are drawn AFTER players, so they appear on top
    for (const id in resources) {
        drawResource(ctx, resources[id], RESOURCE_DRAW_SIZE, RESOURCE_OUTLINE_COLOR, RESOURCE_OUTLINE_WIDTH);
    }

    // 3. Draw Player Names and Health Bars AND Chat Bubbles (these should always be on top of everything else)
    for (const id in players) {
        const p = players[id];
        // Only draw player overlay if they are not dead OR if they are the top killer and alive (for skull icon)
        if (!p.isDead) { // If player is alive, draw their overlay
            drawPlayerOverlay(ctx, p, now, chatBubbleDuration, topKillerId); // Pass now, duration, and topKillerId
        } else if (p.isDead && (now - p.deathTime < DEAD_PLAYER_HIDE_DELAY)) {
             // For recently dead players, you might still want names, but not health bars
             // For simplicity, let's keep overlays only for living players.
        }
    }

    ctx.restore(); // Restore context after camera translation

    // Draw UI elements (not affected by camera)
    // Only draw minimap, ping, and ageing UI if the player is NOT dead.
    // This prevents them from showing when the main menu is up.
    if (me && !me.isDead) { // Ensure 'me' exists before checking isDead
        drawMinimap(ctx, canvas, players, myId, worldWidth, worldHeight); // Added worldWidth/Height as parameters for drawMinimap
        drawPingCounter(ctx, canvas, currentPing, PING_FONT_SIZE, PING_TEXT_COLOR, PING_BACKGROUND_COLOR, PING_BORDER_RADIUS, PING_PADDING_X, PING_PADDING_Y);
        // Draw Ageing System UI
        drawAgeingUI(ctx, canvas, me);
    }
    // Hotbar and WeaponSelectionUI are drawn in main.js loop, so no calls here.
}

// Player body drawing (now with damage visuals, without name/health bar)
function drawPlayer(ctx, p, now) {
    ctx.save();

    // Draw player trail
    if (p.trail) {
        p.trail.forEach((trailPoint, index) => {
            const alpha = (index / TRAIL_LENGTH) * TRAIL_MAX_ALPHA;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.ellipse(trailPoint.x, trailPoint.y, playerBodyRadiusX, playerBodyRadiusY, 0, 0, Math.PI * 2);
            ctx.fillStyle = playerFillColor;
            ctx.fill();
        });
    }

    // Determine current player color and opacity based on hit flash
    const timeSinceDamage = now - p.lastDamageTime;
    let currentColor = playerFillColor;
    let currentOutlineColor = playerOutlineColor;
    let currentAlpha = 1.0;

    if (timeSinceDamage < HIT_FLASH_DURATION) {
        // Apply hit flash color and opacity
        currentColor = HIT_FLASH_COLOR;
        currentOutlineColor = HIT_FLASH_COLOR;
        currentAlpha = HIT_FLASH_OPACITY;
    } else if (p.isDead) {
        currentAlpha = 0.5; // Half opacity when dead
    }
    // Otherwise, it remains the default playerFillColor/playerOutlineColor and 1.0 alpha

    ctx.globalAlpha = currentAlpha;

    // Apply wiggle translation
    ctx.translate(p.visualX + p.damageWiggleX, p.visualY + p.damageWiggleY);
    ctx.rotate(p.visualAngle);

    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = currentColor; // Use determined color
    ctx.strokeStyle = currentOutlineColor; // Use determined color
    ctx.lineWidth = playerOutlineWidth;

    let handForwardOffsetRight = handForwardOffset;
    let handForwardOffsetLeft = handForwardOffset;
    let handSideOffsetRight = handSideOffset;
    let handSideOffsetLeft = handSideOffset;


    if (p.isSwinging && !p.isDead) {
        const swingProgress = (now - p.swingStartTime) / SWING_DURATION;
        const punchProgress = Math.sin(swingProgress * Math.PI);

        if (p.currentSwingingHand === 'right') {
            handForwardOffsetRight += SWING_REACH * punchProgress;
            handSideOffsetRight -= (handRadius * SWING_INWARD_AMOUNT) * punchProgress;
        } else if (p.currentSwingingHand === 'left') {
            handForwardOffsetLeft += SWING_REACH * punchProgress;
            handSideOffsetLeft -= (handRadius * SWING_INWARD_AMOUNT) * punchProgress;
        }
    }

    // Draw right hand
    ctx.beginPath();
    ctx.arc(handForwardOffsetRight, handSideOffsetRight, handRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw left hand
    ctx.beginPath();
    ctx.arc(handForwardOffsetLeft, -handSideOffsetLeft, handRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw oval body
    ctx.beginPath();
    ctx.ellipse(0, 0, playerBodyRadiusX, playerBodyRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

// Function for drawing player name and health bar (always on top)
function drawPlayerOverlay(ctx, p, now, chatBubbleDuration, topKillerId) { // Added topKillerId parameter
    // Only draw health bar, name, and chat bubble if player is NOT dead
    if (p.isDead) return;

    // Draw Health Bar (always drawn relative to world coordinates, not player translation)
    // Note: p.visualX/Y are used here, they already account for camera and smoothing.
    if (typeof p.health === 'number') {
        const healthBarX = p.visualX - healthBarWidth / 2;
        const healthBarY = p.visualY + playerBodyRadiusY + healthBarVerticalOffsetFromPlayerBottom;
        const healthPercentage = Math.max(0, p.health / MAX_HEALTH);
        if (healthPercentage > 0) { // Only draw if health > 0
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = healthBarBackgroundColor;
            ctx.beginPath();
            ctx.roundRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight, healthBarBorderRadius);
            ctx.fill();

            ctx.fillStyle = interpolateColor(lowHealthColor, fullHealthColor, healthPercentage);
            ctx.beginPath();
            ctx.roundRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight, healthBarBorderRadius);
            ctx.fill();

            ctx.strokeStyle = healthBarOutlineColor;
            ctx.lineWidth = healthBarOutlineWidth;
            ctx.beginPath();
            ctx.roundRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight, healthBarBorderRadius);
            ctx.stroke();
            ctx.globalAlpha = 1.0
        }
    }
    // Draw Player Name
    ctx.globalAlpha = 1.0;
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.strokeText(p.name || "Unnamed", p.visualX, p.visualY - playerBodyRadiusY - 25);
    ctx.fillStyle = "white";
    ctx.fillText(p.name || "Unnamed", p.visualX, p.visualY - playerBodyRadiusY - 25);
    ctx.globalAlpha = 1.0;

    // NEW: Draw skull image if this player is the top killer and the image is loaded
    if (topKillerId && p.id === topKillerId && (p.inventory.kills || 0) > 0 && skullImage.complete && skullImage.naturalWidth > 0) {
        const skullWidth = 24; // Adjust size of the skull
        const skullHeight = 24; // Adjust size of the skull

        // Measure the name text to position the skull correctly
        const nameMetrics = ctx.measureText(p.name || "Unnamed");
        // Position the skull to the right of the player's name
        const skullDrawX = p.visualX + nameMetrics.width / 2 + 5; // 5px padding to the right of the name
        const skullDrawY = (p.visualY - playerBodyRadiusY - 25) - skullHeight / 2; // Vertically center with the name's baseline

        ctx.drawImage(skullImage, skullDrawX, skullDrawY, skullWidth, skullHeight);
    }

    // NEW: Draw chat message bubble
    drawChatMessageBubble(ctx, p, now, chatBubbleDuration);
}

// NEW: Function to draw a chat message bubble above the player's head
function drawChatMessageBubble(ctx, p, now, chatBubbleDuration) {
    if (!p.lastMessage || p.isDead) return; // Don't draw if dead

    const timeElapsed = now - p.messageDisplayTime;
    if (timeElapsed > chatBubbleDuration) return; // Message has expired

    // Calculate fade-out alpha
    let bubbleAlpha = 1.0;
    const fadeStartTime = chatBubbleDuration * 0.7; // Start fading out at 70% of duration
    if (timeElapsed > fadeStartTime) {
        bubbleAlpha = 1.0 - ((timeElapsed - fadeStartTime) / (chatBubbleDuration - fadeStartTime));
        bubbleAlpha = Math.max(0, Math.min(1, bubbleAlpha)); // Clamp between 0 and 1
    }

    if (bubbleAlpha <= 0) return; // Don't draw if fully transparent

    ctx.save();
    ctx.globalAlpha = bubbleAlpha;

    ctx.font = `${CHAT_BUBBLE_FONT_SIZE}px Arial`;
    ctx.textAlign = "center"; // Already centered horizontally
    ctx.textBaseline = "middle"; // CORRECTED: This will center the text vertically in the bubble

    // Measure text to determine bubble size
    const textMetrics = ctx.measureText(p.lastMessage);
    const textWidth = textMetrics.width;
    const textHeight = CHAT_BUBBLE_FONT_SIZE; // Approximate height based on font size

    const bubbleWidth = textWidth + CHAT_BUBBLE_PADDING_X * 2;
    const bubbleHeight = textHeight + CHAT_BUBBLE_PADDING_Y * 2;

    // Position the bubble above the player
    const bubbleX = p.visualX - bubbleWidth / 2;
    // Calculation for bubbleY now uses CHAT_BUBBLE_OFFSET_Y for consistent placement above player
    const bubbleY = p.visualY - playerBodyRadiusY - CHAT_BUBBLE_OFFSET_Y - bubbleHeight; 

    // Draw bubble background
    ctx.fillStyle = CHAT_BUBBLE_BACKGROUND_COLOR;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, CHAT_BUBBLE_BORDER_RADIUS);
    ctx.fill();

    // Draw text - centered horizontally and vertically within the bubble's drawing area
    // For textBaseline "middle", the y-coordinate should be the vertical center of the text area.
    ctx.fillStyle = CHAT_BUBBLE_TEXT_COLOR;
    ctx.fillText(p.lastMessage, p.visualX, bubbleY + (bubbleHeight / 2)); 

    ctx.restore(); // Restore globalAlpha and other settings
}


// Resource drawing (uses getResSprite from resourceDesigns.js)
function drawResource(ctx, resource, resourceDrawSize, resourceOutlineColor, resourceOutlineWidth) {
    ctx.save();

    // Apply wiggle translation
    ctx.translate(resource.x + resource.xWiggle, resource.y + resource.yWiggle);

    ctx.globalAlpha = 1.0;

    // Apply shadow BEFORE drawing the sprite so it's applied to the sprite itself
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Retrieve the sprite from resourceDesigns.js, passing required parameters
    const resourceSprite = getResSprite(resource, RESOURCE_DRAW_SIZE, RESOURCE_OUTLINE_COLOR, RESOURCE_OUTLINE_WIDTH);
    if (resourceSprite) { // Ensure sprite exists before drawing
        // Draw the sprite, centering it based on its own dimensions
        ctx.drawImage(resourceSprite, -resourceSprite.width / 2, -resourceSprite.height / 2);
    }

    ctx.restore(); // Restore context to remove transformations and shadow
}

// Grid drawing (unchanged)
function drawGrid(ctx, canvas, cameraX, cameraY, worldWidth, worldHeight, gridSize, gridColor) {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const startX = Math.floor(cameraX / gridSize) * gridSize;
    const endX = startX + canvas.width + gridSize;
    const startY = Math.floor(cameraY / gridSize) * gridSize;
    const endY = startY + canvas.height + gridSize;
    for (let x = startX; x < endX; x += gridSize) {
        if (x >= 0 && x <= worldWidth) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }
    }
    for (let y = startY; y < endY; y += gridSize) {
        if (y >= 0 && y <= worldHeight) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
    }
}

// Ping Counter drawing (NOW TOP CENTER)
function drawPingCounter(ctx, canvas, currentPing, PING_FONT_SIZE, PING_TEXT_COLOR, PING_BACKGROUND_COLOR, PING_BORDER_RADIUS, PING_PADDING_X, PING_PADDING_Y) {
    const pingText = `Ping: ${currentPing}ms`;
    ctx.font = `bold ${PING_FONT_SIZE}px Arial`;
    
    // Measure text to create a background rectangle
    const textMetrics = ctx.measureText(pingText);
    const textWidth = textMetrics.width;
    // Approximate height, typically PING_FONT_SIZE * 1.2 is a good estimate for text height
    const textHeight = PING_FONT_SIZE * 1.2; 

    const paddingX = PING_PADDING_X;
    const paddingY = PING_PADDING_Y;

    const panelWidth = textWidth + 2 * paddingX;
    const panelHeight = textHeight + 2 * paddingY;
    
    // Position the panel in the top center
    const panelX = (canvas.width / 2) - (panelWidth / 2);
    const panelY = PING_PADDING_Y; // Keep it at the top with a padding offset

    // Draw background rectangle
    ctx.fillStyle = PING_BACKGROUND_COLOR;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, PING_BORDER_RADIUS);
    ctx.fill();

    // Draw ping text
    ctx.fillStyle = PING_TEXT_COLOR;
    ctx.textAlign = "center"; // Center horizontally within the panel
    ctx.textBaseline = "middle"; // Center vertically within the panel
    ctx.fillText(pingText, canvas.width / 2, panelY + panelHeight / 2);
}


/**
 * Draws a chat bubble above a player.
 */
// This function is now internal to drawing.js and called by drawPlayerOverlay
// No changes needed here as it's already defined above.


// Function to draw the player's XP bar and age
export function drawAgeingUI(ctx, canvas, player) {
    if (!player || player.isDead) return; // Don't draw if player is dead

    // Calculate XP bar position (bottom-center)
    const xpBarX = (canvas.width / 2) - (XP_BAR_WIDTH / 2);
    // Adjusted XP_BAR_Y to place it higher than the hotbar but still near bottom
    const xpBarY = canvas.height - XP_BAR_HEIGHT - 90; // Moved from 30 to 90

    // --- Draw XP Bar Background ---
    ctx.fillStyle = XP_BAR_BACKGROUND_COLOR;
    ctx.beginPath();
    ctx.roundRect(xpBarX, xpBarY, XP_BAR_WIDTH, XP_BAR_HEIGHT, XP_BAR_BORDER_RADIUS);
    ctx.fill();

    // --- Create a clipping path for the XP bar to ensure rounded fill ---
    ctx.save(); // Save context before clipping
    ctx.beginPath();
    ctx.roundRect(xpBarX, xpBarY, XP_BAR_WIDTH, XP_BAR_HEIGHT, XP_BAR_BORDER_RADIUS);
    ctx.clip(); // Apply the rounded rectangle as a clipping mask

    // Calculate XP percentage
    let xpPercentage = 0;
    if (player.xpToNextAge > 0) {
        xpPercentage = player.xp / player.xpToNextAge;
        xpPercentage = Math.max(0, Math.min(xpPercentage, 1)); // Clamp between 0 and 1
    }

    // --- Draw XP Bar Fill (white) ---
    // This fillRect will now be clipped by the rounded path
    ctx.fillStyle = XP_BAR_FILL_COLOR;
    ctx.fillRect(xpBarX, xpBarY, XP_BAR_WIDTH * xpPercentage, XP_BAR_HEIGHT);

    ctx.restore(); // Restore context to remove the clipping path

    // --- Draw XP Bar Outline ---
    ctx.strokeStyle = XP_BAR_OUTLINE_COLOR;
    ctx.lineWidth = XP_BAR_OUTLINE_WIDTH;
    ctx.beginPath();
    ctx.roundRect(xpBarX, xpBarY, XP_BAR_WIDTH, XP_BAR_HEIGHT, XP_BAR_BORDER_RADIUS);
    ctx.stroke();

    // Draw Age Text (e.g., "Age 0") ABOVE the bar
    ctx.font = `bold ${AGE_FONT_SIZE}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom"; // Align to the bottom of the text block

    const ageText = `Age ${player.age}`;
    const ageTextX = xpBarX + XP_BAR_WIDTH / 2; // Centered above the bar
    const ageTextY = xpBarY - 10; // 10px above the bar

    ctx.strokeStyle = AGE_TEXT_OUTLINE_COLOR;
    ctx.lineWidth = AGE_TEXT_OUTLINE_WIDTH;
    ctx.strokeText(ageText, ageTextX, ageTextY);
    ctx.fillStyle = AGE_TEXT_COLOR;
    ctx.fillText(ageText, ageTextX, ageTextY);
}
