// --- Imports from main.js (Constants needed for minimap) ---
import {
    worldWidth, worldHeight, playerFillColor, myId, DEAD_PLAYER_HIDE_DELAY // NEW: Import DEAD_PLAYER_HIDE_DELAY
} from './main.js';

// --- Minimap Specific Constants ---
export const MINIMAP_SIZE = 150; // Increased size
export const MINIMAP_PADDING = 20; // Consistent padding
export const MINIMAP_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.5)"; // Background color
// No minimapBorderColor as the outline is removed

/**
 * Draws the minimap on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {HTMLCanvasElement} canvas - The main game canvas element.
 * @param {Object} players - The object containing all player data.
 * @param {string} myId - The ID of the current player.
 * @param {number} worldWidth - The width of the game world.
 * @param {number} worldHeight - The height of the game world.
 */
export function drawMinimap(ctx, canvas, players, myId, worldWidth, worldHeight) {
    const minimapX = MINIMAP_PADDING;
    const minimapY = canvas.height - MINIMAP_SIZE - MINIMAP_PADDING;
    const now = Date.now(); // Get current time for checking death delay

    // Draw minimap background
    ctx.fillStyle = MINIMAP_BACKGROUND_COLOR;
    ctx.fillRect(minimapX, minimapY, MINIMAP_SIZE, MINIMAP_SIZE);

    // Calculate scaling factors for minimap
    const scaleX = MINIMAP_SIZE / worldWidth;
    const scaleY = MINIMAP_SIZE / worldHeight;

    // Draw players on the minimap
    for (const id in players) {
        const p = players[id];

        // Only draw player if they are not dead, OR if they are dead but still within the hide delay
        if (!p.isDead || (p.isDead && (now - p.deathTime < DEAD_PLAYER_HIDE_DELAY))) {
            const playerMinimapX = minimapX + p.visualX * scaleX;
            const playerMinimapY = minimapY + p.visualY * scaleY;
            ctx.fillStyle = (id === myId) ? 'white' : playerFillColor;
            ctx.globalAlpha = p.isDead ? 0.5 : 1.0; // Still show as semi-transparent if dead
            ctx.beginPath();
            ctx.arc(playerMinimapX, playerMinimapY, 3, 0, Math.PI * 2); // Player dots
            ctx.fill();
            ctx.globalAlpha = 1.0; // Reset alpha
        }
    }
}
