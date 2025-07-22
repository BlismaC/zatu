// --- Imports from main.js (Constants for UI positioning and colors) ---
import {
    canvas, worldWidth, worldHeight,
    playerFillColor, playerOutlineColor,
    MAX_HEALTH // To align with existing bar logic if needed, though for XP it's separate
} from './main.js';

// --- Leveling UI Constants ---
const XP_BAR_WIDTH = 250;
const XP_BAR_HEIGHT = 20;
const XP_BAR_BORDER_RADIUS = 10;
const XP_BAR_BACKGROUND_COLOR = "rgba(0,0,0,0.7)"; // Dark background
const XP_BAR_FILL_COLOR = "#00BFFF"; // Bright blue for XP
const XP_BAR_OUTLINE_COLOR = "black";
const XP_BAR_OUTLINE_WIDTH = 2;

const AGE_FONT_SIZE = 24;
const AGE_TEXT_COLOR = "white";
const AGE_TEXT_OUTLINE_COLOR = "black";
const AGE_TEXT_OUTLINE_WIDTH = 4;

const XP_TEXT_FONT_SIZE = 16;
const XP_TEXT_COLOR = "white";

// Function to draw the player's XP bar and level
export function drawAgeingUI(ctx, canvas, player) {
    if (!player || player.isDead) return;

    // Calculate XP bar position (e.g., top-center)
    const xpBarX = (canvas.width / 2) - (XP_BAR_WIDTH / 2);
    const xpBarY = 90;

    // Draw XP Bar Background
    ctx.fillStyle = XP_BAR_BACKGROUND_COLOR;
    ctx.beginPath();
    ctx.roundRect(xpBarX, xpBarY, XP_BAR_WIDTH, XP_BAR_HEIGHT, XP_BAR_BORDER_RADIUS);
    ctx.fill();

    // Calculate XP percentage
    let xpPercentage = 0;
    if (player.xpToNextAge > 0) {
        xpPercentage = player.xp / player.xpToNextAge;
        xpPercentage = Math.max(0, Math.min(xpPercentage, 1)); // Clamp between 0 and 1
    }

    // Draw XP Bar Fill
    ctx.fillStyle = XP_BAR_FILL_COLOR;
    ctx.beginPath();
    ctx.roundRect(xpBarX, xpBarY, XP_BAR_WIDTH * xpPercentage, XP_BAR_HEIGHT, XP_BAR_BORDER_RADIUS);
    ctx.fill();

    // Draw XP Bar Outline
    ctx.strokeStyle = XP_BAR_OUTLINE_COLOR;
    ctx.lineWidth = XP_BAR_OUTLINE_WIDTH;
    ctx.beginPath();
    ctx.roundRect(xpBarX, xpBarY, XP_BAR_WIDTH, XP_BAR_HEIGHT, XP_BAR_BORDER_RADIUS);
    ctx.stroke();

    // Draw Level Text (e.g., "Lv. 1")
    ctx.font = `bold ${AGE_FONT_SIZE}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const ageText = `Lv. ${player.age}`;
    const ageTextX = xpBarX - AGE_FONT_SIZE * 1.5; // Position to the left of the bar
    const ageTextY = xpBarY + XP_BAR_HEIGHT / 2;

    ctx.strokeStyle = AGE_TEXT_OUTLINE_COLOR;
    ctx.lineWidth = AGE_TEXT_OUTLINE_WIDTH;
    ctx.strokeText(ageText, ageTextX, ageTextY);
    ctx.fillStyle = AGE_TEXT_COLOR;
    ctx.fillText(ageText, ageTextX, ageTextY);

    // Draw XP / Next Level Text (e.g., "50 / 100 XP")
    ctx.font = `${XP_TEXT_FONT_SIZE}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const xpDisplayText = `${player.xp} / ${player.xpToNextAge} XP`;
    const xpTextX = xpBarX + XP_BAR_WIDTH / 2;
    const xpTextY = xpBarY + XP_BAR_HEIGHT / 2;

    ctx.fillStyle = XP_TEXT_COLOR;
    ctx.fillText(xpDisplayText, xpTextX, xpTextY);
}
