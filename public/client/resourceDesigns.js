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
        case RESOURCE_TYPES.FOOD: moomooType = 1; break;
        case RESOURCE_TYPES.STONE: moomooType = 2; break;
        // For gold, use an existing design or create a new one.
        // Assuming moomooType 3 is typically 'gold' or 'rare stone' in similar games,
        // we'll map it there for consistency with the provided 'moomooType == 2 || moomooType == 3' logic.
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
        // --- Debugging logs for sprite creation (NEW) ---
        console.log(`Creating sprite for type: ${obj.type} (moomooType: ${moomooType})`);
        console.log(`Passed dimensions: tmpScale=${tmpScale}, outlineWidth=${resourceOutlineWidth}`);

        const tmpCanvas = document.createElement('canvas');
        // Canvas size needs to be large enough for the largest resource (tree)
        // Ensure sufficient padding for drawing and outline.
        tmpCanvas.width = tmpCanvas.height = tmpScale * 3.5 + resourceOutlineWidth * 4; // Very generous buffer
        
        // --- Debugging logs for canvas dimensions (NEW) ---
        console.log(`Canvas dimensions: width=${tmpCanvas.width}, height=${tmpCanvas.height}`);

        const tmpContext = tmpCanvas.getContext('2d');
        // Translate to the center of the new, larger canvas
        tmpContext.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
        tmpContext.rotate(UTILS.randFloat(0, Math.PI)); // Random rotation for some objects
        // Set default stroke and linewidth, but these will be overridden for the bush specific colors
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
        } else if (moomooType == 1) { // Food (Bush) - Plain Circle with adjusted berries
            const bushRadius = RESOURCE_PROPERTIES[RESOURCE_TYPES.FOOD].collisionRadius; // This is 70 from main.js

            // Bush colors
            const bushFillColor = '#437d38'; // Medium olive green from your image
            const bushOutlineColor = '#4F5942'; // Dark olive/purplish from your image
            const berryColor = '#A63A50'; // Dark reddish-pink from your image

            // Draw the main bush circle
            tmpContext.fillStyle = bushFillColor;
            tmpContext.strokeStyle = bushOutlineColor;
            tmpContext.lineWidth = resourceOutlineWidth;

            // Use renderCircle from utils.js, but ensure it fills AND strokes.
            tmpContext.beginPath();
            tmpContext.arc(0, 0, bushRadius, 0, 2 * Math.PI);
            tmpContext.fill();
            tmpContext.stroke();

            // Berries - 4 red circles, bigger and more inside
            tmpContext.fillStyle = berryColor;
            const berryCount = 4;
            const berryBaseRadius = bushRadius * 0.15; // Increased base radius for bigger berries (e.g., 10.5)
            const berryPlacementRadius = bushRadius * 0.4; // Berries placed closer to center (e.g., 28)

            for (let i = 0; i < berryCount; ++i) {
                const angle = (Math.PI * 2 / berryCount) * i + UTILS.randFloat(-0.1, 0.1); // Slight random angle offset for variety
                const berryX = berryPlacementRadius * Math.cos(angle);
                const berryY = berryPlacementRadius * Math.sin(angle);
                const currentBerryRadius = UTILS.randFloat(berryBaseRadius * 0.9, berryBaseRadius * 1.1); // Slight size variation

                // Draw the berry (fill only, no stroke on berries)
                tmpContext.beginPath();
                tmpContext.arc(berryX, berryY, currentBerryRadius, 0, 2 * Math.PI);
                tmpContext.fill();
            }

        } else if (moomooType == 2) { // Stone - UNCHANGED (moomooType 2)
            tmpContext.fillStyle = (biomeID == 2 ? '#938d77' : '#939393'); // Original stone color
            renderStar(tmpContext, 3, tmpScale, tmpScale);
            tmpContext.fill();
            tmpContext.stroke();
            tmpContext.fillStyle = (biomeID == 2 ? '#b2ab90' : '#bcbcbc'); // Lighter stone accent
            renderStar(tmpContext, 3, tmpScale * 0.55, tmpScale * 0.65);
            tmpContext.fill();
        } else if (moomooType == 3) { // Gold - NEW (moomooType 3)
            // Gold nugget / jagged rock appearance
            //tmpContext.fillStyle = '#FFD700'; // Gold color
            //tmpContext.strokeStyle = '#B8860B'; // Darker gold outline
            //tmpContext.lineWidth = resourceOutlineWidth;


            //tmpContext.fillStyle = '#DAA520'; // A slightly darker gold for inner details


            //tmpContext.fillStyle = '#FFF8DC'; // A very light gold for highlights

          
           tmpContext.fillStyle = '#FFD700'; // Original stone color
            renderStar(tmpContext, 3, tmpScale, tmpScale);
            tmpContext.fill();
            tmpContext.stroke();
            tmpContext.fillStyle = '#FFF8DC'; // Lighter stone accent
            renderStar(tmpContext, 3, tmpScale * 0.55, tmpScale * 0.65);
            tmpContext.fill();
        }
        tmpSprite = tmpCanvas;
        gameObjectSprites[tmpIndex] = tmpSprite;
    }
    return tmpSprite;
}
