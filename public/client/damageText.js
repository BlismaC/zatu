// --- Global Variables ---
let socket;
export let myId; // Export myId
export let players = {}; // Export players
export let resources = {}; // Export resources
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
export const worldWidth = 10000; // Export
export const worldHeight = 10000; // Export
export const MAX_HEALTH = 100; // Export
export const cameraLerpFactor = 0.01; // Export
export const PLAYER_SMOOTHING_FACTOR = 15; // Export
export const TRAIL_LENGTH = 10; // Export
export const TRAIL_MAX_ALPHA = 0.3; // Export
export const playerBodyRadiusX = 30; // Export
export const playerBodyRadiusY = 30; // Export
export const handRadius = 14; // Export
export const handSideOffset = playerBodyRadiusY - (handRadius * 0.3); // Export
export const handForwardOffset = playerBodyRadiusX * 0.6; // Export
export const SWING_DURATION = 250; // Export
export const SWING_REACH = 40;     // Export
export const SWING_INWARD_AMOUNT = 0.5; // Export
export const healthBarWidth = 80; // Export
export const healthBarHeight = 12; // Export
export const healthBarVerticalOffsetFromPlayerBottom = 15; // Export
export const healthBarBorderRadius = 6; // Export
export const fullHealthColor = "#5CB85C"; // Export
export const lowHealthColor = "#FF0000"; // Export
export const healthBarBackgroundColor = "rgba(128, 128, 128, 0.5)"; // Export
export const healthBarOutlineColor = "black"; // Export
export const healthBarOutlineWidth = 2; // Export

// Aesthetic green colors
export const backgroundColor = "#4a6741";   // Export
export const worldBorderColor = "#3D8E41"; // Export
export const gridColor = "#317435";        // Export

export const playerFillColor = "#6f4e37"; // Export
export const playerOutlineColor = "black"; // Export
export const playerOutlineWidth = 3; // Export
export const gridSize = 50; // Export
export const minimapSize = 200; // Export
export const minimapPadding = 20; // Export
export const minimapBackgroundColor = "rgba(0, 0, 0, 0.5)"; // Export
export const minimapBorderColor = "#FFF"; // Export

// Resource Visual Constants
export const RESOURCE_TYPES = { // Export
    WOOD: 'wood',
    STONE: 'stone',
    FOOD: 'food',
    GOLD: 'gold'
};

export const RESOURCE_PROPERTIES = {
    [RESOURCE_TYPES.WOOD]: {
        collectionAmount: 1,
        xpReward: 7.5,
        collisionRadius: 100,
        hitRadius: 120,
    },
    [RESOURCE_TYPES.STONE]: {
        collectionAmount: 1,
        xpReward: 7.5,
        collisionRadius: 100,
        hitRadius: 120,
    },
    [RESOURCE_TYPES.FOOD]: { // Bush properties
        collectionAmount: 1,
        xpReward: 7.5,
        collisionRadius: 70,
        hitRadius: 90,
    },
    [RESOURCE_TYPES.GOLD]: { // Gold properties
        collectionAmount: 10,
        xpReward: 15.0,
        collisionRadius: 100,
        hitRadius: 120,
    }
};

export const RESOURCE_OUTLINE_COLOR = "black"; // Export
export const RESOURCE_OUTLINE_WIDTH = 2; // Export
export const RESOURCE_DRAW_SIZE = 100; // Export (This is used as tmpScale in resourceDesigns)

// Wiggle Constants for resources
export const GATHER_WIGGLE = 10; // Export

// Resource Counter UI Constants (these are handled by HTML/CSS now, but keeping in sync for consistency)
export const COUNTER_PADDING = 20; // Export
export const COUNTER_LINE_HEIGHT = 30; // Export
export const COUNTER_FONT_SIZE = 24; // Export
export const COUNTER_TEXT_COLOR = "white"; // Export
export const COUNTER_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.6)"; // Export
export const COUNTER_BORDER_RADIUS = 10; // Export
export const COUNTER_ICON_SIZE = 20; // Export

// Ping Counter Constants
export const PING_INTERVAL = 2000; // Export
export const PING_FONT_SIZE = 28; // Export
export const PING_TEXT_COLOR = "white"; // Export
export const PING_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.6)"; // Export
export const PING_BORDER_RADIUS = 10; // Export
export const PING_PADDING_X = 20; // Export
export const PING_PADDING_Y = 10; // Export

// Player Damage Visual Constants
export const PLAYER_DAMAGE_WIGGLE_STRENGTH = 10; // Export
export const PLAYER_DAMAGE_WIGGLE_DECAY_RATE = 0.8; // Export
export const HIT_FLASH_DURATION = 150; // Adjusted: How long the hit flash lasts in milliseconds (shorter)
export const HIT_FLASH_COLOR = "#FF0000"; // The color of the hit flash (Red)
export const HIT_FLASH_OPACITY = 0.5; // The opacity of the hit flash

// NEW: Chat Bubble Constants
export const CHAT_BUBBLE_DURATION = 5000; // How long a chat message bubble stays visible (5 seconds)
export const CHAT_BUBBLE_OFFSET_Y = 80; // Offset from player Y to top of bubble
export const CHAT_BUBBLE_FONT_SIZE = 20;
export const CHAT_BUBBLE_TEXT_COLOR = "#CCCCCC"; // Lighter gray
export const CHAT_BUBBLE_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.7)";
export const CHAT_BUBBLE_PADDING_X = 15;
export const CHAT_BUBBLE_PADDING_Y = 10;
export const CHAT_BUBBLE_BORDER_RADIUS = 10;

// NEW: Dead Player Hide Delay
export const DEAD_PLAYER_HIDE_DELAY = 10000; // 10 seconds in milliseconds
// In main.js

import { hotbar, initHotbar, handleHotbarInput, activeSlotIndex, addItemToHotbar, getActiveItem, removeActiveItem, setActiveSlotIndex } from './hotbar.js';

// --- Game State Variables ---
export let cameraX = 0; // Export
export let cameraY = 0; // Export
let mouseX = 0;
let mouseY = 0;
const keys = {};
let isLeftMouseDown = false;
let isRightMouseDown = false;
let lastTime = 0;
export let deltaTime = 0; // Export
export let currentPing = 0; // Export
let pingSendTime = 0;

// --- Helper Functions (Imported from utils.js) ---
import { interpolateColor, lerpAngle, clamp } from './utils.js';
import { draw } from './drawing.js'; // Corrected import syntax
import { initLeaderboard, updateLeaderboard } from './leaderboard.js'; // NEW: Import leaderboard functions
import { createDamageText, updateDamageTexts, drawDamageTexts } from './damageText.js';

// --- Event Listeners (initial, non-chat related) ---
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    // Check for both left (0) and right (2) mouse buttons
    if (e.button === 0) {
        isLeftMouseDown = true;
    } else if (e.button === 2) { // Right mouse button
        isRightMouseDown = true;
        e.preventDefault(); // Prevent context menu
    }
    
    // Logic for respawning (applies to both left and right click now)
    const me = players[myId];
    if (me && me.isDead) {
        socket.emit('respawn');
    }
});

canvas.addEventListener('mouseup', (e) => {
    // Reset state for both left and right mouse buttons
    if (e.button === 0) {
        isLeftMouseDown = false;
    } else if (e.button === 2) { // Right mouse button
        isRightMouseDown = false;
    }
});

// Prevent context menu on right-click anywhere on the canvas
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});


startGameButton.addEventListener("click", startGame);
playerNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") startGame();
});

let lastEnterPressTime = 0;
const ENTER_DEBOUNCE_DELAY = 200; // Milliseconds to wait between 'Enter' presses

// ...

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
    if (localChatInput) { // Check if element exists
        const message = localChatInput.value.trim();
        if (message.length > 0) {
            console.log("Sending message:", message);
            socket.emit('local-chat-message', { message: message });
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

    // hotbar
   window.addEventListener('keydown', handleHotbarInput);
   canvas.addEventListener('click', (e) => {
        let visibleSlots = hotbar.map((item, index) => item ? index : null).filter(i => i !== null);
        const numVisible = visibleSlots.length;
        if (numVisible === 0) return;

        const totalWidth = numVisible * 60 + (numVisible - 1) * 5; // HOTBAR_SLOT_SIZE + HOTBAR_SPACING
        const startX = (canvas.width / 2) - (totalWidth / 2);
        const startY = canvas.height - 60 - 10; // HOTBAR_SLOT_SIZE + HOTBAR_PADDING

        visibleSlots.forEach((slotIndex, i) => {
            const slotX = startX + i * (60 + 5);
            const slotY = startY;

            if (
                mouseX >= slotX && mouseX <= slotX + 60 &&
                mouseY >= slotY && mouseY <= slotY + 60
            ) {
                setActiveSlotIndex(slotIndex);
            }
        });
    });

   document.addEventListener("keydown", (e) => {
    const currentTime = Date.now();

    //  const isMainMenuVisible = mainMenu.style.display === 'block' ? true : false;
    const isChatInputFocused = localChatInput && document.activeElement === localChatInput;
    const me = players[myId];

    // If the main menu is visible, prevent ALL game/chat input
  /*  if (isMainMenuVisible) {
        e.preventDefault();
        toggleChatInputVisibility(false);
        if (localChatInput) localChatInput.value = '';
        return;
    } */

    // Prevent chat interactions if the player is dead
    if (me && me.isDead) {
        if (e.key.toLowerCase() === 'enter') {
            e.preventDefault();
            console.log("Player is dead. Cannot open chat or send messages.");
            toggleChatInputVisibility(false);
            if (localChatInput) localChatInput.value = '';
        }
        for (const key in keys) {
            keys[key] = false;
        }
        return;
    }

    // Handle 'Enter' key presses for chat
    if (e.key.toLowerCase() === 'enter') {
        e.preventDefault(); // Prevent default Enter key behavior (e.g., newline)

        // --- NEW DEBOUNCING LOGIC ---
        // Only process 'Enter' if enough time has passed since the last press
        if (currentTime - lastEnterPressTime < ENTER_DEBOUNCE_DELAY) {
            // console.log("Enter key debounced. Too fast.");
            return; // Ignore this press, it's too soon
        }
        lastEnterPressTime = currentTime; // Update the last press time
        // ---------------------------

        if (isChatInputFocused) {
            // If chat is focused, attempt to send the message
            sendLocalChatMessage(); // This function will close the chat if message is sent or empty
        } else {
            // If chat is not focused, open it
            toggleChatInputVisibility(true);
        }
    } else if (!isChatInputFocused) {
        // Only capture game input if chat is not focused
        if (typeof e.key === 'string') {
            keys[e.key.toLowerCase()] = true;
        }
    }
});

    document.addEventListener("keyup", (e) => {
        const isChatInputFocused = localChatInput && document.activeElement === localChatInput;
        const isMainMenuVisible = mainMenu.style.display === 'block'; // Check main menu visibility

        // If main menu is visible, don't process keyup for game movement or chat
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
    document.addEventListener('click', (e) => {
        // Only act if the chat input exists and is currently visible
        if (localChatInput && localChatInput.style.opacity === '1') {
            // Check if the click target is outside the input field itself
            const isMainMenuVisible = mainMenu.style.display === 'block'; // Check main menu visibility
            // Only hide chat on outside click if main menu is NOT visible
            if (e.target !== localChatInput && !isMainMenuVisible) {
                toggleChatInputVisibility(false);
            }
        }
    });


    socket = io();

    const initializePlayerVisuals = (p) => {
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
        p.messageDisplayTime = 0; // Timestamp when message started displaying
        p.deathTime = 0; // NEW: Initialize deathTime for client-side player object
    };

    socket.on("init", (data) => {
        myId = socket.id;
        players = data.players;
        for (const id in data.resources) {
            resources[id] = { ...data.resources[id], xWiggle: 0, yWiggle: 0 };
        }
        for (const id in players) {
            initializePlayerVisuals(players[id]);
        }

        const me = players[myId];
        if (me) {
            cameraX = clamp(me.x - canvas.width / 2, 0, worldWidth - canvas.width);
            cameraY = clamp(me.y - canvas.height / 2, 0, worldHeight - canvas.height);
        }

        socket.emit("send-name", { id: myId, name: playerName });

        initLeaderboard();
        initHotbar();
    });

    socket.on("player-moved", (data) => {
        const allPlayersData = data.players;
        const allResourcesData = data.resources;

        for (const id in allPlayersData) {
            const serverPlayer = allPlayersData[id];
            if (players[id]) {
                const p = players[id];

                // Check if player just died
                if (serverPlayer.isDead && !p.isDead && id === myId) {
                    console.log("You died! Returning to main menu.");
                    mainMenu.style.display = 'block'; // Show main menu
                    if (mainMenuBackground) {
                        mainMenuBackground.style.display = 'none'; // Hide the static background image
                    }
                    // Blur the player name input to prevent it from capturing 'Enter'
                    if (playerNameInput) {
                        playerNameInput.blur();
                    }
                    
                    // Hide game UI elements
                    if (resourceCounterContainer) resourceCounterContainer.style.display = 'none';
                    if (leaderboardContainer) leaderboardContainer.style.display = 'none';
                    toggleChatInputVisibility(false); // Hide chat input
                }

                if (serverPlayer.health < p.lastKnownHealth) {
                    p.lastDamageTime = Date.now();
                    p.damageWiggleX = (Math.random() - 0.5) * PLAYER_DAMAGE_WIGGLE_STRENGTH;
                    p.damageWiggleY = (Math.random() - 0.5) * PLAYER_DAMAGE_WIGGLE_STRENGTH;
 
                    const damageAmount = p.lastKnownHealth - serverPlayer.health;
                    const isOwnPlayer = (id === myId);
                    createDamageText(p.visualX, p.visualY, damageAmount, isOwnPlayer, cameraX, cameraY);
                }

                // Preserve client-side visual states including chat message state
                serverPlayer.visualX = p.visualX;
                serverPlayer.visualY = p.visualY;
                serverPlayer.visualAngle = p.visualAngle;
                serverPlayer.isSwinging = p.isSwinging;
                serverPlayer.swingStartTime = p.swingStartTime;
                serverPlayer.trail = p.trail;
                serverPlayer.lastSwungHand = p.lastSwungHand;
                serverPlayer.currentSwingingHand = p.currentSwingingHand;
                serverPlayer.lastDamageTime = p.lastDamageTime;
                serverPlayer.damageWiggleX = p.damageWiggleX;
                serverPlayer.damageWiggleY = p.damageWiggleY;
                serverPlayer.lastMessage = p.lastMessage;          // Preserve current message
                serverPlayer.messageDisplayTime = p.messageDisplayTime; // Preserve message display time
                serverPlayer.deathTime = p.deathTime; // Preserve deathTime from server

                // IMPORTANT FIX: Ensure inventory is explicitly updated and includes gold
                p.inventory = {
                    wood: serverPlayer.inventory.wood || 0,
                    stone: serverPlayer.inventory.stone || 0,
                    food: serverPlayer.inventory.food || 0,
                    gold: serverPlayer.inventory.gold || 0
                };
                
                Object.assign(p, serverPlayer); 

                p.lastKnownHealth = serverPlayer.health; 
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
                resources[id] = { ...serverResource, xWiggle: 0, yWiggle: 0 };
            }
        }
        for (const id in resources) {
            if (!allResourcesData[id]) {
                delete resources[id];
            }
        }
        // Update leaderboard whenever player data moves
        updateLeaderboard(players, myId);
    });

    socket.on("player-joined", (player) => {
        players[player.id] = player;
        initializePlayerVisuals(player);
    });

    socket.on('player-has-swung', (id) => {
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

    socket.on("player-left", (id) => {
        delete players[id];
        // Update leaderboard when a player leaves
        updateLeaderboard(players, myId);
    });

    socket.on('resource-wiggled', (data) => {
        wiggleGameObject(data.resourceId, data.direction);
    });

    socket.on('pong', (timestamp) => {
        currentPing = Date.now() - pingSendTime;
    });

    // Listen for local chat messages from server
    socket.on('local-chat-message', (data) => {
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

    let currentKeys = { ...keys }; // Create a copy of the keys object

    if (isChatInputFocused) {
        // If chat is focused, clear all movement keys to stop the player
        for (const key in currentKeys) {
            if (['w', 'a', 's', 'd'].includes(key)) { // Only clear movement keys
                currentKeys[key] = false;
            }
        }
    }

    // Always send client-input, but use the potentially modified 'currentKeys'
    const dx = (mouseX + cameraX) - me.visualX;
    const dy = (mouseY + cameraY) - me.visualY;
    const targetAngle = Math.atan2(dy, dx);
    socket.emit("client-input", { keys: currentKeys, angle: targetAngle, name: playerName });

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
    // if (mainMenu.style.display === "none") {
        update();
    // }
    
    // Drawing (rendering) always happens, regardless of menu state,
    // so the canvas is always live in the background.
    draw(ctx, canvas, players, myId, resources, cameraX, cameraY, deltaTime, currentPing, CHAT_BUBBLE_DURATION);

    updateDamageTexts(deltaTime);
    drawDamageTexts(ctx);
    const me = players[myId];
    // Camera movement and resource counter updates only if player exists and is not dead
    // This ensures the camera stays put when dead and menu is up.
    if (me && me.visualX !== undefined && !me.isDead) {
        const targetCameraX = me.visualX - canvas.width / 2;
        const targetCameraY = me.y - canvas.height / 2;
        
        // Smoothed camera movement
        cameraX += (targetCameraX - cameraX) * cameraLerpFactor;
        cameraY += (targetCameraY - cameraY) * cameraLerpFactor;

        cameraX = clamp(cameraX, 0, worldWidth - canvas.width);
        cameraY = clamp(cameraY, 0, worldHeight - canvas.height);

        if (window.updateHtmlResourceCounter && me.inventory) {
            window.updateHtmlResourceCounter(me.inventory);
        }
    } else if (me && me.isDead) {
        // If dead, ensure resource counters are hidden (handled in player-moved death logic)
        // and camera stays fixed at death location.
    }


    requestAnimationFrame(loop);
}
