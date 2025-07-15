// drawing.js - Handles all canvas drawing operations

// Import necessary constants from main.js
import {
    worldWidth, worldHeight, playerBodyRadiusX, playerBodyRadiusY, handRadius,
    handSideOffset, handForwardOffset, SWING_DURATION, SWING_REACH, SWING_INWARD_AMOUNT,
    MAX_HEALTH, healthBarWidth, healthBarHeight, healthBarVerticalOffsetFromPlayerBottom,
    healthBarBorderRadius, fullHealthColor, lowHealthColor, healthBarBackgroundColor,
    healthBarOutlineColor, healthBarOutlineWidth,
    backgroundColor, worldBorderColor, gridColor, playerFillColor, playerOutlineColor,
    playerOutlineWidth, gridSize, minimapSize, minimapPadding, minimapBackgroundColor,
    minimapBorderColor, RESOURCE_PROPERTIES, RESOURCE_OUTLINE_COLOR, RESOURCE_OUTLINE_WIDTH,
    RESOURCE_DRAW_SIZE, PLAYER_DAMAGE_WIGGLE_STRENGTH, PLAYER_DAMAGE_WIGGLE_DECAY_RATE,
    HIT_FLASH_DURATION, HIT_FLASH_COLOR, HIT_FLASH_OPACITY, CHAT_BUBBLE_OFFSET_Y,
    CHAT_BUBBLE_FONT_SIZE, CHAT_BUBBLE_TEXT_COLOR, CHAT_BUBBLE_BACKGROUND_COLOR,
    CHAT_BUBBLE_PADDING_X, CHAT_BUBBLE_PADDING_Y, CHAT_BUBBLE_BORDER_RADIUS,
    DEAD_PLAYER_HIDE_DELAY
} from './main.js'; // Import all necessary constants

// Import helper functions
import { interpolateColor, lerpAngle, clamp } from './utils.js';

// NEW: Load the skull image asset
const skullImage = new Image();
skullImage.src = 'assets/Skull.webp';
skullImage.onerror = () => {
    console.error("Failed to load skull image: assets/Skull.webp");
};


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
 * @param {number} CHAT_BUBBLE_DURATION - Duration for chat bubbles to display.
 * @param {string|null} topKillerId - The ID of the current top killer, or null if none.
 */
export function draw(ctx, canvas, players, myId, resources, cameraX, cameraY, deltaTime, currentPing, CHAT_BUBBLE_DURATION, topKillerId) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    drawBackground(ctx, canvas, cameraX, cameraY);

    // Draw resources
    for (const id in resources) {
        const res = resources[id];
        drawResource(ctx, res, cameraX, cameraY);
    }

    // Draw players
    for (const id in players) {
        const p = players[id];

        // Smooth player movement and rotation
        p.visualX = p.visualX + (p.x - p.visualX) / PLAYER_SMOOTHING_FACTOR;
        p.visualY = p.visualY + (p.y - p.visualY) / PLAYER_SMOOTHING_FACTOR;
        p.visualAngle = lerpAngle(p.visualAngle, p.angle, 0.15); // Smooth angle

        // Apply damage wiggle decay
        if (p.damageWiggleX !== 0 || p.damageWiggleY !== 0) {
            p.damageWiggleX *= PLAYER_DAMAGE_WIGGLE_DECAY_RATE;
            p.damageWiggleY *= PLAYER_DAMAGE_WIGGLE_DECAY_RATE;
            if (Math.abs(p.damageWiggleX) < 0.1) p.damageWiggleX = 0;
            if (Math.abs(p.damageWiggleY) < 0.1) p.damageWiggleY = 0;
        }

        // Only draw living players, or recently dead players for a fade-out effect
        const now = Date.now();
        if (p.isDead) {
            const timeSinceDeath = now - p.deathTime;
            if (timeSinceDeath > DEAD_PLAYER_HIDE_DELAY) {
                continue; // Skip drawing if fully faded out
            }
            // Reduce opacity as they fade out
            ctx.globalAlpha = 1 - (timeSinceDeath / DEAD_PLAYER_HIDE_DELAY);
        } else {
            ctx.globalAlpha = 1; // Fully opaque for living players
        }

        drawPlayer(ctx, p, cameraX, cameraY, id === myId, now);

        // Reset globalAlpha after drawing each player to not affect other elements
        ctx.globalAlpha = 1;

        // Draw chat bubble if message is active
        if (p.lastMessage && now - p.messageDisplayTime < CHAT_BUBBLE_DURATION) {
            drawChatBubble(ctx, p, cameraX, cameraY, p.lastMessage);
        }
    }

    // Draw minimap
    drawMinimap(ctx, canvas, players, myId, cameraX, cameraY);

    // Draw Ping display
    drawPing(ctx, canvas, currentPing);
}

/**
 * Draws the background grid and world borders.
 */
function drawBackground(ctx, canvas, cameraX, cameraY) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Draw vertical grid lines
    for (let x = -cameraX % gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = -cameraY % gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw world borders
    ctx.strokeStyle = worldBorderColor;
    ctx.lineWidth = 10; // Thicker border

    // Top border
    if (cameraY < 0) {
        ctx.beginPath();
        ctx.moveTo(0, -cameraY);
        ctx.lineTo(canvas.width, -cameraY);
        ctx.stroke();
    }
    // Bottom border
    if (cameraY + canvas.height > worldHeight) {
        ctx.beginPath();
        ctx.moveTo(0, worldHeight - cameraY);
        ctx.lineTo(canvas.width, worldHeight - cameraY);
        ctx.stroke();
    }
    // Left border
    if (cameraX < 0) {
        ctx.beginPath();
        ctx.moveTo(-cameraX, 0);
        ctx.lineTo(-cameraX, canvas.height);
        ctx.stroke();
    }
    // Right border
    if (cameraX + canvas.width > worldWidth) {
        ctx.beginPath();
        ctx.moveTo(worldWidth - cameraX, 0);
        ctx.lineTo(worldWidth - cameraX, canvas.height);
        ctx.stroke();
    }
}

/**
 * Draws a single player character.
 */
function drawPlayer(ctx, p, cameraX, cameraY, isMe, now) {
    const displayX = p.visualX - cameraX + p.damageWiggleX;
    const displayY = p.visualY - cameraY + p.damageWiggleY;

    ctx.save();
    ctx.translate(displayX, displayY);
    ctx.rotate(p.visualAngle);

    // Draw player body (ellipse)
    ctx.fillStyle = playerFillColor;
    ctx.strokeStyle = playerOutlineColor;
    ctx.lineWidth = playerOutlineWidth;
    ctx.beginPath();
    ctx.ellipse(0, 0, playerBodyRadiusX, playerBodyRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw hands
    // Calculate hand positions relative to player center
    const handAngleOffset = Math.PI / 2.5; // Angle for hands
    const handSwingAngle = (now - p.swingStartTime) / SWING_DURATION * Math.PI * 1.5; // Swing motion

    // Determine current swing state and hand positions
    let leftHandAngle = -handAngleOffset;
    let rightHandAngle = handAngleOffset;

    let leftHandOffset = handForwardOffset;
    let rightHandOffset = handForwardOffset;

    if (p.isSwinging) {
        if (p.currentSwingingHand === 'left') {
            leftHandAngle = -handAngleOffset + Math.sin(handSwingAngle) * Math.PI * 0.4; // Arc motion
            leftHandOffset = handForwardOffset + Math.abs(Math.cos(handSwingAngle)) * SWING_REACH; // Extend reach
            if (now - p.swingStartTime > SWING_DURATION) {
                p.isSwinging = false;
                p.currentSwingingHand = null;
            }
        } else if (p.currentSwingingHand === 'right') {
            rightHandAngle = handAngleOffset - Math.sin(handSwingAngle) * Math.PI * 0.4; // Arc motion
            rightHandOffset = handForwardOffset + Math.abs(Math.cos(handSwingAngle)) * SWING_REACH; // Extend reach
            if (now - p.swingStartTime > SWING_DURATION) {
                p.isSwinging = false;
                p.currentSwingingHand = null;
            }
        }
    }

    // Left Hand
    const leftHandX = Math.cos(leftHandAngle) * leftHandOffset;
    const leftHandY = Math.sin(leftHandAngle) * leftHandOffset;
    ctx.beginPath();
    ctx.arc(leftHandX, leftHandY, handRadius, 0, Math.PI * 2);
    ctx.fillStyle = playerFillColor;
    ctx.strokeStyle = playerOutlineColor;
    ctx.lineWidth = playerOutlineWidth;
    ctx.fill();
    ctx.stroke();

    // Right Hand
    const rightHandX = Math.cos(rightHandAngle) * rightHandOffset;
    const rightHandY = Math.sin(rightHandAngle) * rightHandOffset;
    ctx.beginPath();
    ctx.arc(rightHandX, rightHandY, handRadius, 0, Math.PI * 2);
    ctx.fillStyle = playerFillColor;
    ctx.strokeStyle = playerOutlineColor;
    ctx.lineWidth = playerOutlineWidth;
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // Restore context to original state (before translate and rotate)

    // Draw health bar
    drawHealthBar(ctx, p, displayX, displayY);

    // Draw player name
    ctx.fillStyle = "white";
    ctx.font = "20px Arial"; // Or your chosen font
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const nameText = p.name;
    const nameX = displayX;
    const nameY = displayY - playerBodyRadiusY - 10; // Position above the player

    ctx.fillText(nameText, nameX, nameY);

    // NEW: Draw skull image if this player is the top killer and the image is loaded
    if (topKillerId && p.id === topKillerId && (p.inventory.kills || 0) > 0 && skullImage.complete && skullImage.naturalWidth > 0) {
        const skullWidth = 24; // Adjust size of the skull
        const skullHeight = 24; // Adjust size of the skull

        // Measure the name text to position the skull correctly
        const nameMetrics = ctx.measureText(nameText);
        // Position the skull to the right of the player's name
        const skullDrawX = nameX + nameMetrics.width / 2 + 5; // 5px padding to the right of the name
        const skullDrawY = nameY - skullHeight / 2; // Vertically center with the name's baseline

        ctx.drawImage(skullImage, skullDrawX, skullDrawY, skullWidth, skullHeight);
    }


    // Draw hit flash effect if recently damaged
    if (now - p.lastDamageTime < HIT_FLASH_DURATION) {
        const flashProgress = (now - p.lastDamageTime) / HIT_FLASH_DURATION;
        const opacity = HIT_FLASH_OPACITY * (1 - flashProgress); // Fade out
        ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.beginPath();
        ctx.ellipse(displayX, displayY, playerBodyRadiusX, playerBodyRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draws the health bar for a player.
 */
function drawHealthBar(ctx, p, displayX, displayY) {
    const healthPercentage = p.health / MAX_HEALTH;
    const healthBarCurrentWidth = healthBarWidth * healthPercentage;

    // Calculate position
    const barX = displayX - healthBarWidth / 2;
    const barY = displayY + playerBodyRadiusY + healthBarVerticalOffsetFromPlayerBottom;

    // Draw background (gray)
    ctx.fillStyle = healthBarBackgroundColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, healthBarWidth, healthBarHeight, healthBarBorderRadius);
    ctx.fill();

    // Draw health (gradient from green to red)
    const healthColor = interpolateColor(lowHealthColor, fullHealthColor, healthPercentage);
    ctx.fillStyle = healthColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, healthBarCurrentWidth, healthBarHeight, healthBarBorderRadius);
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = healthBarOutlineColor;
    ctx.lineWidth = healthBarOutlineWidth;
    ctx.beginPath();
    ctx.roundRect(barX, barY, healthBarWidth, healthBarHeight, healthBarBorderRadius);
    ctx.stroke();
}

/**
 * Draws a single resource node.
 */
function drawResource(ctx, res, cameraX, cameraY) {
    const displayX = res.x - cameraX + res.xWiggle;
    const displayY = res.y - cameraY + res.yWiggle;

    ctx.save();
    ctx.translate(displayX, displayY);

    // Common properties for all resources
    ctx.strokeStyle = RESOURCE_OUTLINE_COLOR;
    ctx.lineWidth = RESOURCE_OUTLINE_WIDTH;

    // Resource-specific drawing based on type
    const props = RESOURCE_PROPERTIES[res.type];
    const drawSize = RESOURCE_DRAW_SIZE; // Use a consistent base draw size

    switch (res.type) {
        case 'wood':
            // Tree trunk
            ctx.fillStyle = '#8B4513'; // Brown
            ctx.beginPath();
            ctx.arc(0, 0, drawSize * 0.3, 0, Math.PI * 2); // Trunk base
            ctx.fill();
            ctx.stroke();

            // Tree canopy (multiple green circles)
            ctx.fillStyle = '#228B22'; // Forest Green
            ctx.beginPath();
            ctx.arc(-drawSize * 0.2, -drawSize * 0.2, drawSize * 0.4, 0, Math.PI * 2);
            ctx.arc(drawSize * 0.2, -drawSize * 0.1, drawSize * 0.35, 0, Math.PI * 2);
            ctx.arc(0, drawSize * 0.1, drawSize * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        case 'stone':
            // Stone/Rock (irregular shape)
            ctx.fillStyle = '#808080'; // Gray
            ctx.beginPath();
            ctx.moveTo(drawSize * 0.4, 0);
            ctx.lineTo(drawSize * 0.2, drawSize * 0.3);
            ctx.lineTo(-drawSize * 0.3, drawSize * 0.4);
            ctx.lineTo(-drawSize * 0.4, 0);
            ctx.lineTo(-drawSize * 0.2, -drawSize * 0.3);
            ctx.lineTo(drawSize * 0.3, -drawSize * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        case 'food':
            // Berry Bush
            ctx.fillStyle = '#32CD32'; // Lime Green for bush
            ctx.beginPath();
            ctx.arc(0, 0, drawSize * 0.7, 0, Math.PI * 2); // Main bush body
            ctx.fill();
            ctx.stroke();

            // Berries
            ctx.fillStyle = '#FF0000'; // Red for berries
            ctx.beginPath();
            ctx.arc(drawSize * 0.3, drawSize * 0.2, drawSize * 0.1, 0, Math.PI * 2);
            ctx.arc(-drawSize * 0.2, -drawSize * 0.3, drawSize * 0.08, 0, Math.PI * 2);
            ctx.arc(drawSize * 0.1, -drawSize * 0.1, drawSize * 0.09, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        case 'gold':
            // Gold Ore
            ctx.fillStyle = '#FFD700'; // Gold color
            ctx.beginPath();
            ctx.moveTo(drawSize * 0.3, 0);
            ctx.lineTo(drawSize * 0.1, drawSize * 0.25);
            ctx.lineTo(-drawSize * 0.25, drawSize * 0.3);
            ctx.lineTo(-drawSize * 0.3, 0);
            ctx.lineTo(-drawSize * 0.1, -drawSize * 0.25);
            ctx.lineTo(drawSize * 0.25, -drawSize * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Sparkle/Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(drawSize * 0.15, -drawSize * 0.15, drawSize * 0.1, 0, Math.PI * 2);
            ctx.fill();
            break;
        default:
            // Fallback for unknown resource types (a simple circle)
            ctx.fillStyle = 'purple';
            ctx.beginPath();
            ctx.arc(0, 0, props.collisionRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
    }

    ctx.restore(); // Restore context
}

/**
 * Draws the minimap in the top-right corner.
 */
function drawMinimap(ctx, canvas, players, myId, cameraX, cameraY) {
    const minimapX = canvas.width - minimapSize - minimapPadding;
    const minimapY = minimapPadding;

    // Draw minimap background
    ctx.fillStyle = minimapBackgroundColor;
    ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);

    // Draw minimap border
    ctx.strokeStyle = minimapBorderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

    // Calculate scaling factors for minimap
    const scaleX = minimapSize / worldWidth;
    const scaleY = minimapSize / worldHeight;

    // Draw players on minimap
    for (const id in players) {
        const p = players[id];
        if (p.isDead) continue; // Don't show dead players on minimap

        const playerMiniX = minimapX + p.x * scaleX;
        const playerMiniY = minimapY + p.y * scaleY;

        ctx.beginPath();
        ctx.arc(playerMiniX, playerMiniY, 3, 0, Math.PI * 2); // Player dot size
        ctx.fillStyle = (id === myId) ? 'blue' : 'red'; // Blue for self, red for others
        ctx.fill();
    }

    // Draw resources on minimap (optional, can be removed if too cluttered)
    for (const id in resources) {
        const res = resources[id];
        const resourceMiniX = minimapX + res.x * scaleX;
        const resourceMiniY = minimapY + res.y * scaleY;

        ctx.beginPath();
        ctx.arc(resourceMiniX, resourceMiniY, 2, 0, Math.PI * 2); // Resource dot size
        // Assign color based on resource type
        let resourceColor = 'gray';
        switch (res.type) {
            case 'wood': resourceColor = '#8B4513'; break; // Brown
            case 'stone': resourceColor = '#808080'; break; // Gray
            case 'food': resourceColor = '#32CD32'; break; // Green
            case 'gold': resourceColor = '#FFD700'; break; // Gold
        }
        ctx.fillStyle = resourceColor;
        ctx.fill();
    }
}

/**
 * Draws the current ping on the screen.
 */
function drawPing(ctx, canvas, ping) {
    const pingText = `Ping: ${ping}ms`;
    ctx.font = `${PING_FONT_SIZE}px Arial`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";

    // Measure text to create a background rectangle
    const textMetrics = ctx.measureText(pingText);
    const textWidth = textMetrics.width;
    const textHeight = PING_FONT_SIZE * 1.2; // Approximate height

    const paddingX = PING_PADDING_X;
    const paddingY = PING_PADDING_Y;

    const bgX = canvas.width - paddingX - textWidth - paddingX;
    const bgY = canvas.height - paddingY - textHeight - paddingY;
    const bgWidth = textWidth + 2 * paddingX;
    const bgHeight = textHeight + 2 * paddingY;

    // Draw background rectangle
    ctx.fillStyle = PING_BACKGROUND_COLOR;
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, bgWidth, bgHeight, PING_BORDER_RADIUS);
    ctx.fill();

    // Draw ping text
    ctx.fillStyle = PING_TEXT_COLOR;
    ctx.fillText(pingText, canvas.width - paddingX, canvas.height - paddingY - textHeight / 2);
}


/**
 * Draws a chat bubble above a player.
 */
function drawChatBubble(ctx, p, cameraX, cameraY, message) {
    const displayX = p.visualX - cameraX;
    const displayY = p.visualY - cameraY;

    ctx.font = `${CHAT_BUBBLE_FONT_SIZE}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textMetrics = ctx.measureText(message);
    const textWidth = textMetrics.width;
    const textHeight = CHAT_BUBBLE_FONT_SIZE * 1.2; // Approximate line height

    const bubbleWidth = textWidth + 2 * CHAT_BUBBLE_PADDING_X;
    const bubbleHeight = textHeight + 2 * CHAT_BUBBLE_PADDING_Y;

    const bubbleX = displayX - bubbleWidth / 2;
    const bubbleY = displayY - playerBodyRadiusY - CHAT_BUBBLE_OFFSET_Y - bubbleHeight;

    // Draw bubble background
    ctx.fillStyle = CHAT_BUBBLE_BACKGROUND_COLOR;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, CHAT_BUBBLE_BORDER_RADIUS);
    ctx.fill();

    // Draw text
    ctx.fillStyle = CHAT_BUBBLE_TEXT_COLOR;
    ctx.fillText(message, displayX, bubbleY + bubbleHeight / 2);
}
