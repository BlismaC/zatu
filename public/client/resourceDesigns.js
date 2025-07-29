// --- Imports from utils.js ---
import { UTILS, renderCircle, renderStar, renderBlob } from './utils.js';

// --- Imports from main.js (Constants, specifically RESOURCE_TYPES) ---
import { RESOURCE_TYPES, RESOURCE_PROPERTIES } from './main.js'; // Explicitly import RESOURCE_TYPES and RESOURCE_PROPERTIES

// Cache for generated game object sprites
let gameObjectSprites = {};

// Function to get or create a resource sprite based on Moomoo.io logic
// Now accepts resourceDrawSize, resourceOutlineColor, resourceOutlineWidth as arguments.
export function getResSprite(obj, resourceDrawSize, resourceOutlineColor, resourceOutlineWidth) {
    // biomeID is always 0 (grass biome) and isNight is false, as per user request to ignore specific biome/day-night logic
    const biomeID = 0;
    const isNight = false;
    
    // Map our RESOURCE_TYPES to Moomoo.io numerical types for design logic
    let moomooType;
    
    // --- IMPORTANT FIX: Use imported RESOURCE_TYPES constants for matching ---
    switch (obj.type) {
        case RESOURCE_TYPES.WOOD: moomooType = 0; break;
        case RESOURCE_TYPES.FOOD: moomooType = 1; break; // This is now for 'food' like wheat
        case RESOURCE_TYPES.STONE: moomooType = 2; break;
        case RESOURCE_TYPES.GOLD: moomooType = 3; break;
        default: moomooType = 0; // Fallback
    }

    // Use the passed-in resourceDrawSize as the 'scale'
    // NOTE: For resources, RESOURCE_DRAW_SIZE (100) is passed as tmpScale.
    // Individual resource properties (like collisionRadius) should be used for specific sizing.
    const tmpScale = resourceDrawSize;

    const tmpIndex = moomooType + '_' + tmpScale + '_' + biomeID;
    let tmpSprite = gameObjectSprites[tmpIndex];

    if (!tmpSprite) {
        const tmpCanvas = document.createElement('canvas');
        // Canvas size needs to be large enough for the largest resource (tree)
        // Ensure sufficient padding for drawing and outline.
        tmpCanvas.width = tmpCanvas.height = tmpScale * 3.5 + resourceOutlineWidth * 4; // Very generous buffer
        
        const tmpContext = tmpCanvas.getContext('2d');
        // Translate to the center of the new, larger canvas
        tmpContext.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
        tmpContext.rotate(UTILS.randFloat(0, Math.PI)); // Random rotation for some objects
        // Set default stroke and linewidth, but these will be overridden for specific colors
        tmpContext.strokeStyle = resourceOutlineColor;
        tmpContext.lineWidth = resourceOutlineWidth;

        if (moomooType == 0) { // Wood (Tree) - UNCHANGED
            const tmpCount = UTILS.randInt(5, 7);
            tmpContext.globalAlpha = isNight ? 0.6 : 0.8;

            // Foliage
            const foliageVerticalOffset = 0;
            for (let i = 0; i < 2; ++i) {
                const currentScale = tmpScale * (!i ? 1.5 : 1.0);
                tmpContext.save();
                tmpContext.translate(0, foliageVerticalOffset);
                renderStar(tmpContext, tmpCount, currentScale, currentScale * 0.7);
                tmpContext.fillStyle = !biomeID
                    ? (!i ? '#4CAF50' : '#3D8E41')
                    : (!i ? '#e3f1f4' : '#fff');
                tmpContext.fill();
                if (!i) {
                    tmpContext.stroke();
                    tmpContext.globalAlpha = 1;
                }
                tmpContext.restore();
            }
        } else if (moomooType == 1) { // Food (Wheat Bush) - NEW DESIGN
            const wheatBaseWidth = RESOURCE_PROPERTIES[RESOURCE_TYPES.FOOD].collisionRadius * 0.8; // e.g., ~56px
            const wheatBaseHeight = RESOURCE_PROPERTIES[RESOURCE_TYPES.FOOD].collisionRadius * 1.5; // e.g., ~105px
            const stemColor = '#6B8E23'; // Olive green for stems
            const headColor = '#DAA520'; // Goldenrod for wheat heads
            const innerHeadColor = '#FFD700'; // Gold for highlights on heads
            const stemOutlineColor = '#4B5320'; // Darker green for stem outlines

            tmpContext.save();
            tmpContext.rotate(UTILS.randFloat(-0.05, 0.05)); // Slight random rotation for natural look

            const numStems = 3 + UTILS.randInt(0, 2); // 3 to 5 stems
            const stemGap = wheatBaseWidth / (numStems + 1);

            for (let i = 0; i < numStems; i++) {
                const stemX = (i - (numStems - 1) / 2) * stemGap;
                const stemHeight = wheatBaseHeight * UTILS.randFloat(0.9, 1.1);
                const stemWidth = resourceOutlineWidth * 2; // Thin stems

                // Draw stem
                tmpContext.fillStyle = stemColor;
                tmpContext.strokeStyle = stemOutlineColor;
                tmpContext.lineWidth = resourceOutlineWidth;
                tmpContext.beginPath();
                tmpContext.roundRect(stemX - stemWidth / 2, -stemHeight / 2, stemWidth, stemHeight, stemWidth / 2);
                tmpContext.fill();
                tmpContext.stroke();

                // Draw wheat head (a small blob/star at the top of the stem)
                const headRadius = stemWidth * 4; // Size of the wheat head
                tmpContext.fillStyle = headColor;
                tmpContext.strokeStyle = resourceOutlineColor;
                tmpContext.lineWidth = resourceOutlineWidth;
                tmpContext.beginPath();
                // Position head slightly above the stem
                tmpContext.ellipse(stemX, -stemHeight / 2 - headRadius * 0.4, headRadius, headRadius * 1.5, UTILS.randFloat(-0.2, 0.2), 0, Math.PI * 2);
                tmpContext.fill();
                tmpContext.stroke();

                // Add small inner detail for more texture
                tmpContext.fillStyle = innerHeadColor;
                tmpContext.beginPath();
                tmpContext.ellipse(stemX, -stemHeight / 2 - headRadius * 0.4, headRadius * 0.6, headRadius * 1.2, UTILS.randFloat(-0.2, 0.2), 0, Math.PI * 2);
                tmpContext.fill();
            }

            tmpContext.restore(); // Restore context after rotation and alpha changes

        } else if (moomooType == 2) { // Stone - UNCHANGED
            tmpContext.fillStyle = (biomeID == 2 ? '#938d77' : '#939393'); // Original stone color
            renderStar(tmpContext, 3, tmpScale, tmpScale);
            tmpContext.fill();
            tmpContext.stroke();
            tmpContext.fillStyle = (biomeID == 2 ? '#b2ab90' : '#bcbcbc'); // Lighter stone accent
            renderStar(tmpContext, 3, tmpScale * 0.55, tmpScale * 0.65);
            tmpContext.fill();
        } else if (moomooType == 3) { // Gold - UNCHANGED
            tmpContext.fillStyle = '#FFD700'; // Original gold color
            renderStar(tmpContext, 3, tmpScale, tmpScale);
            tmpContext.fill();
            tmpContext.stroke();
            tmpContext.fillStyle = '#FFF8DC'; // Lighter gold accent
            renderStar(tmpContext, 3, tmpScale * 0.55, tmpScale * 0.65);
            tmpContext.fill();
        }
        tmpSprite = tmpCanvas;
        gameObjectSprites[tmpIndex] = tmpSprite;
    }
    return tmpSprite;
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
