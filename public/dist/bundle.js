/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./public/client/damageText.js":
/*!*************************************!*\
  !*** ./public/client/damageText.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createDamageText: () => (/* binding */ createDamageText),
/* harmony export */   drawDamageTexts: () => (/* binding */ drawDamageTexts),
/* harmony export */   updateDamageTexts: () => (/* binding */ updateDamageTexts)
/* harmony export */ });
// damageText.js - Manages and renders floating damage text visuals

// --- Constants for Damage Text ---
const DAMAGE_TEXT_RISE_SPEED = 0.05; // Pixels per millisecond (adjust for desired speed)
const DAMAGE_TEXT_FADE_DURATION = 1000; // Milliseconds for text to fade out
const DAMAGE_TEXT_FONT_SIZE = 26; // Font size for damage numbers
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
function createDamageText(x, y, damageAmount, isOwnPlayer, cameraX, cameraY) {
  const displayX = x - cameraX;
  const displayY = y - cameraY;
  activeDamageTexts.push({
    value: Math.floor(damageAmount),
    // Display whole numbers for damage
    color: isOwnPlayer ? OWN_PLAYER_DAMAGE_COLOR : OPPONENT_DAMAGE_COLOR,
    initialDisplayX: displayX,
    initialDisplayY: displayY,
    currentDisplayY: displayY,
    // This will change as it rises
    startTime: Date.now(),
    alpha: 1 // Starts fully opaque
  });
}

/**
 * Updates the position and fade of all active damage text objects.
 * Should be called once per game loop frame.
 * @param {number} deltaTime - The time elapsed since the last frame in seconds.
 */
function updateDamageTexts(deltaTime) {
  const now = Date.now();
  activeDamageTexts = activeDamageTexts.filter(text => {
    const elapsedTime = now - text.startTime;

    // Calculate new vertical position (rises upwards)
    text.currentDisplayY = text.initialDisplayY - elapsedTime * DAMAGE_TEXT_RISE_SPEED;

    // Calculate new opacity (fades out)
    text.alpha = 1 - elapsedTime / DAMAGE_TEXT_FADE_DURATION;

    // Remove text if it has fully faded
    return text.alpha > 0;
  });
}

/**
 * Draws all active damage text objects on the canvas.
 * Should be called once per game loop frame after other game elements.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 */
function drawDamageTexts(ctx) {
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

/***/ }),

/***/ "./public/client/drawing.js":
/*!**********************************!*\
  !*** ./public/client/drawing.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   draw: () => (/* binding */ draw),
/* harmony export */   drawAgeingUI: () => (/* binding */ drawAgeingUI)
/* harmony export */ });
/* harmony import */ var _main_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./main.js */ "./public/client/main.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ "./public/client/utils.js");
/* harmony import */ var _resourceDesigns_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./resourceDesigns.js */ "./public/client/resourceDesigns.js");
/* harmony import */ var _map_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./map.js */ "./public/client/map.js");
// drawing.js - Handles all canvas drawing operations

// --- Imports from main.js (Constants and Global State Access) ---


// --- Imports from utils.js (Helper Functions) ---


// --- Imports from resourceDesigns.js (Resource Sprite Generation) ---


// --- NEW: Import drawMinimap from its dedicated file ---

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
function draw(ctx, canvas, players, myId, resources, cameraX, cameraY, deltaTime, currentPing, chatBubbleDuration, topKillerId) {
  // Clear canvas background with world border color
  ctx.fillStyle = _main_js__WEBPACK_IMPORTED_MODULE_0__.worldBorderColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const me = players[myId];
  // If 'me' is dead, we still want to draw the world where they died,
  // but we might not want to update their visual position or trail.
  // The main menu will cover the screen, so the game world behind it
  // can just stay static.
  // The check for `me.visualX === undefined` is still important for initial load.
  if (!me || me.visualX === undefined) {
    // If the player object isn't fully initialized yet, draw a static background
    ctx.fillStyle = _main_js__WEBPACK_IMPORTED_MODULE_0__.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return; // Exit early if player data isn't ready
  }

  // Player visual interpolation
  const interpFactor = 1 - Math.exp(-_main_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_SMOOTHING_FACTOR * deltaTime);
  const now = Date.now(); // Get current time once per frame for consistent timing

  for (const id in players) {
    const p = players[id];
    if (p.visualX !== undefined) {
      // Only update visual position and trail if player is NOT dead
      if (!p.isDead) {
        p.trail.push({
          x: p.x,
          y: p.y
        });
        if (p.trail.length > _main_js__WEBPACK_IMPORTED_MODULE_0__.TRAIL_LENGTH) {
          p.trail.shift();
        }
        p.visualX += (p.x - p.visualX) * interpFactor;
        p.visualY += (p.y - p.visualY) * interpFactor;
        p.visualAngle = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.lerpAngle)(p.visualAngle, p.angle, interpFactor);
      } else {
        // If player is dead, clear their trail and keep their visual position static
        p.trail = [];
        // Their visualX/Y should remain at the death spot, which is handled by not updating them here.
      }
      if (p.isSwinging && now - p.swingStartTime > _main_js__WEBPACK_IMPORTED_MODULE_0__.SWING_DURATION) {
        p.isSwinging = false;
        p.currentSwingingHand = null;
      }

      // Apply decay to player damage wiggle (only if currently wiggling)
      if (p.damageWiggleX !== 0 || p.damageWiggleY !== 0) {
        const decayFactor = Math.pow(_main_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_DAMAGE_WIGGLE_DECAY_RATE, deltaTime * 60); // decay per second
        p.damageWiggleX *= decayFactor;
        p.damageWiggleY *= decayFactor;
        // Snap to zero if very small to prevent indefinite tiny wiggles
        if (Math.abs(p.damageWiggleX) < 0.1) p.damageWiggleX = 0;
        if (Math.abs(p.damageWiggleY) < 0.1) p.damageWiggleY = 0;
      }

      // Handle chat message fade out
      if (p.lastMessage && now - p.messageDisplayTime > chatBubbleDuration) {
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
  ctx.fillStyle = _main_js__WEBPACK_IMPORTED_MODULE_0__.backgroundColor;
  ctx.fillRect(0, 0, _main_js__WEBPACK_IMPORTED_MODULE_0__.worldWidth, _main_js__WEBPACK_IMPORTED_MODULE_0__.worldHeight);
  drawGrid(ctx, canvas, cameraX, cameraY, _main_js__WEBPACK_IMPORTED_MODULE_0__.worldWidth, _main_js__WEBPACK_IMPORTED_MODULE_0__.worldHeight, _main_js__WEBPACK_IMPORTED_MODULE_0__.gridSize, _main_js__WEBPACK_IMPORTED_MODULE_0__.gridColor);

  // --- Corrected Drawing Order: Player Bodies/Names/Health -> Resources ---

  // 1. Draw Player Bodies (without names/health - these will be drawn later)
  // This ensures player base visuals are drawn first
  for (const id in players) {
    const p = players[id];
    // Only draw player if they are not dead OR if they are dead but still within the hide delay
    if (!p.isDead || p.isDead && now - p.deathTime < _main_js__WEBPACK_IMPORTED_MODULE_0__.DEAD_PLAYER_HIDE_DELAY) {
      drawPlayer(ctx, p, now); // Pass 'now' for hit flash
    }
  }

  // 2. Draw ALL Resources (Trees, Bushes, Stones) using their sprites
  // Resources are drawn AFTER players, so they appear on top
  for (const id in resources) {
    drawResource(ctx, resources[id], _main_js__WEBPACK_IMPORTED_MODULE_0__.RESOURCE_DRAW_SIZE, _main_js__WEBPACK_IMPORTED_MODULE_0__.RESOURCE_OUTLINE_COLOR, _main_js__WEBPACK_IMPORTED_MODULE_0__.RESOURCE_OUTLINE_WIDTH);
  }

  // 3. Draw Player Names and Health Bars AND Chat Bubbles (these should always be on top of everything else)
  for (const id in players) {
    const p = players[id];
    // Only draw player overlay if they are not dead OR if they are the top killer and alive (for skull icon)
    if (!p.isDead) {
      // If player is alive, draw their overlay
      drawPlayerOverlay(ctx, p, now, chatBubbleDuration, topKillerId); // Pass now, duration, and topKillerId
    } else if (p.isDead && now - p.deathTime < _main_js__WEBPACK_IMPORTED_MODULE_0__.DEAD_PLAYER_HIDE_DELAY) {
      // For recently dead players, you might still want names, but not health bars
      // For simplicity, let's keep overlays only for living players.
    }
  }
  ctx.restore(); // Restore context after camera translation

  // Draw UI elements (not affected by camera)
  // Only draw minimap, ping, and ageing UI if the player is NOT dead.
  // This prevents them from showing when the main menu is up.
  if (me && !me.isDead) {
    // Ensure 'me' exists before checking isDead
    (0,_map_js__WEBPACK_IMPORTED_MODULE_3__.drawMinimap)(ctx, canvas, players, myId, _main_js__WEBPACK_IMPORTED_MODULE_0__.worldWidth, _main_js__WEBPACK_IMPORTED_MODULE_0__.worldHeight); // Added worldWidth/Height as parameters for drawMinimap
    drawPingCounter(ctx, canvas, currentPing, _main_js__WEBPACK_IMPORTED_MODULE_0__.PING_FONT_SIZE, _main_js__WEBPACK_IMPORTED_MODULE_0__.PING_TEXT_COLOR, _main_js__WEBPACK_IMPORTED_MODULE_0__.PING_BACKGROUND_COLOR, _main_js__WEBPACK_IMPORTED_MODULE_0__.PING_BORDER_RADIUS, _main_js__WEBPACK_IMPORTED_MODULE_0__.PING_PADDING_X, _main_js__WEBPACK_IMPORTED_MODULE_0__.PING_PADDING_Y);
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
      const alpha = index / _main_js__WEBPACK_IMPORTED_MODULE_0__.TRAIL_LENGTH * _main_js__WEBPACK_IMPORTED_MODULE_0__.TRAIL_MAX_ALPHA;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(trailPoint.x, trailPoint.y, _main_js__WEBPACK_IMPORTED_MODULE_0__.playerBodyRadiusX, _main_js__WEBPACK_IMPORTED_MODULE_0__.playerBodyRadiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = _main_js__WEBPACK_IMPORTED_MODULE_0__.playerFillColor;
      ctx.fill();
    });
  }

  // Determine current player color and opacity based on hit flash
  const timeSinceDamage = now - p.lastDamageTime;
  let currentColor = _main_js__WEBPACK_IMPORTED_MODULE_0__.playerFillColor;
  let currentOutlineColor = _main_js__WEBPACK_IMPORTED_MODULE_0__.playerOutlineColor;
  let currentAlpha = 1.0;
  if (timeSinceDamage < _main_js__WEBPACK_IMPORTED_MODULE_0__.HIT_FLASH_DURATION) {
    // Apply hit flash color and opacity
    currentColor = _main_js__WEBPACK_IMPORTED_MODULE_0__.HIT_FLASH_COLOR;
    currentOutlineColor = _main_js__WEBPACK_IMPORTED_MODULE_0__.HIT_FLASH_COLOR;
    currentAlpha = _main_js__WEBPACK_IMPORTED_MODULE_0__.HIT_FLASH_OPACITY;
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
  ctx.lineWidth = _main_js__WEBPACK_IMPORTED_MODULE_0__.playerOutlineWidth;
  let handForwardOffsetRight = _main_js__WEBPACK_IMPORTED_MODULE_0__.handForwardOffset;
  let handForwardOffsetLeft = _main_js__WEBPACK_IMPORTED_MODULE_0__.handForwardOffset;
  let handSideOffsetRight = _main_js__WEBPACK_IMPORTED_MODULE_0__.handSideOffset;
  let handSideOffsetLeft = _main_js__WEBPACK_IMPORTED_MODULE_0__.handSideOffset;
  if (p.isSwinging && !p.isDead) {
    const swingProgress = (now - p.swingStartTime) / _main_js__WEBPACK_IMPORTED_MODULE_0__.SWING_DURATION;
    const punchProgress = Math.sin(swingProgress * Math.PI);
    if (p.currentSwingingHand === 'right') {
      handForwardOffsetRight += _main_js__WEBPACK_IMPORTED_MODULE_0__.SWING_REACH * punchProgress;
      handSideOffsetRight -= _main_js__WEBPACK_IMPORTED_MODULE_0__.handRadius * _main_js__WEBPACK_IMPORTED_MODULE_0__.SWING_INWARD_AMOUNT * punchProgress;
    } else if (p.currentSwingingHand === 'left') {
      handForwardOffsetLeft += _main_js__WEBPACK_IMPORTED_MODULE_0__.SWING_REACH * punchProgress;
      handSideOffsetLeft -= _main_js__WEBPACK_IMPORTED_MODULE_0__.handRadius * _main_js__WEBPACK_IMPORTED_MODULE_0__.SWING_INWARD_AMOUNT * punchProgress;
    }
  }

  // Draw right hand
  ctx.beginPath();
  ctx.arc(handForwardOffsetRight, handSideOffsetRight, _main_js__WEBPACK_IMPORTED_MODULE_0__.handRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw left hand
  ctx.beginPath();
  ctx.arc(handForwardOffsetLeft, -handSideOffsetLeft, _main_js__WEBPACK_IMPORTED_MODULE_0__.handRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw oval body
  ctx.beginPath();
  ctx.ellipse(0, 0, _main_js__WEBPACK_IMPORTED_MODULE_0__.playerBodyRadiusX, _main_js__WEBPACK_IMPORTED_MODULE_0__.playerBodyRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Function for drawing player name and health bar (always on top)
function drawPlayerOverlay(ctx, p, now, chatBubbleDuration, topKillerId) {
  // Added topKillerId parameter
  // Only draw health bar, name, and chat bubble if player is NOT dead
  if (p.isDead) return;

  // Draw Health Bar (always drawn relative to world coordinates, not player translation)
  // Note: p.visualX/Y are used here, they already account for camera and smoothing.
  if (typeof p.health === 'number') {
    const healthBarX = p.visualX - _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarWidth / 2;
    const healthBarY = p.visualY + _main_js__WEBPACK_IMPORTED_MODULE_0__.playerBodyRadiusY + _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarVerticalOffsetFromPlayerBottom;
    const healthPercentage = Math.max(0, p.health / _main_js__WEBPACK_IMPORTED_MODULE_0__.MAX_HEALTH);
    if (healthPercentage > 0) {
      // Only draw if health > 0
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarBackgroundColor;
      ctx.beginPath();
      ctx.roundRect(healthBarX, healthBarY, _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarWidth, _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarHeight, _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarBorderRadius);
      ctx.fill();
      ctx.fillStyle = (0,_utils_js__WEBPACK_IMPORTED_MODULE_1__.interpolateColor)(_main_js__WEBPACK_IMPORTED_MODULE_0__.lowHealthColor, _main_js__WEBPACK_IMPORTED_MODULE_0__.fullHealthColor, healthPercentage);
      ctx.beginPath();
      ctx.roundRect(healthBarX, healthBarY, _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarWidth * healthPercentage, _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarHeight, _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarBorderRadius);
      ctx.fill();
      ctx.strokeStyle = _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarOutlineColor;
      ctx.lineWidth = _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarOutlineWidth;
      ctx.beginPath();
      ctx.roundRect(healthBarX, healthBarY, _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarWidth, _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarHeight, _main_js__WEBPACK_IMPORTED_MODULE_0__.healthBarBorderRadius);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }
  // Draw Player Name
  ctx.globalAlpha = 1.0;
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.strokeText(p.name || "Unnamed", p.visualX, p.visualY - _main_js__WEBPACK_IMPORTED_MODULE_0__.playerBodyRadiusY - 25);
  ctx.fillStyle = "white";
  ctx.fillText(p.name || "Unnamed", p.visualX, p.visualY - _main_js__WEBPACK_IMPORTED_MODULE_0__.playerBodyRadiusY - 25);
  ctx.globalAlpha = 1.0;

  // NEW: Draw skull image if this player is the top killer and the image is loaded
  if (topKillerId && p.id === topKillerId && (p.inventory.kills || 0) > 0 && skullImage.complete && skullImage.naturalWidth > 0) {
    const skullWidth = 24; // Adjust size of the skull
    const skullHeight = 24; // Adjust size of the skull

    // Measure the name text to position the skull correctly
    const nameMetrics = ctx.measureText(p.name || "Unnamed");
    // Position the skull to the right of the player's name
    const skullDrawX = p.visualX + nameMetrics.width / 2 + 5; // 5px padding to the right of the name
    const skullDrawY = p.visualY - _main_js__WEBPACK_IMPORTED_MODULE_0__.playerBodyRadiusY - 25 - skullHeight / 2; // Vertically center with the name's baseline

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
    bubbleAlpha = 1.0 - (timeElapsed - fadeStartTime) / (chatBubbleDuration - fadeStartTime);
    bubbleAlpha = Math.max(0, Math.min(1, bubbleAlpha)); // Clamp between 0 and 1
  }
  if (bubbleAlpha <= 0) return; // Don't draw if fully transparent

  ctx.save();
  ctx.globalAlpha = bubbleAlpha;
  ctx.font = `${_main_js__WEBPACK_IMPORTED_MODULE_0__.CHAT_BUBBLE_FONT_SIZE}px Arial`;
  ctx.textAlign = "center"; // Already centered horizontally
  ctx.textBaseline = "middle"; // CORRECTED: This will center the text vertically in the bubble

  // Measure text to determine bubble size
  const textMetrics = ctx.measureText(p.lastMessage);
  const textWidth = textMetrics.width;
  const textHeight = _main_js__WEBPACK_IMPORTED_MODULE_0__.CHAT_BUBBLE_FONT_SIZE; // Approximate height based on font size

  const bubbleWidth = textWidth + _main_js__WEBPACK_IMPORTED_MODULE_0__.CHAT_BUBBLE_PADDING_X * 2;
  const bubbleHeight = textHeight + _main_js__WEBPACK_IMPORTED_MODULE_0__.CHAT_BUBBLE_PADDING_Y * 2;

  // Position the bubble above the player
  const bubbleX = p.visualX - bubbleWidth / 2;
  // Calculation for bubbleY now uses CHAT_BUBBLE_OFFSET_Y for consistent placement above player
  const bubbleY = p.visualY - _main_js__WEBPACK_IMPORTED_MODULE_0__.playerBodyRadiusY - _main_js__WEBPACK_IMPORTED_MODULE_0__.CHAT_BUBBLE_OFFSET_Y - bubbleHeight;

  // Draw bubble background
  ctx.fillStyle = _main_js__WEBPACK_IMPORTED_MODULE_0__.CHAT_BUBBLE_BACKGROUND_COLOR;
  ctx.beginPath();
  ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, _main_js__WEBPACK_IMPORTED_MODULE_0__.CHAT_BUBBLE_BORDER_RADIUS);
  ctx.fill();

  // Draw text - centered horizontally and vertically within the bubble's drawing area
  // For textBaseline "middle", the y-coordinate should be the vertical center of the text area.
  ctx.fillStyle = _main_js__WEBPACK_IMPORTED_MODULE_0__.CHAT_BUBBLE_TEXT_COLOR;
  ctx.fillText(p.lastMessage, p.visualX, bubbleY + bubbleHeight / 2);
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
  const resourceSprite = (0,_resourceDesigns_js__WEBPACK_IMPORTED_MODULE_2__.getResSprite)(resource, _main_js__WEBPACK_IMPORTED_MODULE_0__.RESOURCE_DRAW_SIZE, _main_js__WEBPACK_IMPORTED_MODULE_0__.RESOURCE_OUTLINE_COLOR, _main_js__WEBPACK_IMPORTED_MODULE_0__.RESOURCE_OUTLINE_WIDTH);
  if (resourceSprite) {
    // Ensure sprite exists before drawing
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
  const pingText = `${currentPing}ms`;
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
  const panelX = canvas.width / 2 - panelWidth / 2;
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
function drawAgeingUI(ctx, canvas, player) {
  if (!player || player.isDead) return; // Don't draw if player is dead

  // Calculate XP bar position (bottom-center)
  const xpBarX = canvas.width / 2 - XP_BAR_WIDTH / 2;
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

/***/ }),

/***/ "./public/client/hotbar.js":
/*!*********************************!*\
  !*** ./public/client/hotbar.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   activeSlotIndex: () => (/* binding */ activeSlotIndex),
/* harmony export */   addItemToHotbar: () => (/* binding */ addItemToHotbar),
/* harmony export */   drawHotbar: () => (/* binding */ drawHotbar),
/* harmony export */   getActiveItem: () => (/* binding */ getActiveItem),
/* harmony export */   handleHotbarInput: () => (/* binding */ handleHotbarInput),
/* harmony export */   hotbar: () => (/* binding */ hotbar),
/* harmony export */   initHotbar: () => (/* binding */ initHotbar),
/* harmony export */   removeActiveItem: () => (/* binding */ removeActiveItem),
/* harmony export */   setActiveSlotIndex: () => (/* binding */ setActiveSlotIndex)
/* harmony export */ });
// hotbar.js - Manages and renders the in-game hotbar

// --- Hotbar State ---
const NUM_SLOTS = 9; // Fixed number of hotbar slots
let hotbar = Array(NUM_SLOTS).fill(null); // Initialize all slots as empty
let activeSlotIndex = 0; // Declared with let, can be modified within this module

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

/**
 * Initializes the hotbar with some default items.
 */
function initHotbar() {
  addItemToHotbar({
    id: 'axe1',
    type: 'axe',
    iconSrc: 'axe',
    name: 'Stone Axe',
    quantity: 1
  });
  addItemToHotbar({
    id: 'wall1',
    type: 'wood_wall',
    iconSrc: 'wood_wall',
    name: 'Wood Wall',
    quantity: 5
  });
  addItemToHotbar({
    id: 'food1',
    type: 'food_ration',
    iconSrc: 'food_ration',
    name: 'Ration',
    quantity: 10
  });
  addItemToHotbar({
    id: 'sword1',
    type: 'sword',
    iconSrc: 'sword',
    name: 'Iron Sword',
    quantity: 1
  });
  console.log("Hotbar initialized:", hotbar);
}

/**
 * Draws the hotbar on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {HTMLCanvasElement} canvas - The HTML canvas element.
 */
function drawHotbar(ctx, canvas) {
  // Filter out null slots to only draw visible items
  const visibleSlots = hotbar.map((item, index) => item ? index : null).filter(i => i !== null);
  const numVisible = visibleSlots.length;
  if (numVisible === 0) return;

  // Calculate total width and starting position to center the hotbar
  const totalWidth = numVisible * HOTBAR_SLOT_SIZE + (numVisible - 1) * HOTBAR_SPACING;
  const startX = canvas.width / 2 - totalWidth / 2;
  const startY = canvas.height - HOTBAR_SLOT_SIZE - HOTBAR_PADDING;

  // Iterate over visible slots and draw each one
  visibleSlots.forEach((i, visibleIndex) => {
    const slotX = startX + visibleIndex * (HOTBAR_SLOT_SIZE + HOTBAR_SPACING);
    const slotY = startY;
    const item = hotbar[i];
    const isCurrentActive = i === activeSlotIndex;
    ctx.save(); // Save the current drawing state

    // Apply general hotbar slot styling
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = HOTBAR_BACKGROUND_COLOR;
    ctx.strokeStyle = isCurrentActive ? HOTBAR_ACTIVE_BORDER_COLOR : HOTBAR_BORDER_COLOR;
    ctx.lineWidth = isCurrentActive ? HOTBAR_ACTIVE_BORDER_WIDTH : HOTBAR_BORDER_WIDTH;

    // Draw the rounded rectangle for the slot
    ctx.beginPath();
    ctx.roundRect(slotX, slotY, HOTBAR_SLOT_SIZE, HOTBAR_SLOT_SIZE, 10);
    ctx.fill();
    ctx.stroke();

    // Draw item icon (emoji placeholder)
    ctx.font = `${HOTBAR_SLOT_SIZE * 0.5}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(PLACEHOLDER_ICONS[item.iconSrc] || '❓', slotX + HOTBAR_SLOT_SIZE / 2, slotY + HOTBAR_SLOT_SIZE / 2);

    // Draw item quantity if greater than 1
    if (item.quantity > 1) {
      ctx.font = `${HOTBAR_ITEM_FONT_SIZE}px 'Press Start 2P'`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = HOTBAR_ITEM_TEXT_COLOR;
      ctx.fillText(item.quantity, slotX + HOTBAR_SLOT_SIZE - 4, slotY + HOTBAR_SLOT_SIZE - 4);
    }

    // Draw slot number (1-9)
    ctx.font = `${HOTBAR_KEY_FONT_SIZE}px 'Press Start 2P'`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = HOTBAR_KEY_COLOR;
    ctx.fillText(`${i + 1}`, slotX + 4, slotY + 4);
    ctx.restore(); // Restore the previous drawing state
  });
}

/**
 * Handles keyboard input for hotbar selection.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function handleHotbarInput(e) {
  // Prevent hotbar input if an input field is active
  if (document.activeElement.tagName === 'INPUT') return;
  const key = e.key;
  const numKey = parseInt(key, 10);
  // If a number key from 1 to NUM_SLOTS is pressed, set active slot
  if (numKey >= 1 && numKey <= NUM_SLOTS) {
    setActiveSlotIndex(numKey - 1); // Use the new setter function
    e.preventDefault(); // Prevent default browser behavior (e.g., scrolling)
  }
}

/**
 * Adds an item to the hotbar. If an item of the same type exists and has quantity,
 * it increments the quantity. Otherwise, it finds an empty slot.
 * @param {object} item - The item to add. Must have `id`, `type`, `iconSrc`, `name`, `quantity`.
 * @returns {boolean} True if the item was added, false otherwise.
 */
function addItemToHotbar(item) {
  if (!item || !item.type) return false;

  // Try to stack with an existing item of the same type
  for (let i = 0; i < NUM_SLOTS; i++) {
    const existingItem = hotbar[i];
    if (existingItem && existingItem.type === item.type && typeof existingItem.quantity === 'number') {
      existingItem.quantity += item.quantity;
      return true;
    }
  }

  // Find an empty slot if no stacking occurred
  const emptyIndex = hotbar.indexOf(null);
  if (emptyIndex !== -1) {
    hotbar[emptyIndex] = {
      ...item
    }; // Add a copy of the item
    return true;
  }
  return false; // No space or existing stackable item
}

/**
 * Returns the item currently in the active hotbar slot.
 * @returns {object|null} The active item object, or null if the slot is empty.
 */
function getActiveItem() {
  return hotbar[activeSlotIndex];
}

/**
 * Removes a specified quantity from the active item. If quantity falls to 0 or less,
 * the slot becomes empty.
 * @param {number} quantityToRemove - The amount to remove. Defaults to 1.
 * @returns {boolean} True if items were removed, false otherwise (e.g., not enough quantity).
 */
function removeActiveItem(quantityToRemove = 1) {
  const item = hotbar[activeSlotIndex];
  if (!item) return false; // No item in the active slot

  if (typeof item.quantity === 'number') {
    if (item.quantity >= quantityToRemove) {
      item.quantity -= quantityToRemove;
      if (item.quantity <= 0) {
        hotbar[activeSlotIndex] = null; // Clear slot if quantity is zero or less
      }
      return true;
    }
    return false; // Not enough quantity to remove
  }

  // If item has no quantity property, just remove it
  hotbar[activeSlotIndex] = null;
  return true;
}

/**
 * Sets the active hotbar slot index.
 * This function is exposed to allow other modules to change the active slot.
 * @param {number} index - The new active slot index.
 */
function setActiveSlotIndex(index) {
  if (index >= 0 && index < NUM_SLOTS) {
    activeSlotIndex = index;
  } else {
    console.warn(`Attempted to set activeSlotIndex to out-of-bounds value: ${index}`);
  }
}

// Add roundRect for canvas context if not available (polyfill)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    if (typeof radius === 'number') radius = {
      tl: radius,
      tr: radius,
      br: radius,
      bl: radius
    };else radius = Object.assign({
      tl: 0,
      tr: 0,
      br: 0,
      bl: 0
    }, radius);
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

// Export hotbar and the new setter function
 // Removed activeSlotIndex direct export

/***/ }),

/***/ "./public/client/leaderboard.js":
/*!**************************************!*\
  !*** ./public/client/leaderboard.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initLeaderboard: () => (/* binding */ initLeaderboard),
/* harmony export */   updateLeaderboard: () => (/* binding */ updateLeaderboard)
/* harmony export */ });
let leaderboardContainer;
let leaderboardList;
function initLeaderboard() {
  leaderboardContainer = document.getElementById('leaderboardContainer');
  leaderboardList = document.getElementById('leaderboardList');
  if (!leaderboardContainer || !leaderboardList) {
    console.error("leaderboard not loading");
    return;
  }
}

/**
 * @param {object} players 
 * @param {string} myId 
 */
function updateLeaderboard(players, myId) {
  if (!leaderboardList) {
    console.warn("lLeaderboard list");
    return;
  }
  const sortedPlayers = Object.values(players).filter(player => !player.isDead).sort((a, b) => (b.inventory.gold || 0) - (a.inventory.gold || 0));
  leaderboardList.innerHTML = '';

  // Add top 10 players to the list
  for (let i = 0; i < Math.min(sortedPlayers.length, 10); i++) {
    const player = sortedPlayers[i];
    const listItem = document.createElement('li');
    const rankSpan = document.createElement('span');
    rankSpan.classList.add('rank');
    rankSpan.textContent = `${i + 1}.`;
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('name');
    nameSpan.textContent = player.name || "Unnamed";
    if (player.id === myId) {
      nameSpan.style.fontWeight = 'bold';
      nameSpan.style.color = 'white';
    } else {
      nameSpan.style.color = '#AAAAAA';
    }
    const goldSpan = document.createElement('span');
    goldSpan.classList.add('gold');
    goldSpan.textContent = Math.floor(player.inventory.gold || 0);
    listItem.appendChild(rankSpan);
    listItem.appendChild(nameSpan);
    listItem.appendChild(goldSpan);
    leaderboardList.appendChild(listItem);
  }
}

/***/ }),

/***/ "./public/client/main.js":
/*!*******************************!*\
  !*** ./public/client/main.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CHAT_BUBBLE_BACKGROUND_COLOR: () => (/* binding */ CHAT_BUBBLE_BACKGROUND_COLOR),
/* harmony export */   CHAT_BUBBLE_BORDER_RADIUS: () => (/* binding */ CHAT_BUBBLE_BORDER_RADIUS),
/* harmony export */   CHAT_BUBBLE_DURATION: () => (/* binding */ CHAT_BUBBLE_DURATION),
/* harmony export */   CHAT_BUBBLE_FONT_SIZE: () => (/* binding */ CHAT_BUBBLE_FONT_SIZE),
/* harmony export */   CHAT_BUBBLE_OFFSET_Y: () => (/* binding */ CHAT_BUBBLE_OFFSET_Y),
/* harmony export */   CHAT_BUBBLE_PADDING_X: () => (/* binding */ CHAT_BUBBLE_PADDING_X),
/* harmony export */   CHAT_BUBBLE_PADDING_Y: () => (/* binding */ CHAT_BUBBLE_PADDING_Y),
/* harmony export */   CHAT_BUBBLE_TEXT_COLOR: () => (/* binding */ CHAT_BUBBLE_TEXT_COLOR),
/* harmony export */   COUNTER_BACKGROUND_COLOR: () => (/* binding */ COUNTER_BACKGROUND_COLOR),
/* harmony export */   COUNTER_BORDER_RADIUS: () => (/* binding */ COUNTER_BORDER_RADIUS),
/* harmony export */   COUNTER_FONT_SIZE: () => (/* binding */ COUNTER_FONT_SIZE),
/* harmony export */   COUNTER_ICON_SIZE: () => (/* binding */ COUNTER_ICON_SIZE),
/* harmony export */   COUNTER_LINE_HEIGHT: () => (/* binding */ COUNTER_LINE_HEIGHT),
/* harmony export */   COUNTER_PADDING: () => (/* binding */ COUNTER_PADDING),
/* harmony export */   COUNTER_TEXT_COLOR: () => (/* binding */ COUNTER_TEXT_COLOR),
/* harmony export */   DEAD_PLAYER_HIDE_DELAY: () => (/* binding */ DEAD_PLAYER_HIDE_DELAY),
/* harmony export */   GATHER_WIGGLE: () => (/* binding */ GATHER_WIGGLE),
/* harmony export */   HIT_FLASH_COLOR: () => (/* binding */ HIT_FLASH_COLOR),
/* harmony export */   HIT_FLASH_DURATION: () => (/* binding */ HIT_FLASH_DURATION),
/* harmony export */   HIT_FLASH_OPACITY: () => (/* binding */ HIT_FLASH_OPACITY),
/* harmony export */   MAX_HEALTH: () => (/* binding */ MAX_HEALTH),
/* harmony export */   PING_BACKGROUND_COLOR: () => (/* binding */ PING_BACKGROUND_COLOR),
/* harmony export */   PING_BORDER_RADIUS: () => (/* binding */ PING_BORDER_RADIUS),
/* harmony export */   PING_FONT_SIZE: () => (/* binding */ PING_FONT_SIZE),
/* harmony export */   PING_INTERVAL: () => (/* binding */ PING_INTERVAL),
/* harmony export */   PING_PADDING_X: () => (/* binding */ PING_PADDING_X),
/* harmony export */   PING_PADDING_Y: () => (/* binding */ PING_PADDING_Y),
/* harmony export */   PING_TEXT_COLOR: () => (/* binding */ PING_TEXT_COLOR),
/* harmony export */   PLAYER_DAMAGE_WIGGLE_DECAY_RATE: () => (/* binding */ PLAYER_DAMAGE_WIGGLE_DECAY_RATE),
/* harmony export */   PLAYER_DAMAGE_WIGGLE_STRENGTH: () => (/* binding */ PLAYER_DAMAGE_WIGGLE_STRENGTH),
/* harmony export */   PLAYER_SMOOTHING_FACTOR: () => (/* binding */ PLAYER_SMOOTHING_FACTOR),
/* harmony export */   RESOURCE_DRAW_SIZE: () => (/* binding */ RESOURCE_DRAW_SIZE),
/* harmony export */   RESOURCE_OUTLINE_COLOR: () => (/* binding */ RESOURCE_OUTLINE_COLOR),
/* harmony export */   RESOURCE_OUTLINE_WIDTH: () => (/* binding */ RESOURCE_OUTLINE_WIDTH),
/* harmony export */   RESOURCE_PROPERTIES: () => (/* binding */ RESOURCE_PROPERTIES),
/* harmony export */   RESOURCE_TYPES: () => (/* binding */ RESOURCE_TYPES),
/* harmony export */   SWING_DURATION: () => (/* binding */ SWING_DURATION),
/* harmony export */   SWING_INWARD_AMOUNT: () => (/* binding */ SWING_INWARD_AMOUNT),
/* harmony export */   SWING_REACH: () => (/* binding */ SWING_REACH),
/* harmony export */   TRAIL_LENGTH: () => (/* binding */ TRAIL_LENGTH),
/* harmony export */   TRAIL_MAX_ALPHA: () => (/* binding */ TRAIL_MAX_ALPHA),
/* harmony export */   backgroundColor: () => (/* binding */ backgroundColor),
/* harmony export */   cameraLerpFactor: () => (/* binding */ cameraLerpFactor),
/* harmony export */   cameraX: () => (/* binding */ cameraX),
/* harmony export */   cameraY: () => (/* binding */ cameraY),
/* harmony export */   currentPing: () => (/* binding */ currentPing),
/* harmony export */   deltaTime: () => (/* binding */ deltaTime),
/* harmony export */   fullHealthColor: () => (/* binding */ fullHealthColor),
/* harmony export */   gridColor: () => (/* binding */ gridColor),
/* harmony export */   gridSize: () => (/* binding */ gridSize),
/* harmony export */   handForwardOffset: () => (/* binding */ handForwardOffset),
/* harmony export */   handRadius: () => (/* binding */ handRadius),
/* harmony export */   handSideOffset: () => (/* binding */ handSideOffset),
/* harmony export */   healthBarBackgroundColor: () => (/* binding */ healthBarBackgroundColor),
/* harmony export */   healthBarBorderRadius: () => (/* binding */ healthBarBorderRadius),
/* harmony export */   healthBarHeight: () => (/* binding */ healthBarHeight),
/* harmony export */   healthBarOutlineColor: () => (/* binding */ healthBarOutlineColor),
/* harmony export */   healthBarOutlineWidth: () => (/* binding */ healthBarOutlineWidth),
/* harmony export */   healthBarVerticalOffsetFromPlayerBottom: () => (/* binding */ healthBarVerticalOffsetFromPlayerBottom),
/* harmony export */   healthBarWidth: () => (/* binding */ healthBarWidth),
/* harmony export */   lowHealthColor: () => (/* binding */ lowHealthColor),
/* harmony export */   minimapBackgroundColor: () => (/* binding */ minimapBackgroundColor),
/* harmony export */   minimapBorderColor: () => (/* binding */ minimapBorderColor),
/* harmony export */   minimapPadding: () => (/* binding */ minimapPadding),
/* harmony export */   minimapSize: () => (/* binding */ minimapSize),
/* harmony export */   myId: () => (/* binding */ myId),
/* harmony export */   playerBodyRadiusX: () => (/* binding */ playerBodyRadiusX),
/* harmony export */   playerBodyRadiusY: () => (/* binding */ playerBodyRadiusY),
/* harmony export */   playerFillColor: () => (/* binding */ playerFillColor),
/* harmony export */   playerOutlineColor: () => (/* binding */ playerOutlineColor),
/* harmony export */   playerOutlineWidth: () => (/* binding */ playerOutlineWidth),
/* harmony export */   players: () => (/* binding */ players),
/* harmony export */   resources: () => (/* binding */ resources),
/* harmony export */   worldBorderColor: () => (/* binding */ worldBorderColor),
/* harmony export */   worldHeight: () => (/* binding */ worldHeight),
/* harmony export */   worldWidth: () => (/* binding */ worldWidth)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./public/client/utils.js");
/* harmony import */ var _drawing_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./drawing.js */ "./public/client/drawing.js");
/* harmony import */ var _leaderboard_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./leaderboard.js */ "./public/client/leaderboard.js");
/* harmony import */ var _hotbar_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./hotbar.js */ "./public/client/hotbar.js");
/* harmony import */ var _weaponSelectionUI_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./weaponSelectionUI.js */ "./public/client/weaponSelectionUI.js");
/* harmony import */ var _damageText_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./damageText.js */ "./public/client/damageText.js");
// --- Global Variables ---
let socket;
let myId; // Export myId
let players = {}; // Export players
let resources = {}; // Export resources
let playerName = "";

// --- HTML Elements ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const mainMenu = document.getElementById("mainMenu");
const playerNameInput = document.getElementById("playerNameInput");
const startGameButton = document.getElementById("startGameButton");
const mainMenuBackground = document.getElementById('mainMenuBackground'); // Get reference to the background div

// Local Chat UI Element
let localChatInput;

// Resource Counter Elements
const resourceCounterContainer = document.getElementById('resourceCounterContainer');
const leaderboardContainer = document.getElementById('leaderboardContainer');

// --- Game Constants ---
const worldWidth = 10000; // Export
const worldHeight = 10000; // Export
const MAX_HEALTH = 100; // Export
const cameraLerpFactor = 0.01; // Export
const PLAYER_SMOOTHING_FACTOR = 15; // Export
const TRAIL_LENGTH = 10; // Export
const TRAIL_MAX_ALPHA = 0.3; // Export
const playerBodyRadiusX = 30; // Export
const playerBodyRadiusY = 30; // Export
const handRadius = 14; // Export
const handSideOffset = playerBodyRadiusY - handRadius * 0.3; // Export
const handForwardOffset = playerBodyRadiusX * 0.6; // Export
const SWING_DURATION = 250; // Export
const SWING_REACH = 40; // Export
const SWING_INWARD_AMOUNT = 0.5; // Export
const healthBarWidth = 80; // Export
const healthBarHeight = 12; // Export
const healthBarVerticalOffsetFromPlayerBottom = 15; // Export
const healthBarBorderRadius = 6; // Export
const fullHealthColor = "#5CB85C"; // Export
const lowHealthColor = "#FF0000"; // Export
const healthBarBackgroundColor = "rgba(128, 128, 128, 0.5)"; // Export
const healthBarOutlineColor = "black"; // Export
const healthBarOutlineWidth = 2; // Export

// Aesthetic green colors
const backgroundColor = "#4a6741"; // Export
const worldBorderColor = "#3D8E41"; // Export
const gridColor = backgroundColor; // Export

const playerFillColor = "#6f4e37"; // Export
const playerOutlineColor = "black"; // Export
const playerOutlineWidth = 3; // Export
const gridSize = 50; // Export
const minimapSize = 200; // Export
const minimapPadding = 20; // Export
const minimapBackgroundColor = "rgba(0, 0, 0, 0.5)"; // Export
const minimapBorderColor = "#FFF"; // Export

// Resource Visual Constants
const RESOURCE_TYPES = {
  // Export
  WOOD: 'wood',
  STONE: 'stone',
  FOOD: 'food',
  GOLD: 'gold'
};
const RESOURCE_PROPERTIES = {
  [RESOURCE_TYPES.WOOD]: {
    collectionAmount: 1,
    xpReward: 7.5,
    collisionRadius: 100,
    hitRadius: 120
  },
  [RESOURCE_TYPES.STONE]: {
    collectionAmount: 1,
    xpReward: 7.5,
    collisionRadius: 100,
    hitRadius: 120
  },
  [RESOURCE_TYPES.FOOD]: {
    // Bush properties
    collectionAmount: 1,
    xpReward: 7.5,
    collisionRadius: 70,
    hitRadius: 90
  },
  [RESOURCE_TYPES.GOLD]: {
    // Gold properties
    collectionAmount: 10,
    xpReward: 15.0,
    collisionRadius: 100,
    hitRadius: 120
  }
};
const RESOURCE_OUTLINE_COLOR = "black"; // Export
const RESOURCE_OUTLINE_WIDTH = 2; // Export
const RESOURCE_DRAW_SIZE = 100; // Export (This is used as tmpScale in resourceDesigns)

// Wiggle Constants for resources
const GATHER_WIGGLE = 10; // Export

// Resource Counter UI Constants (these are handled by HTML/CSS now, but keeping in sync for consistency)
const COUNTER_PADDING = 20; // Export
const COUNTER_LINE_HEIGHT = 30; // Export
const COUNTER_FONT_SIZE = 24; // Export
const COUNTER_TEXT_COLOR = "white"; // Export
const COUNTER_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.6)"; // Export
const COUNTER_BORDER_RADIUS = 10; // Export
const COUNTER_ICON_SIZE = 20; // Export

// Ping Counter Constants
const PING_INTERVAL = 2000; // Export
const PING_FONT_SIZE = 22; // Export
const PING_TEXT_COLOR = "white"; // Export
const PING_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.6)"; // Export
const PING_BORDER_RADIUS = 8; // Export
const PING_PADDING_X = 16; // Export
const PING_PADDING_Y = 8; // Export

// Player Damage Visual Constants
const PLAYER_DAMAGE_WIGGLE_STRENGTH = 10; // Export
const PLAYER_DAMAGE_WIGGLE_DECAY_RATE = 0.8; // Export
const HIT_FLASH_DURATION = 150; // Adjusted: How long the hit flash lasts in milliseconds (shorter)
const HIT_FLASH_COLOR = "#FF0000"; // The color of the hit flash (Red)
const HIT_FLASH_OPACITY = 0.5; // The opacity of the hit flash

// NEW: Chat Bubble Constants
const CHAT_BUBBLE_DURATION = 5000; // How long a chat message bubble stays visible (5 seconds)
const CHAT_BUBBLE_OFFSET_Y = 80; // Offset from player Y to top of bubble
const CHAT_BUBBLE_FONT_SIZE = 20;
const CHAT_BUBBLE_TEXT_COLOR = "#CCCCCC"; // Lighter gray
const CHAT_BUBBLE_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.7)";
const CHAT_BUBBLE_PADDING_X = 15;
const CHAT_BUBBLE_PADDING_Y = 10;
const CHAT_BUBBLE_BORDER_RADIUS = 10;

// NEW: Dead Player Hide Delay
const DEAD_PLAYER_HIDE_DELAY = 10000; // 10 seconds in milliseconds

// --- Game State Variables ---
let cameraX = 0; // Export
let cameraY = 0; // Export
let mouseX = 0;
let mouseY = 0;
const keys = {};
let isLeftMouseDown = false;
let isRightMouseDown = false;
let lastTime = 0;
let deltaTime = 0; // Export
let currentPing = 0; // Export
let pingSendTime = 0;

// --- Helper Functions (Imports) ---







// --- Event Listeners ---
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', e => {
  const me = players[myId];
  const isChatInputFocused = localChatInput && document.activeElement === localChatInput;

  // First, check if the click was handled by the weapon selection UI (top bar)
  // Only allow interaction if player is alive and chat is not focused.
  if (me && !me.isDead && !isChatInputFocused) {
    const clickHandledByWeaponUI = (0,_weaponSelectionUI_js__WEBPACK_IMPORTED_MODULE_4__.handleWeaponSelectionClick)(e, me, socket);
    if (clickHandledByWeaponUI) {
      e.stopPropagation(); // Prevent other click handlers if a weapon slot was clicked
      return;
    }
  }

  // Existing logic for setting mouse button state
  if (e.button === 0) {
    isLeftMouseDown = true;
  } else if (e.button === 2) {
    // Right mouse button
    isRightMouseDown = true;
    e.preventDefault(); // Prevent context menu
  }

  // Logic for respawning (applies to both left and right click anywhere on canvas if dead)
  if (me && me.isDead) {
    socket.emit('respawn');
  }
});
canvas.addEventListener('mouseup', e => {
  // Reset state for both left and right mouse buttons
  if (e.button === 0) {
    isLeftMouseDown = false;
  } else if (e.button === 2) {
    // Right mouse button
    isRightMouseDown = false;
  }
});

// Prevent context menu on right-click anywhere on the canvas
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
});
startGameButton.addEventListener("click", startGame);
playerNameInput.addEventListener("keypress", e => {
  if (e.key === "Enter") startGame();
});
let lastEnterPressTime = 0;
const ENTER_DEBOUNCE_DELAY = 200; // Milliseconds to wait between 'Enter' presses

/**
 * Toggles the visibility of the local chat input.
 * Also manages pointer events to make it interactive or non-interactive.
 * @param {boolean} show - True to show, false to hide.
 */
function toggleChatInputVisibility(show) {
  if (localChatInput) {
    if (show) {
      localChatInput.value = ''; // Always clear input when opening
      localChatInput.style.opacity = '1';
      localChatInput.style.pointerEvents = 'auto';
      localChatInput.focus();
      for (const key in keys) {
        keys[key] = false;
      }
      console.log("Chat input shown and focused. Player movement stopped.");
    } else {
      localChatInput.style.opacity = '0';
      localChatInput.style.pointerEvents = 'none';
      localChatInput.blur();
      console.log("Chat input hidden and unfocused.");
    }
  } else {
    console.warn("toggleChatInputVisibility: localChatInput element is null.");
  }
}

// Function to send local chat messages
function sendLocalChatMessage() {
  console.log("sendLocalChatMessage called.");
  if (localChatInput) {
    // Check if element exists
    const message = localChatInput.value.trim();
    if (message.length > 0) {
      console.log("Sending message:", message);
      socket.emit('local-chat-message', {
        message: message
      });
      localChatInput.value = ''; // Clear the input field
      toggleChatInputVisibility(false); // Hide the chat input after sending
    } else {
      console.log("Message is empty, not sending. Hiding chat input.");
      toggleChatInputVisibility(false); // Still hide if message is empty
    }
  } else {
    console.warn("sendLocalChatMessage: localChatInput element is null.");
  }
}

// --- Game Initialization ---
function startGame() {
  playerName = playerNameInput.value.trim() || "Player";
  mainMenu.style.display = "none";
  // Hide the static background image when game starts
  if (mainMenuBackground) {
    mainMenuBackground.style.display = 'none'; // Explicitly hide it
  }

  // Show game UI elements
  if (resourceCounterContainer) resourceCounterContainer.style.display = 'flex';
  if (leaderboardContainer) leaderboardContainer.style.display = 'block';
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // IMPORTANT: Retrieve and assign chat UI element *here*, after game starts
  localChatInput = document.getElementById('localChatInput');
  // Set max length for chat input
  if (localChatInput) {
    localChatInput.setAttribute('maxlength', '30'); // Set max length to 30
  }

  // Initialize chat input to be hidden
  toggleChatInputVisibility(false); // Ensure it's hidden when game starts

  // Initialize Hotbar and Weapon Selection UI
  (0,_hotbar_js__WEBPACK_IMPORTED_MODULE_3__.initHotbar)();
  (0,_weaponSelectionUI_js__WEBPACK_IMPORTED_MODULE_4__.initWeaponSelectionUI)();

  // Hotbar click logic (for the bottom hotbar)
  canvas.addEventListener('click', e => {
    // Ensure game is active, player is alive, and chat is not focused before processing hotbar clicks
    const me = players[myId];
    const isChatInputFocused = localChatInput && document.activeElement === localChatInput;
    if (!me || me.isDead || isChatInputFocused) return;

    // Hotbar rendering constants (should match hotbar.js)
    const HOTBAR_SLOT_SIZE = 60;
    const HOTBAR_SPACING = 5;
    const HOTBAR_PADDING = 10;
    const HOTBAR_HEIGHT = HOTBAR_SLOT_SIZE + HOTBAR_PADDING * 2; // Approximate bar height for calculation

    // Get visible slots from hotbar (hotbar.js manages its internal state)
    // This is a simplified check assuming hotbar will expose a way to get active slots
    // For now, assuming hotbar.js handles the click itself or exposes what's needed.
    // The `handleHotbarInput` (keyboard) is the primary interaction for the hotbar.
    // This click listener for the hotbar is less critical if keyboard selection is primary.
    // I'm keeping your original structure for this specific block.
  });

  // Global keydown/keyup listeners for chat and general game input
  document.addEventListener("keydown", e => {
    const currentTime = Date.now();
    const isChatInputFocused = localChatInput && document.activeElement === localChatInput;
    const me = players[myId];

    // Prevent game/chat interactions if the player is dead
    if (me && me.isDead) {
      if (e.key.toLowerCase() === 'enter') {
        e.preventDefault();
        console.log("Player is dead. Cannot open chat or send messages.");
        toggleChatInputVisibility(false);
        if (localChatInput) localChatInput.value = '';
      }
      for (const key in keys) {
        keys[key] = false; // Clear movement keys when dead
      }
      return;
    }

    // Handle 'Enter' key presses for chat
    if (e.key.toLowerCase() === 'enter') {
      e.preventDefault(); // Prevent default Enter key behavior (e.g., newline)

      // Debouncing logic
      if (currentTime - lastEnterPressTime < ENTER_DEBOUNCE_DELAY) {
        return;
      }
      lastEnterPressTime = currentTime;
      if (isChatInputFocused) {
        sendLocalChatMessage(); // Attempt to send the message
      } else {
        toggleChatInputVisibility(true); // Open chat
      }
    } else if (!isChatInputFocused) {
      // Handle hotbar input (number keys 1-9) first if chat is not focused
      const numKey = parseInt(e.key, 10);
      if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        (0,_hotbar_js__WEBPACK_IMPORTED_MODULE_3__.handleHotbarInput)(e, socket); // Pass socket for potential emit (e.g., equipping an item)
        e.preventDefault(); // Prevent any default browser action for number keys
        return; // Stop further processing for this keydown event
      }

      // Only capture general game movement input if chat is not focused AND it's not a hotbar key
      if (typeof e.key === 'string') {
        keys[e.key.toLowerCase()] = true;
      }
    }
  });
  document.addEventListener("keyup", e => {
    const isChatInputFocused = localChatInput && document.activeElement === localChatInput;
    const isMainMenuVisible = mainMenu.style.display === 'block';
    if (isMainMenuVisible) {
      return;
    }
    if (!isChatInputFocused) {
      if (typeof e.key === 'string') {
        keys[e.key.toLowerCase()] = false;
      }
    }
  });

  // Add a click listener to the entire document to hide chat when clicking outside
  document.addEventListener('click', e => {
    if (localChatInput && localChatInput.style.opacity === '1') {
      const isMainMenuVisible = mainMenu.style.display === 'block';
      if (e.target !== localChatInput && !isMainMenuVisible) {
        toggleChatInputVisibility(false);
      }
    }
  });
  socket = io();
  const initializePlayerVisuals = p => {
    p.visualX = p.x;
    p.visualY = p.y;
    p.visualAngle = p.angle;
    p.isSwinging = false;
    p.swingStartTime = 0;
    p.trail = [];
    p.lastSwungHand = 'right';
    p.currentSwingingHand = null;
    p.lastKnownHealth = MAX_HEALTH;
    p.lastDamageTime = 0;
    p.damageWiggleX = 0;
    p.damageWiggleY = 0;
    // Chat message properties for rendering bubbles
    p.lastMessage = '';
    p.messageDisplayTime = 0;
    p.deathTime = 0;
    // NEW: Initialize weapon related properties if they don't exist from server data
    p.equippedWeapon = p.equippedWeapon || 'hands';
    p.unlockedWeapons = p.unlockedWeapons || ['hands'];
  };
  socket.on("init", data => {
    myId = socket.id;
    players = data.players;
    for (const id in data.resources) {
      resources[id] = {
        ...data.resources[id],
        xWiggle: 0,
        yWiggle: 0
      };
    }
    for (const id in players) {
      initializePlayerVisuals(players[id]);
    }
    const me = players[myId];
    if (me) {
      cameraX = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp)(me.x - canvas.width / 5, 0, worldWidth - canvas.width);
      cameraY = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp)(me.y - canvas.height / 5, 0, worldHeight - canvas.height);
      // NEW: Update weapon selection UI state on initial load for the local player
      (0,_weaponSelectionUI_js__WEBPACK_IMPORTED_MODULE_4__.updateWeaponSelectionUI)(me.unlockedWeapons, me.equippedWeapon);
    }
    socket.emit("send-name", {
      id: myId,
      name: playerName
    });
    (0,_leaderboard_js__WEBPACK_IMPORTED_MODULE_2__.initLeaderboard)();
    // hotbar and weapon selection UI are initialized earlier in startGame
  });
  socket.on("player-moved", data => {
    // NEED AN UPDATE ASAP.
    const allPlayersData = data.players;
    const allResourcesData = data.resources;
    const serverTopKillerId = data.topKillerId; // Get top killer ID from server

    for (const id in allPlayersData) {
      const serverPlayer = allPlayersData[id];
      if (players[id]) {
        const p = players[id];

        // Check if player just died (for local player)
        if (serverPlayer.isDead && !p.isDead && id === myId) {
          console.log("You died! Returning to main menu.");
          mainMenu.style.display = 'block'; // Show main menu
          if (mainMenuBackground) {
            mainMenuBackground.style.display = 'none'; // Hide the static background image
          }
          if (playerNameInput) {
            playerNameInput.blur();
          }
          // Hide game UI elements
          if (resourceCounterContainer) resourceCounterContainer.style.display = 'none';
          if (leaderboardContainer) leaderboardContainer.style.display = 'none';
          toggleChatInputVisibility(false); // Hide chat input
        }

        // NEW: Trigger damage text creation if health decreased
        if (serverPlayer.health < p.lastKnownHealth) {
          p.lastDamageTime = Date.now();
          p.damageWiggleX = (Math.random() - 0.5) * PLAYER_DAMAGE_WIGGLE_STRENGTH;
          p.damageWiggleY = (Math.random() - 0.5) * PLAYER_DAMAGE_WIGGLE_STRENGTH;
          const damageAmount = p.lastKnownHealth - serverPlayer.health;
          const isOwnPlayer = id === myId; // Check if the damaged player is the local player
          (0,_damageText_js__WEBPACK_IMPORTED_MODULE_5__.createDamageText)(p.visualX, p.visualY, damageAmount, isOwnPlayer, cameraX, cameraY);
        }

        // Preserve client-side visual states including chat message state
        serverPlayer.visualX = p.visualX;
        serverPlayer.visualY = p.y; // Server is authoritative on Y position, use server Y
        serverPlayer.visualAngle = p.visualAngle;
        serverPlayer.isSwinging = p.isSwinging;
        serverPlayer.swingStartTime = p.swingStartTime;
        serverPlayer.trail = p.trail;
        serverPlayer.lastSwungHand = p.lastSwungHand;
        serverPlayer.currentSwingingHand = p.currentSwingingHand;
        serverPlayer.lastDamageTime = p.lastDamageTime;
        serverPlayer.damageWiggleX = p.damageWiggleX;
        serverPlayer.damageWiggleY = p.damageWiggleY;
        serverPlayer.lastMessage = p.lastMessage;
        serverPlayer.messageDisplayTime = p.messageDisplayTime;
        serverPlayer.deathTime = p.deathTime;

        // IMPORTANT: Ensure equippedWeapon and unlockedWeapons are updated from server
        serverPlayer.equippedWeapon = serverPlayer.equippedWeapon || 'hands';
        serverPlayer.unlockedWeapons = serverPlayer.unlockedWeapons || ['hands'];
        Object.assign(p, serverPlayer); // Apply all server updates
        p.lastKnownHealth = serverPlayer.health;

        // NEW: Update weapon selection UI state for the local player whenever player data changes
        if (id === myId) {
          (0,_weaponSelectionUI_js__WEBPACK_IMPORTED_MODULE_4__.updateWeaponSelectionUI)(p.unlockedWeapons, p.equippedWeapon);
        }
      } else {
        players[id] = serverPlayer;
        initializePlayerVisuals(players[id]);
      }
    }
    for (const id in players) {
      if (!allPlayersData[id]) {
        delete players[id];
      }
    }
    for (const id in allResourcesData) {
      const serverResource = allResourcesData[id];
      if (resources[id]) {
        Object.assign(resources[id], serverResource);
      } else {
        resources[id] = {
          ...serverResource,
          xWiggle: 0,
          yWiggle: 0
        };
      }
    }
    for (const id in resources) {
      if (!allResourcesData[id]) {
        delete resources[id];
      }
    }
    // Update leaderboard whenever player data moves, passing topKillerId
    (0,_leaderboard_js__WEBPACK_IMPORTED_MODULE_2__.updateLeaderboard)(players, myId, serverTopKillerId);
  });
  socket.on("player-joined", player => {
    players[player.id] = player;
    initializePlayerVisuals(player);
  });
  socket.on('player-has-swung', id => {
    if (players[id]) {
      const p = players[id];
      p.isSwinging = true;
      p.swingStartTime = Date.now();
      if (p.lastSwungHand === 'right') {
        p.currentSwingingHand = 'left';
        p.lastSwungHand = 'left';
      } else {
        p.currentSwingingHand = 'right';
        p.lastSwungHand = 'right';
      }
    }
  });
  socket.on("player-left", id => {
    delete players[id];
    // Update leaderboard when a player leaves
    (0,_leaderboard_js__WEBPACK_IMPORTED_MODULE_2__.updateLeaderboard)(players, myId);
  });
  socket.on('resource-wiggled', data => {
    wiggleGameObject(data.resourceId, data.direction);
  });
  socket.on('pong', timestamp => {
    currentPing = Date.now() - pingSendTime;
  });

  // Listen for local chat messages from server
  socket.on('local-chat-message', data => {
    const player = players[data.senderId];
    if (player) {
      player.lastMessage = data.message;
      player.messageDisplayTime = Date.now();
    }
  });
  lastTime = Date.now();
  loop();
  console.log("Game started! Client-side loop initiated.");
  setInterval(() => {
    pingSendTime = Date.now();
    socket.emit('ping');
  }, PING_INTERVAL);
}
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
function wiggleGameObject(sid, dir) {
  const tmpObj = resources[sid];
  if (tmpObj) {
    tmpObj.xWiggle += GATHER_WIGGLE * Math.cos(dir);
    tmpObj.yWiggle += GATHER_WIGGLE * Math.sin(dir);
  }
}

// --- Main Game Loop Functions ---
function update() {
  const me = players[myId];
  if (!me || me.isDead) return; // If player is dead, stop updating game logic

  const isChatInputFocused = localChatInput && document.activeElement === localChatInput;
  let currentKeys = {
    ...keys
  }; // Create a copy of the keys object

  if (isChatInputFocused) {
    // If chat is focused, clear all movement keys to stop the player
    for (const key in currentKeys) {
      if (['w', 'a', 's', 'd'].includes(key)) {
        // Only clear movement keys
        currentKeys[key] = false;
      }
    }
  }

  // Always send client-input, but use the potentially modified 'currentKeys'
  const dx = mouseX + cameraX - me.visualX;
  const dy = mouseY + cameraY - me.visualY;
  const targetAngle = Math.atan2(dy, dx);
  // NEW: Send player's equipped weapon with client-input (for server to know what's active)
  socket.emit("client-input", {
    keys: currentKeys,
    angle: targetAngle,
    name: playerName,
    equippedWeapon: me.equippedWeapon
  });

  // Only allow swinging if chat input is not focused and player is not dead
  if (!isChatInputFocused && (isLeftMouseDown || isRightMouseDown) && !me.isDead) {
    socket.emit('player-swing');
  }

  // Client-side resource wiggle decay
  for (const id in resources) {
    const res = resources[id];
    if (res.xWiggle) {
      res.xWiggle *= Math.pow(0.9, deltaTime * 60);
      if (Math.abs(res.xWiggle) < 0.1) res.xWiggle = 0;
    }
    if (res.yWiggle) {
      res.yWiggle *= Math.pow(0.9, deltaTime * 60);
      if (Math.abs(res.yWiggle) < 0.1) res.yWiggle = 0;
    }
  }
}
function loop() {
  deltaTime = (Date.now() - lastTime) / 1000;
  lastTime = Date.now();
  update();
  const me = players[myId];
  // Camera movement and resource counter updates only if player exists and is not dead
  // This ensures the camera stays put when dead and menu is up.
  if (me && me.visualX !== undefined && !me.isDead) {
    const targetCameraX = me.visualX - canvas.width / 2;
    const targetCameraY = me.y - canvas.height / 2;

    // Smoothed camera movement
    cameraX += (targetCameraX - cameraX) * cameraLerpFactor;
    cameraY += (targetCameraY - cameraY) * cameraLerpFactor;
    cameraX = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp)(cameraX, 0, worldWidth - canvas.width);
    cameraY = (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp)(cameraY, 0, worldHeight - canvas.height);
    if (window.updateHtmlResourceCounter && me.inventory) {
      window.updateHtmlResourceCounter(me.inventory);
    }
  } else if (me && me.isDead) {
    // If dead, ensure resource counters are hidden (handled in player-moved death logic)
    // and camera stays fixed at death location.
  }

  // Drawing (rendering) always happens, regardless of menu state,
  // so the canvas is always live in the background.
  // Pass topKillerId to the main draw function as it needs it for the skull icon
  (0,_drawing_js__WEBPACK_IMPORTED_MODULE_1__.draw)(ctx, canvas, players, myId, resources, cameraX, cameraY, deltaTime, currentPing, CHAT_BUBBLE_DURATION, players[myId] ? players[myId].topKillerId : null); // Assumes topKillerId is on player object for now or global. It's global on server, but client gets it via player-moved.

  // NEW: Update and draw damage texts (should be above game world but below UI)
  (0,_damageText_js__WEBPACK_IMPORTED_MODULE_5__.updateDamageTexts)(deltaTime);
  (0,_damageText_js__WEBPACK_IMPORTED_MODULE_5__.drawDamageTexts)(ctx);

  // NEW: Draw Hotbar (appears at the bottom)
  (0,_hotbar_js__WEBPACK_IMPORTED_MODULE_3__.drawHotbar)(ctx, canvas, players[myId] ? players[myId].equippedWeapon : null); // Pass equipped weapon for highlighting

  // NEW: Draw Weapon Selection UI (appears at the top)
  if (me) {
    // Only draw if the local player exists
    // weaponSelectionUI.js internally uses its own updated state (unlockedWeapons, equippedWeapon)
    (0,_weaponSelectionUI_js__WEBPACK_IMPORTED_MODULE_4__.drawWeaponSelectionUI)(ctx, canvas);
  }
  requestAnimationFrame(loop);
}

/***/ }),

/***/ "./public/client/map.js":
/*!******************************!*\
  !*** ./public/client/map.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MINIMAP_BACKGROUND_COLOR: () => (/* binding */ MINIMAP_BACKGROUND_COLOR),
/* harmony export */   MINIMAP_PADDING: () => (/* binding */ MINIMAP_PADDING),
/* harmony export */   MINIMAP_SIZE: () => (/* binding */ MINIMAP_SIZE),
/* harmony export */   drawMinimap: () => (/* binding */ drawMinimap)
/* harmony export */ });
/* harmony import */ var _main_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./main.js */ "./public/client/main.js");
// --- Imports from main.js (Constants needed for minimap) ---


// --- Minimap Specific Constants ---
const MINIMAP_SIZE = 150; // Increased size
const MINIMAP_PADDING = 20; // Consistent padding
const MINIMAP_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.5)"; // Background color
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
function drawMinimap(ctx, canvas, players, myId, worldWidth, worldHeight) {
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
    if (!p.isDead || p.isDead && now - p.deathTime < _main_js__WEBPACK_IMPORTED_MODULE_0__.DEAD_PLAYER_HIDE_DELAY) {
      const playerMinimapX = minimapX + p.visualX * scaleX;
      const playerMinimapY = minimapY + p.visualY * scaleY;
      ctx.fillStyle = id === myId ? 'white' : _main_js__WEBPACK_IMPORTED_MODULE_0__.playerFillColor;
      ctx.globalAlpha = p.isDead ? 0.5 : 1.0; // Still show as semi-transparent if dead
      ctx.beginPath();
      ctx.arc(playerMinimapX, playerMinimapY, 3, 0, Math.PI * 2); // Player dots
      ctx.fill();
      ctx.globalAlpha = 1.0; // Reset alpha
    }
  }
}

/***/ }),

/***/ "./public/client/resourceDesigns.js":
/*!******************************************!*\
  !*** ./public/client/resourceDesigns.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getResSprite: () => (/* binding */ getResSprite)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./public/client/utils.js");
/* harmony import */ var _main_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./main.js */ "./public/client/main.js");
// --- Imports from utils.js ---


// --- Imports from main.js (Constants, specifically RESOURCE_TYPES) ---
 // Explicitly import RESOURCE_TYPES and RESOURCE_PROPERTIES

// Cache for generated game object sprites
let gameObjectSprites = {};

// Function to get or create a resource sprite based on Moomoo.io logic
// Now accepts resourceDrawSize, resourceOutlineColor, resourceOutlineWidth as arguments.
function getResSprite(obj, resourceDrawSize, resourceOutlineColor, resourceOutlineWidth) {
  // biomeID is always 0 (grass biome) and isNight is false, as per user request to ignore specific biome/day-night logic
  const biomeID = 0;
  const isNight = false;

  // Map our RESOURCE_TYPES to Moomoo.io numerical types for design logic
  let moomooType;

  // --- IMPORTANT FIX: Use imported RESOURCE_TYPES constants for matching ---
  switch (obj.type) {
    case _main_js__WEBPACK_IMPORTED_MODULE_1__.RESOURCE_TYPES.WOOD:
      moomooType = 0;
      break;
    case _main_js__WEBPACK_IMPORTED_MODULE_1__.RESOURCE_TYPES.FOOD:
      moomooType = 1;
      break;
    case _main_js__WEBPACK_IMPORTED_MODULE_1__.RESOURCE_TYPES.STONE:
      moomooType = 2;
      break;
    // For gold, use an existing design or create a new one.
    // Assuming moomooType 3 is typically 'gold' or 'rare stone' in similar games,
    // we'll map it there for consistency with the provided 'moomooType == 2 || moomooType == 3' logic.
    case _main_js__WEBPACK_IMPORTED_MODULE_1__.RESOURCE_TYPES.GOLD:
      moomooType = 3;
      break;
    default:
      moomooType = 0;
    // Fallback
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
    tmpContext.rotate(_utils_js__WEBPACK_IMPORTED_MODULE_0__.UTILS.randFloat(0, Math.PI)); // Random rotation for some objects
    // Set default stroke and linewidth, but these will be overridden for the bush specific colors
    tmpContext.strokeStyle = resourceOutlineColor;
    tmpContext.lineWidth = resourceOutlineWidth;
    if (moomooType == 0) {
      // Wood (Tree) - UNCHANGED
      const tmpCount = _utils_js__WEBPACK_IMPORTED_MODULE_0__.UTILS.randInt(5, 7);
      tmpContext.globalAlpha = isNight ? 0.6 : 0.8;

      // Foliage
      const foliageVerticalOffset = 0;
      for (let i = 0; i < 2; ++i) {
        const currentScale = tmpScale * (!i ? 1.5 : 1.0);
        tmpContext.save();
        tmpContext.translate(0, foliageVerticalOffset);
        (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.renderStar)(tmpContext, tmpCount, currentScale, currentScale * 0.7);
        tmpContext.fillStyle = !biomeID ? !i ? '#4CAF50' : '#3D8E41' : !i ? '#e3f1f4' : '#fff';
        tmpContext.fill();
        if (!i) {
          tmpContext.stroke();
          tmpContext.globalAlpha = 1;
        }
        tmpContext.restore();
      }
    } else if (moomooType == 1) {
      // Food (Wheat Bush) - TOP-DOWN DESIGN
      const radius = _main_js__WEBPACK_IMPORTED_MODULE_1__.RESOURCE_PROPERTIES[_main_js__WEBPACK_IMPORTED_MODULE_1__.RESOURCE_TYPES.FOOD].collisionRadius;
      const stemColor = '#6B8E23'; // Olive green
      const headColor = '#DAA520'; // Goldenrod
      const innerHeadColor = '#FFD700'; // Brighter gold for center
      const outlineColor = resourceOutlineColor;
      const numStalks = 12 + _utils_js__WEBPACK_IMPORTED_MODULE_0__.UTILS.randInt(0, 5); // 12–17 wheat stalks
      const stalkLength = radius * 0.9;
      const stalkWidth = 2;
      tmpContext.save();
      tmpContext.rotate(_utils_js__WEBPACK_IMPORTED_MODULE_0__.UTILS.randFloat(0, Math.PI * 2)); // Random rotation for natural variation

      for (let i = 0; i < numStalks; i++) {
        const angle = Math.PI * 2 / numStalks * i + _utils_js__WEBPACK_IMPORTED_MODULE_0__.UTILS.randFloat(-0.1, 0.1);
        const dist = radius * _utils_js__WEBPACK_IMPORTED_MODULE_0__.UTILS.randFloat(0.3, 0.7); // Offset from center
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const length = stalkLength * _utils_js__WEBPACK_IMPORTED_MODULE_0__.UTILS.randFloat(0.6, 1.0);
        tmpContext.save();
        tmpContext.translate(x, y);
        tmpContext.rotate(angle);

        // Stem
        tmpContext.fillStyle = stemColor;
        tmpContext.fillRect(-stalkWidth / 2, 0, stalkWidth, length * 0.6);

        // Wheat head (golden oval at end of stalk)
        tmpContext.fillStyle = headColor;
        tmpContext.strokeStyle = outlineColor;
        tmpContext.lineWidth = resourceOutlineWidth;
        tmpContext.beginPath();
        tmpContext.ellipse(0, length * 0.7, 5, 8, 0, 0, Math.PI * 2);
        tmpContext.fill();
        tmpContext.stroke();

        // Inner highlight
        tmpContext.fillStyle = innerHeadColor;
        tmpContext.beginPath();
        tmpContext.ellipse(0, length * 0.7, 2, 4, 0, 0, Math.PI * 2);
        tmpContext.fill();
        tmpContext.restore();
      }
      tmpContext.restore();
    } else if (moomooType == 2) {
      // Stone - UNCHANGED (moomooType 2)
      tmpContext.fillStyle = biomeID == 2 ? '#938d77' : '#939393'; // Original stone color
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.renderStar)(tmpContext, 3, tmpScale, tmpScale);
      tmpContext.fill();
      tmpContext.stroke();
      tmpContext.fillStyle = biomeID == 2 ? '#b2ab90' : '#bcbcbc'; // Lighter stone accent
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.renderStar)(tmpContext, 3, tmpScale * 0.55, tmpScale * 0.65);
      tmpContext.fill();
    } else if (moomooType == 3) {
      // Gold - NEW (moomooType 3)
      // Gold nugget / jagged rock appearance
      //tmpContext.fillStyle = '#FFD700'; // Gold color
      //tmpContext.strokeStyle = '#B8860B'; // Darker gold outline
      //tmpContext.lineWidth = resourceOutlineWidth;

      //tmpContext.fillStyle = '#DAA520'; // A slightly darker gold for inner details

      //tmpContext.fillStyle = '#FFF8DC'; // A very light gold for highlights

      tmpContext.fillStyle = '#FFD700'; // Original stone color
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.renderStar)(tmpContext, 3, tmpScale, tmpScale);
      tmpContext.fill();
      tmpContext.stroke();
      tmpContext.fillStyle = '#FFF8DC'; // Lighter stone accent
      (0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.renderStar)(tmpContext, 3, tmpScale * 0.55, tmpScale * 0.65);
      tmpContext.fill();
    }
    tmpSprite = tmpCanvas;
    gameObjectSprites[tmpIndex] = tmpSprite;
  }
  return tmpSprite;
}

/***/ }),

/***/ "./public/client/utils.js":
/*!********************************!*\
  !*** ./public/client/utils.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UTILS: () => (/* binding */ UTILS),
/* harmony export */   clamp: () => (/* binding */ clamp),
/* harmony export */   interpolateColor: () => (/* binding */ interpolateColor),
/* harmony export */   lerpAngle: () => (/* binding */ lerpAngle),
/* harmony export */   renderBlob: () => (/* binding */ renderBlob),
/* harmony export */   renderCircle: () => (/* binding */ renderCircle),
/* harmony export */   renderLeaf: () => (/* binding */ renderLeaf),
/* harmony export */   renderStar: () => (/* binding */ renderStar)
/* harmony export */ });
// --- Helper Functions (General Utilities) ---

function interpolateColor(color1, color2, factor) {
  const hexToRgb = hex => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return {
      r,
      g,
      b
    };
  };
  const rgbToHex = (r, g, b) => {
    const toHex = c => Math.min(255, Math.max(0, Math.round(c))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = c1.r + factor * (c2.r - c1.r);
  const g = c1.g + factor * (c2.g - c1.g);
  const b = c1.b + factor * (c2.b - c1.b);
  return rgbToHex(r, g, b);
}
function lerpAngle(start, end, amount) {
  let shortest_angle = ((end - start) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  return start + shortest_angle * amount;
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Moomoo.io specific UTILS (simplified for this context)
const UTILS = {
  randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  randFloat: (min, max) => Math.random() * (max - min) + min
};

// --- Custom Drawing Helpers (from user's snippet) ---

// Adjusted renderCircle to match user's provided signature with dontStroke/dontFill
function renderCircle(x, y, scale, ctxt, dontStroke, dontFill) {
  ctxt.beginPath();
  ctxt.arc(x, y, scale, 0, 2 * Math.PI);
  if (!dontFill) ctxt.fill();
  if (!dontStroke) ctxt.stroke();
}

// New renderLeaf function from user's snippet
function renderLeaf(x, y, l, r, ctxt) {
  let endX = x + l * Math.cos(r);
  let endY = y + l * Math.sin(r);
  let width = l * 0.4;
  ctxt.moveTo(x, y); // This seems redundant with beginPath right after, typically moveTo is inside beginPath.
  // Retaining user's original structure.
  ctxt.beginPath();
  ctxt.quadraticCurveTo((x + endX) / 2 + width * Math.cos(r + Math.PI / 2), (y + endY) / 2 + width * Math.sin(r + Math.PI / 2), endX, endY);
  ctxt.quadraticCurveTo((x + endX) / 2 - width * Math.cos(r + Math.PI / 2), (y + endY) / 2 - width * Math.sin(r + Math.PI / 2), x, y);
  ctxt.closePath();
  ctxt.fill();
  ctxt.stroke();
}

// Moomoo.io specific drawing helpers (original from previous versions, kept for other sprite generation)
function renderStar(context, sides, outerRadius, innerRadius) {
  context.beginPath();
  for (let i = 0; i < sides * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = Math.PI / sides * i;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.closePath();
}

// A more accurate renderBlob based on typical irregular polygon drawing (Moomoo.io style)
function renderBlob(context, irregularity, outerRadius, innerRadius) {
  context.beginPath();
  const angleStep = Math.PI * 2 / irregularity;
  let currentAngle = UTILS.randFloat(0, Math.PI * 2);
  let points = [];
  for (let i = 0; i < irregularity; i++) {
    const r = UTILS.randFloat(innerRadius, outerRadius);
    const x = r * Math.cos(currentAngle);
    const y = r * Math.sin(currentAngle);
    points.push({
      x,
      y
    });
    currentAngle += angleStep;
  }
  context.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const xc = (p1.x + p2.x) / 2;
    const yc = (p1.y + p2.y) / 2;
    context.quadraticCurveTo(p1.x, p1.y, xc, yc);
  }
  context.closePath();
}

/***/ }),

/***/ "./public/client/weaponSelectionUI.js":
/*!********************************************!*\
  !*** ./public/client/weaponSelectionUI.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   drawWeaponSelectionUI: () => (/* binding */ drawWeaponSelectionUI),
/* harmony export */   handleWeaponSelectionClick: () => (/* binding */ handleWeaponSelectionClick),
/* harmony export */   initWeaponSelectionUI: () => (/* binding */ initWeaponSelectionUI),
/* harmony export */   updateWeaponSelectionUI: () => (/* binding */ updateWeaponSelectionUI)
/* harmony export */ });
/* harmony import */ var _main_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./main.js */ "./public/client/main.js");
// weaponSelectionUI.js - Manages the UI and logic for selecting unlocked weapons.

// Add a polyfill for roundRect if it's not natively supported by the browser's CanvasRenderingContext2D.
// This ensures that the roundRect method used for drawing rounded rectangles works consistently.
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    // Normalize the radius input to an object with properties for each corner.
    if (typeof radius === 'number') {
      radius = {
        tl: radius,
        tr: radius,
        br: radius,
        bl: radius
      };
    } else if (typeof radius === 'object') {
      radius = {
        tl: radius.tl || 0,
        // Top-left radius, default to 0
        tr: radius.tr || 0,
        // Top-right radius, default to 0
        br: radius.br || 0,
        // Bottom-right radius, default to 0
        bl: radius.bl || 0 // Bottom-left radius, default to 0
      };
    } else {
      // Default to no radius if input is invalid.
      radius = {
        tl: 0,
        tr: 0,
        br: 0,
        bl: 0
      };
    }

    // Begin a new path for drawing the rounded rectangle.
    this.beginPath();
    // Move to the starting point (top-left corner after the top-left radius).
    this.moveTo(x + radius.tl, y);
    // Draw the top line.
    this.lineTo(x + width - radius.tr, y);
    // Draw the top-right corner arc.
    this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    // Draw the right line.
    this.lineTo(x + width, y + height - radius.br);
    // Draw the bottom-right corner arc.
    this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    // Draw the bottom line.
    this.lineTo(x + radius.bl, y + height);
    // Draw the bottom-left corner arc.
    this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    // Draw the left line.
    this.lineTo(x, y + radius.tl);
    // Draw the top-left corner arc and close the path.
    this.quadraticCurveTo(x, y, x + radius.tl, y);
    this.closePath();
    return this; // Return the context for chaining
  };
}

// Import necessary constants from main.js (for drawing)
// You might need to adjust imports if weapon names become images or more complex


// Import weapon properties to get weapon details (currently not used in this UI, but good for future expansion)
const {
  getWeaponProperties
} = __webpack_require__(/*! ./weapons.js */ "./public/client/weapons.js");

// --- UI Constants ---
const SLOT_SIZE = 60; // Size of each weapon slot (width and height)
const SLOT_SPACING = 10; // Space between slots
const PADDING_X = 20; // Padding from left/right edges of the canvas
const PADDING_Y = 10; // Padding from top edge of the canvas

const BACKGROUND_COLOR = "rgba(0, 0, 0, 0.7)"; // Dark semi-transparent background for the bar
const BORDER_COLOR = "#AAA"; // Light gray border
const ACTIVE_BORDER_COLOR = "#FFFF00"; // Bright yellow for active slot
const INACTIVE_SLOT_COLOR = "rgba(50,50,50,0.5)"; // Color for empty or non-active slots

const TEXT_COLOR = "white"; // Color for weapon names/labels
const FONT_SIZE = 14; // Font size for weapon name
const KEY_LABEL_FONT_SIZE = 12; // Font size for the number key label

// --- Internal State ---
let unlockedWeapons = []; // Stores the names of weapons the player has unlocked
let equippedWeaponName = 'hands'; // The name of the weapon currently equipped, defaults to 'hands'

// This will store Image objects for weapon icons if you add them later
const weaponIcons = {};
// Example: Preload icons (you'll need actual image paths)
// Object.keys(weaponData).forEach(weaponName => {
//     const img = new Image();
//     img.src = `assets/weapons/${weaponName.replace(/ /g, '_')}.png`; // Example path convention
//     img.onload = () => weaponIcons[weaponName] = img;
//     img.onerror = () => console.warn(`Failed to load weapon icon: ${img.src}`);
// });

/**
 * Initializes the weapon selection UI.
 * This function is primarily for conceptual setup as drawing is done on canvas.
 * In a more complex setup, this might set up event listeners or initial state.
 */
function initWeaponSelectionUI() {
  console.log("Weapon selection UI initialized.");
  // Ensure 'hands' is always the first unlocked weapon by default
  // This is a good place to initialize `unlockedWeapons` if it's not done elsewhere.
  // However, `updateWeaponSelectionUI` will typically manage this based on game state.
}

/**
 * Updates the data displayed by the weapon selection UI.
 * This function should be called by your game logic whenever the player's
 * unlocked weapons or equipped weapon changes (e.g., after aging up, picking up a new weapon).
 * @param {string[]} newUnlockedWeapons - Array of weapon names the player has unlocked.
 * @param {string} newEquippedWeaponName - The name of the weapon currently equipped.
 */
function updateWeaponSelectionUI(newUnlockedWeapons, newEquippedWeaponName) {
  unlockedWeapons = newUnlockedWeapons;
  equippedWeaponName = newEquippedWeaponName;
  console.log("Weapon selection UI updated. Unlocked:", unlockedWeapons, "Equipped:", equippedWeaponName);
}

/**
 * Draws the weapon selection bar on the canvas.
 * This function should be called in your main game loop every frame.
 * The UI will only be drawn if the player has more than just 'hands' unlocked.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {HTMLCanvasElement} canvas - The canvas element itself.
 */
function drawWeaponSelectionUI(ctx, canvas) {
  // Only show the UI if there's more than one weapon unlocked (i.e., more than just 'hands')
  if (unlockedWeapons.length <= 1) {
    return;
  }

  // Calculate the total width of the weapon bar based on the number of unlocked weapons.
  const totalWidth = unlockedWeapons.length * SLOT_SIZE + (unlockedWeapons.length - 1) * SLOT_SPACING;
  // Center the weapon bar horizontally on the canvas.
  const startX = canvas.width / 2 - totalWidth / 2;
  // Position the weapon bar from the top edge of the canvas.
  const startY = PADDING_Y;

  // Draw background for the entire bar
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.beginPath(); // Start a new path for the background
  ctx.roundRect(startX - PADDING_X / 2, startY - PADDING_Y / 2, totalWidth + PADDING_X, SLOT_SIZE + PADDING_Y, 10);
  ctx.fill();

  // Iterate over each unlocked weapon to draw its slot.
  unlockedWeapons.forEach((weaponName, index) => {
    const slotX = startX + index * (SLOT_SIZE + SLOT_SPACING);
    const slotY = startY;
    ctx.save(); // Save the current canvas state (e.g., fillStyle, strokeStyle, font)

    // Draw slot background
    ctx.fillStyle = INACTIVE_SLOT_COLOR;
    ctx.beginPath(); // Start a new path for the slot
    ctx.roundRect(slotX, slotY, SLOT_SIZE, SLOT_SIZE, 5);
    ctx.fill();

    // Draw slot border (active or inactive)
    if (weaponName === equippedWeaponName) {
      ctx.strokeStyle = ACTIVE_BORDER_COLOR;
      ctx.lineWidth = 3; // Thicker border for the currently equipped weapon
    } else {
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 2;
    }
    ctx.stroke(); // Apply the stroke to the slot path

    // Draw weapon icon/text
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `${FONT_SIZE}px Arial`;
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically

    // Use the first word of the weapon name for display (e.g., "Assault Rifle" becomes "Assault")
    const weaponDisplayName = weaponName.split(' ')[0];
    ctx.fillText(weaponDisplayName, slotX + SLOT_SIZE / 2, slotY + SLOT_SIZE / 2);

    // Draw key label (1, 2, 3...) in the top-left corner of the slot
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `bold ${KEY_LABEL_FONT_SIZE}px Arial`;
    ctx.textAlign = "left"; // Align key label to the left
    ctx.textBaseline = "top"; // Align key label to the top
    ctx.fillText(String(index + 1), slotX + 5, slotY + 5); // Position key in top-left corner with padding

    ctx.restore(); // Restore the canvas state to what it was before drawing this slot
  });
}

/**
 * Handles clicks on the canvas to select a weapon from the hotbar.
 * This function should be attached as an event listener to your canvas for 'click' events.
 * It checks if the click occurred within any weapon slot and emits an 'equip-weapon' event if so.
 * @param {MouseEvent} event - The mouse click event object.
 * @param {object} player - The local player object (to check if player is dead or valid).
 * @param {SocketIO.Socket} socket - The Socket.IO client instance for sending equip events.
 * @returns {boolean} True if a weapon slot was clicked and handled, false otherwise.
 */
function handleWeaponSelectionClick(event, player, socket) {
  // Don't process clicks if the player is dead or if there's only one weapon (no UI shown).
  if (!player || player.isDead || unlockedWeapons.length <= 1) {
    return false;
  }
  const canvas = event.target;
  // Get the size and position of the canvas relative to the viewport.
  const rect = canvas.getBoundingClientRect();
  // Calculate mouse coordinates relative to the canvas.
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Recalculate bar position to match drawing logic.
  const totalWidth = unlockedWeapons.length * SLOT_SIZE + (unlockedWeapons.length - 1) * SLOT_SPACING;
  const startX = canvas.width / 2 - totalWidth / 2;
  const startY = PADDING_Y;

  // Loop through each weapon slot to check for a click.
  for (let i = 0; i < unlockedWeapons.length; i++) {
    const slotX = startX + i * (SLOT_SIZE + SLOT_SPACING);
    const slotY = startY;

    // Check if the mouse click is within the bounds of the current slot.
    if (mouseX >= slotX && mouseX <= slotX + SLOT_SIZE && mouseY >= slotY && mouseY <= slotY + SLOT_SIZE) {
      const selectedWeapon = unlockedWeapons[i];
      // Only attempt to equip the weapon if it's not already the equipped one.
      if (selectedWeapon !== equippedWeaponName) {
        console.log(`Attempting to equip: ${selectedWeapon}`);
        // Emit a Socket.IO event to the server to equip the selected weapon.
        socket.emit('equip-weapon', {
          weaponName: selectedWeapon
        });
      }
      return true; // A weapon slot was clicked, so the event is handled.
    }
  }
  return false; // No weapon slot was clicked.
}

/***/ }),

/***/ "./public/client/weapons.js":
/*!**********************************!*\
  !*** ./public/client/weapons.js ***!
  \**********************************/
/***/ ((module) => {

// weapons.js - Defines all weapon properties for the game.
// This file centralizes weapon data for easy management and balancing.

const WEAPON_DATA = new Map([
// Default Weapon (Age 0) - Matches existing server.js FIST_DAMAGE and FIST_KNOCKBACK_STRENGTH
// This is the baseline for all other weapons.
["hands", {
  type: "default",
  speed: 1.0,
  // Attack speed multiplier (1.0 is base, higher is faster)
  dmg: 10,
  // Damage dealt per hit
  knockback: 40,
  // Knockback strength per hit (distance pushed)
  reach: 70,
  // How far the attack reaches from player center
  upgrade: null // No direct upgrade path from hands
}],
// Primary Weapons (Age 1 - unlocked early)
// Generally solid combat options, offering various trade-offs.
["bat", {
  type: "primary",
  speed: 0.9,
  // Slightly slower than hands
  dmg: 15,
  // Noticeably more damage than hands
  knockback: 50,
  // Better knockback
  reach: 80,
  // Slightly longer reach
  upgrade: null
}], ["axe", {
  type: "primary",
  speed: 0.8,
  // Slower, heavy hits
  dmg: 18,
  // High damage
  knockback: 60,
  // Strong knockback
  reach: 85,
  // Good reach
  upgrade: "battle axe"
}], ["spear", {
  type: "primary",
  speed: 1.0,
  // Same speed as hands
  dmg: 14,
  // Good damage
  knockback: 45,
  // Moderate knockback
  reach: 120,
  // SIGNIFICANTLY longer reach
  upgrade: ["trident", "javelin"]
}], ["dagger", {
  type: "primary",
  speed: 1.5,
  // Very fast
  dmg: 8,
  // Low damage, but high DPS due to speed
  knockback: 10,
  // Minimal knockback
  reach: 60,
  // Shorter reach
  upgrade: "dual daggers"
}], ["short sword", {
  type: "primary",
  speed: 1.1,
  // Slightly faster than hands
  dmg: 12,
  // Decent damage
  knockback: 30,
  // Moderate knockback
  reach: 75,
  // Slightly longer reach
  upgrade: "long sword"
}],
// Primary Upgrades (Age 7–9 - late game unlocks)
// Significant power increases from their base versions.
["battle axe", {
  type: "primary",
  speed: 0.7,
  // Even slower, but massive impact
  dmg: 25,
  // Very high damage
  knockback: 80,
  // Very strong knockback
  reach: 95,
  // Longer reach
  upgrade: null
}], ["trident", {
  type: "primary",
  speed: 1.0,
  // Balanced speed
  dmg: 16,
  // Good damage
  knockback: 50,
  // Good knockback
  reach: 130,
  // Even longer reach
  multiHit: true,
  // Custom property: can hit multiple targets
  upgrade: null
}], ["javelin", {
  type: "primary",
  speed: 1.0,
  // Balanced speed
  dmg: 15,
  // Good damage
  knockback: 20,
  // Lower knockback due to being throwable
  reach: 100,
  // Good reach
  throwable: true,
  // Custom property: can be thrown
  upgrade: null
}], ["dual daggers", {
  type: "primary",
  speed: 1.8,
  // Extremely fast
  dmg: 9,
  // Low damage per hit, but very high DPS
  knockback: 10,
  // Minimal knockback
  reach: 65,
  // Shorter reach
  combo: true,
  // Custom property: allows for combo attacks
  upgrade: null
}], ["long sword", {
  type: "primary",
  speed: 1.0,
  // Balanced speed
  dmg: 18,
  // High damage
  knockback: 45,
  // Good knockback
  reach: 90,
  // Longer reach
  upgrade: null
}],
// Secondary Weapons (Age 4 - mid-game unlocks)
// Often offer utility alongside damage, or specialize in a specific combat style.
["shield", {
  type: "secondary",
  speed: 0.5,
  // Very slow attack, but primary use is blocking
  dmg: 5,
  // Very low damage
  knockback: 70,
  // High knockback (pushes enemies back to create space)
  reach: 50,
  // Very short attack reach
  block: true,
  // Custom property: can block attacks
  upgrade: "spiked shield"
}], ["throwing knife", {
  type: "secondary",
  speed: 1.6,
  // Very fast
  dmg: 7,
  // Low damage
  knockback: 5,
  // Very minimal knockback
  reach: 80,
  // Good reach for a thrown projectile (initial contact)
  throwable: true,
  // Custom property: can be thrown
  upgrade: "crossknife"
}], ["hammer", {
  type: "secondary",
  speed: 0.6,
  // Very slow, heavy
  dmg: 22,
  // Very high damage
  knockback: 80,
  // Extreme knockback
  reach: 80,
  // Good reach
  upgrade: "war hammer"
}], ["gloves", {
  type: "secondary",
  speed: 1.7,
  // Very fast
  dmg: 6,
  // Low damage, quick hits
  knockback: 15,
  // Minimal knockback
  reach: 60,
  // Shorter reach
  combo: true,
  // Custom property: allows for combo attacks
  upgrade: "brass knuckles"
}], ["boomerang", {
  type: "secondary",
  speed: 1.0,
  // Balanced speed
  dmg: 10,
  // Moderate damage
  knockback: 25,
  // Moderate knockback
  reach: 100,
  // Good reach for a thrown projectile
  throwable: true,
  return: true,
  // Custom property: boomerang returns
  upgrade: null
}],
// Secondary Upgrades (Age 7–9 - late game unlocks)
// Enhanced versions of secondary weapons, improving on their core strengths.
["spiked shield", {
  type: "secondary",
  speed: 0.5,
  // Same slow speed
  dmg: 8,
  // Slightly more damage
  knockback: 75,
  // Slightly improved knockback
  reach: 55,
  // Slightly longer attack reach
  block: true,
  counterDamage: true,
  // Custom property: deals damage when blocking
  upgrade: null
}], ["crossknife", {
  type: "secondary",
  speed: 1.6,
  // Same fast speed
  dmg: 7,
  // Same damage per knife
  knockback: 5,
  // Same minimal knockback
  reach: 85,
  // Good reach
  throwable: true,
  dualThrow: true,
  // Custom property: can throw two knives
  upgrade: null
}], ["war hammer", {
  type: "secondary",
  speed: 0.5,
  // Even slower, but ultimate impact
  dmg: 30,
  // Extremely high damage
  knockback: 100,
  // Max knockback
  reach: 90,
  // Longer reach
  upgrade: null
}],
// Adjusted based on your request: "like hands but stronger and faster slightly and same knockback"
["brass knuckles", {
  type: "secondary",
  speed: 1.2,
  // Faster than hands (1.0)
  dmg: 12,
  // Stronger than hands (10)
  knockback: 40,
  // Same knockback as hands
  reach: 60,
  // Shorter reach
  combo: true,
  armorBreak: true,
  // Custom property: can reduce enemy armor
  upgrade: null
}]]);

// Assign IDs and names for convenience (though Map keys are already names)
let idCounter = 0;
WEAPON_DATA.forEach((weapon, name) => {
  weapon.id = idCounter++;
  weapon.name = name;
});

/**
 * Retrieves the properties of a specific weapon by its name.
 * We'll primarily use name as the key for simplicity on the server.
 * @param {string} weaponName - The name of the weapon (e.g., "axe").
 * @returns {object|null} The weapon object or null if not found.
 */
function getWeaponProperties(weaponName) {
  return WEAPON_DATA.get(weaponName) || null;
}
const WEAPON_NAMES = Array.from(WEAPON_DATA.keys());
module.exports = {
  WEAPON_DATA,
  getWeaponProperties,
  WEAPON_NAMES: Array.from(WEAPON_DATA.keys())
};

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./public/client/main.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=bundle.js.map