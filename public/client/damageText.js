// damageText.js - Manages and renders floating damage text visuals

// --- Constants for Damage Text ---
const DAMAGE_TEXT_RISE_SPEED = 0.05; // Pixels per millisecond (adjust for desired speed)
const DAMAGE_TEXT_FADE_DURATION = 1000; // Milliseconds for text to fade out
const DAMAGE_TEXT_FONT_SIZE = 34; // Font size for damage numbers
const DAMAGE_TEXT_FONT_FAMILY = "Arial Black"; // Bold, impactful font
const DAMAGE_TEXT_OUTLINE_WIDTH = 2; // Outline for better visibility

const OWN_PLAYER_DAMAGE_COLOR = "#00FF00"; // Green for damage taken by self
const OPPONENT_DAMAGE_COLOR = "#FFFFFF"; // White for damage taken by opponents


// Array to hold all currently active damage text objects
let activeDamageTexts = [];

/**
 * Creates a new damage text object and adds it to the list of active texts.
 * @param {number} x - The world X coordinate where the damage occurred.
 * @param {number} y - The world Y coordinate where the damage occurred.
 * @param {number} damageAmount - The amount of damage to display.
 * @param {boolean} isOwnPlayer - True if the damage was taken by the local player, false otherwise.
 * @param {number} cameraX - The current camera X position.
 * @param {number} cameraY - The current camera Y position.
 */
export function createDamageText(x, y, damageAmount, isOwnPlayer, cameraX, cameraY) {
    const displayX = x - cameraX;
    const displayY = y - cameraY;

    activeDamageTexts.push({
        value: Math.floor(damageAmount), // Display whole numbers for damage
        color: isOwnPlayer ? OWN_PLAYER_DAMAGE_COLOR : OPPONENT_DAMAGE_COLOR,
        initialDisplayX: displayX,
        initialDisplayY: displayY,
        currentDisplayY: displayY, // This will change as it rises
        startTime: Date.now(),
        alpha: 1 // Starts fully opaque
    });
}

/**
 * Updates the position and fade of all active damage text objects.
 * Should be called once per game loop frame.
 * @param {number} deltaTime - The time elapsed since the last frame in seconds.
 */
export function updateDamageTexts(deltaTime) {
    const now = Date.now();
    activeDamageTexts = activeDamageTexts.filter(text => {
        const elapsedTime = now - text.startTime;

        // Calculate new vertical position (rises upwards)
        text.currentDisplayY = text.initialDisplayY - (elapsedTime * DAMAGE_TEXT_RISE_SPEED);

        // Calculate new opacity (fades out)
        text.alpha = 1 - (elapsedTime / DAMAGE_TEXT_FADE_DURATION);
        
        // Remove text if it has fully faded
        return text.alpha > 0;
    });
}

/**
 * Draws all active damage text objects on the canvas.
 * Should be called once per game loop frame after other game elements.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 */
export function drawDamageTexts(ctx) {
    ctx.save(); // Save the current canvas state

    activeDamageTexts.forEach(text => {
        ctx.globalAlpha = text.alpha; // Apply current opacity

        ctx.font = `bold ${DAMAGE_TEXT_FONT_SIZE}px "${DAMAGE_TEXT_FONT_FAMILY}"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw outline
        ctx.strokeStyle = "black"; // Outline color
        ctx.lineWidth = DAMAGE_TEXT_OUTLINE_WIDTH;
        ctx.strokeText(text.value, text.initialDisplayX, text.currentDisplayY);

        // Draw fill text
        ctx.fillStyle = text.color;
        ctx.fillText(text.value, text.initialDisplayX, text.currentDisplayY);
    });

    ctx.restore(); // Restore the canvas state (important for globalAlpha)
}
