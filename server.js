const path = require("path");
const fastify = require("fastify")({ logger: false });
const fastifyStatic = require("@fastify/static");

// --- Static Files Setup ---
// Serves static files (like index.html, main.js, utils.js, drawing.js, leaderboard.js) from the 'public' directory.
fastify.register(fastifyStatic, {
    root: path.join(__dirname, "public"),
    prefix: "/",
});

// --- Server Startup ---
fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Fastify server running at ${address}`);

    // Initialize Socket.IO and attach it to the Fastify server
    const io = require("socket.io")(fastify.server, {
        cors: { origin: "*" } // Allows connections from any origin for development
    });

    // --- Server-Authoritative Game State ---
    // All critical game data is stored and managed here.
    let players = {}; // Stores all connected players' game state
    let resources = {}; // Stores all resource nodes in the world
    let resourceIdCounter = 0; // Counter for unique resource IDs
    let topKillerId = null; // Server-side tracking of the current top killer

    // --- Game Constants (Server-Side Authoritative) ---
    // These constants define the core rules and physics of the game.
    const MAX_HEALTH = 100;
    const WORLD_WIDTH = 4000;
    const WORLD_HEIGHT = 4000;
    const PLAYER_COLLISION_RADIUS = 30; // Player hitbox size for server-side collisions
    const MAX_PLAYER_DIMENSION = PLAYER_COLLISION_RADIUS; // Used for world boundary clamping
    const PLAYER_SPEED = 8; // Server-controlled player movement speed
    const GAME_TICK_RATE = 1000 / 30; // Server update rate (30 times per second)
    const SWING_COOLDOWN = 400; // Server-enforced cooldown for player swings
    const FIST_DAMAGE = 10; // Server-controlled damage dealt by a player's punch
    const FIST_REACH = 70; // Server-controlled reach of a player's punch
    const FIST_ARC_HALF_ANGLE = Math.PI / 2; // Server-controlled attack arc (90 degrees)
    const FIST_KNOCKBACK_STRENGTH = 40; // Server-controlled knockback distance

    // Resource Type-Specific Constants
    const RESOURCE_TYPES = {
        WOOD: 'wood',
        STONE: 'stone',
        FOOD: 'food',
        GOLD: 'gold'
    };

    // Define properties for each resource type, including collection amounts and XP rewards.
    // These are authoritative on the server.
    const RESOURCE_PROPERTIES = {
        [RESOURCE_TYPES.WOOD]: {
            collectionAmount: 1,
            xpReward: 7.5,
            collisionRadius: 100,
            hitRadius: 120, // Server-side hit detection range
        },
        [RESOURCE_TYPES.STONE]: {
            collectionAmount: 1,
            xpReward: 7.5,
            collisionRadius: 100,
            hitRadius: 120,
        },
        [RESOURCE_TYPES.FOOD]: {
            collectionAmount: 1,
            xpReward: 7.5,
            collisionRadius: 70,
            hitRadius: 90,
        },
        [RESOURCE_TYPES.GOLD]: {
            collectionAmount: 10,
            xpReward: 15.0,
            collisionRadius: 70,
            hitRadius: 90,
        }
    };

    const RESOURCE_COUNT_TOTAL = 30; // Fixed total number of resources on the map

    // Weights for resource spawning (more chances for common resources)
    const RESOURCE_SPAWN_WEIGHTS = [
        RESOURCE_TYPES.WOOD, RESOURCE_TYPES.WOOD, RESOURCE_TYPES.WOOD, RESOURCE_TYPES.WOOD,
        RESOURCE_TYPES.STONE, RESOURCE_TYPES.STONE, RESOURCE_TYPES.STONE,
        RESOURCE_TYPES.FOOD, RESOURCE_TYPES.FOOD, RESOURCE_TYPES.FOOD,
        RESOURCE_TYPES.GOLD
    ];

    // Cooldown for emitting resource wiggle events to clients (to prevent spamming)
    const RESOURCE_WIGGLE_EMIT_COOLDOWN = SWING_COOLDOWN;

    // --- Aging System Constants (Server-Authoritative) ---
    // XP needed to reach the NEXT age from the CURRENT age.
    const AGE_XP_REQUIREMENTS = {
        0: 100, // XP to go from Age 0 to Age 1
        1: 200, // XP to go from Age 1 to Age 2
        2: 500, // XP to go from Age 2 to Age 3
        3: 850, // XP to go from Age 3 to Age 4
        // Add more specific values or a general formula for higher ages if needed
    };
    const FALLBACK_XP_MULTIPLIER_PER_AGE = 1.3; // Multiplier for ages beyond explicitly defined

    // Chat Range for proximity-based messages (Server-enforced)
    const CHAT_RANGE = 500; // Players within this distance can see the message bubble

    /**
     * Calculates the XP required for a player to reach the next age.
     * @param {number} currentAge - The player's current age.
     * @returns {number} The XP required for the next age.
     */
    function calculateXpToNextAge(currentAge) {
        if (AGE_XP_REQUIREMENTS[currentAge] !== undefined) {
            return AGE_XP_REQUIREMENTS[currentAge];
        } else {
            // For ages beyond what's explicitly defined, continue exponential growth
            const lastDefinedAge = Math.max(...Object.keys(AGE_XP_REQUIREMENTS).map(Number));
            const xpAtLastDefinedAge = AGE_XP_REQUIREMENTS[lastDefinedAge];
            const ageDifference = currentAge - lastDefinedAge;
            return Math.floor(xpAtLastDefinedAge * Math.pow(FALLBACK_XP_MULTIPLIER_PER_AGE, ageDifference));
        }
    }

    /**
     * Clamps a value between a minimum and maximum.
     * @param {number} value - The value to clamp.
     * @param {number} min - The minimum allowed value.
     * @param {number} max - The maximum allowed value.
     * @returns {number} The clamped value.
     */
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Calculates the shortest angular distance between two angles.
     * @param {number} angle1 - The first angle in radians.
     * @param {number} angle2 - The second angle in radians.
     * @returns {number} The shortest angular difference.
     */
    function getShortestAngleDiff(angle1, angle2) {
        let diff = angle2 - angle1;
        diff = (diff + Math.PI) % (2 * Math.PI) - Math.PI;
        return diff;
    }

    /**
     * Creates and adds a new resource to the game world.
     * @param {string} type - The type of resource (e.g., 'wood', 'stone').
     * @param {number} x - The x-coordinate of the resource.
     * @param {number} y - The y-coordinate of the resource.
     * @returns {object|null} The created resource object, or null if type is invalid.
     */
    function createResource(type, x, y) {
        const id = `resource-${resourceIdCounter++}`;
        const props = RESOURCE_PROPERTIES[type];

        if (!props) {
            console.error(`Server: Attempted to create resource of unknown type: ${type}`);
            return null;
        }

        resources[id] = {
            id: id,
            type: type,
            x: clamp(x, props.collisionRadius, WORLD_WIDTH - props.collisionRadius),
            y: clamp(y, props.collisionRadius, WORLD_HEIGHT - props.collisionRadius),
            radius: props.collisionRadius, // Store individual collision radius
            hitRadius: props.hitRadius,    // Store individual hit radius for collection
            lastWiggleEmitTime: 0,
        };
        return resources[id];
    }

    /**
     * Checks if a new resource position overlaps with any existing resources.
     * @param {number} newX - The x-coordinate of the new resource.
     * @param {number} newY - The y-coordinate of the new resource.
     * @param {number} newResourceRadius - The collision radius of the new resource.
     * @returns {boolean} True if overlaps, false otherwise.
     */
    function isOverlapping(newX, newY, newResourceRadius) {
        for (const id in resources) {
            const existingResource = resources[id];
            const dx = newX - existingResource.x;
            const dy = newY - existingResource.y;
            const distance = Math.hypot(dx, dy);

            // Check for overlap based on collision radius of both new and existing resources
            if (distance < (newResourceRadius + existingResource.radius)) {
                return true; // Overlaps with an existing resource
            }
        }
        return false; // No overlap
    }

    /**
     * Populates the game world with a fixed number of resources at startup.
     * These resources are permanent and do not respawn.
     */
    function generateInitialResources() {
        for (let i = 0; i < RESOURCE_COUNT_TOTAL; i++) {
            // Select random type based on weights
            let randomType = RESOURCE_SPAWN_WEIGHTS[Math.floor(Math.random() * RESOURCE_SPAWN_WEIGHTS.length)];
            const resourceConfig = RESOURCE_PROPERTIES[randomType];
            if (!resourceConfig) continue; // Skip if type is somehow invalid

            let randomX, randomY;
            let attempts = 0;
            const MAX_ATTEMPTS = 100;

            do {
                randomX = Math.random() * (WORLD_WIDTH - 2 * resourceConfig.collisionRadius) + resourceConfig.collisionRadius;
                randomY = Math.random() * (WORLD_HEIGHT - 2 * resourceConfig.collisionRadius) + resourceConfig.collisionRadius;
                attempts++;
                if (attempts > MAX_ATTEMPTS) {
                    console.warn(`Server: Could not find non-overlapping position for resource after ${MAX_ATTEMPTS} attempts. Skipping resource.`);
                    break;
                }
            } while (isOverlapping(randomX, randomY, resourceConfig.collisionRadius)); // Pass the radius of the resource being placed

            if (attempts <= MAX_ATTEMPTS) {
                createResource(randomType, randomX, randomY);
            }
        }
        console.log(`Server: Generated ${Object.keys(resources).length} fixed resources.`);
    }

    /**
     * Checks if a player has enough XP to age up and performs the age-up logic.
     * @param {object} player - The player object.
     */
    function checkAgeUp(player) {
        while (player.xp >= player.xpToNextAge) {
            player.age++;
            player.xp -= player.xpToNextAge; // Carry over excess XP
            player.xpToNextAge = calculateXpToNextAge(player.age);
            console.log(`Server: ${player.name} aged up to Age ${player.age}!`);
            // Fully heal on age up
            player.health = MAX_HEALTH;
        }
    }


    // --- Server-Side Collision Detection and Resolution Functions ---

    /**
     * Handles collisions between players, preventing overlap.
     */
    function checkPlayerCollisions() {
        const playerIds = Object.keys(players);
        for (let i = 0; i < playerIds.length; i++) {
            for (let j = i + 1; j < playerIds.length; j++) {
                const player1 = players[playerIds[i]];
                const player2 = players[playerIds[j]];

                if (player1.isDead || player2.isDead) continue;

                const dx = player2.x - player1.x;
                const dy = player2.y - player1.y;
                const distance = Math.hypot(dx, dy);

                const minDistance = PLAYER_COLLISION_RADIUS * 2;

                if (distance < minDistance && distance !== 0) {
                    const overlap = minDistance - distance;
                    const angle = Math.atan2(dy, dx);

                    const moveX = Math.cos(angle) * (overlap / 2);
                    const moveY = Math.sin(angle) * (overlap / 2);

                    player1.x -= moveX;
                    player1.y -= moveY;
                    player2.x += moveX;
                    player2.y += moveY;

                    // Clamp player positions to world boundaries after collision resolution
                    player1.x = clamp(player1.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
                    player1.y = clamp(player1.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);
                    player2.x = clamp(player2.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
                    player2.y = clamp(player2.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);
                }
            }
        }
    }

    /**
     * Handles collisions between players and resources, preventing overlap.
     */
    function checkPlayerResourceCollisions() {
        const playerIds = Object.keys(players);
        const resourceIds = Object.keys(resources);

        for (let i = 0; i < playerIds.length; i++) {
            const player = players[playerIds[i]];
            if (player.isDead) continue;

            for (let j = 0; j < resourceIds.length; j++) {
                const resource = resources[resourceIds[j]];

                const dx = player.x - resource.x;
                const dy = player.y - resource.y;
                const distance = Math.hypot(dx, dy);

                // Use the individual resource's radius for collision
                const minDistance = PLAYER_COLLISION_RADIUS + resource.radius;

                if (distance < minDistance && distance !== 0) {
                    const overlap = minDistance - distance;
                    const angle = Math.atan2(dy, dx);

                    player.x += Math.cos(angle) * overlap;
                    player.y += Math.sin(angle) * overlap;

                    // Clamp player positions to world boundaries after collision resolution
                    player.x = clamp(player.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
                    player.y = clamp(player.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);
                }
            }
        }
    }


    // --- Socket.IO Connection Handling ---
    io.on("connection", (socket) => {
        console.log("Server: Player connected:", socket.id);

        // Initialize a new player with default properties and aging data
        players[socket.id] = {
            id: socket.id,
            x: Math.random() * (WORLD_WIDTH - 200) + 100, // Random spawn position
            y: Math.random() * (WORLD_HEIGHT - 200) + 100, // Random spawn position
            angle: 0,
            name: "Unnamed",
            health: MAX_HEALTH,
            isDead: false,
            deathTime: 0, // Timestamp when player died
            keys: {}, // Store client-sent key states
            inputAngle: 0, // Store client-sent mouse angle
            lastSwingTime: 0, // Server-side swing cooldown tracker
            inventory: { // Player's resource inventory
                wood: 0,
                stone: 0,
                food: 0,
                gold: 0,
                kills: 0 // Track player kills
            },
            age: 0, // Player's current age
            xp: 0,    // Player's current XP
            xpToNextAge: calculateXpToNextAge(0) // XP needed for the next age
        };

        // Send the new client the current game state (all players and resources)
        socket.emit("init", { players: players, resources: resources, topKillerId: topKillerId }); // NEW: Send topKillerId on init
        // Broadcast the new player's arrival to all other connected clients
        socket.broadcast.emit("player-joined", players[socket.id]);

        // Handle player name updates from client
        socket.on("send-name", (data) => {
            if (players[data.id]) {
                players[data.id].name = data.name;
            }
        });

        // Handle client input (keys and mouse angle)
        socket.on("client-input", (data) => {
            const player = players[socket.id];
            if (player && !player.isDead) {
                player.keys = data.keys || {};
                player.inputAngle = data.angle || 0;
                if (data.name) {
                    player.name = data.name; // Update player name if provided
                }
            }
        });

        // Handle incoming local chat messages from a client
        socket.on('local-chat-message', (data) => {
            const sender = players[socket.id];
            // Validate message content and length
            if (sender && data.message && typeof data.message === 'string' && data.message.trim().length > 0) {
                // Sanitize message to prevent XSS or very long messages
                const cleanMessage = data.message.trim().substring(0, 100); // Max 100 chars

                // Iterate through all players to find nearby ones for proximity chat
                for (const playerId in players) {
                    const targetPlayer = players[playerId];
                    if (targetPlayer.isDead) continue; // Don't send messages to dead players

                    const dx = sender.x - targetPlayer.x;
                    const dy = sender.y - targetPlayer.y;
                    const distance = Math.hypot(dx, dy);

                    if (distance <= CHAT_RANGE) {
                        // Emit the message to each nearby client
                        io.to(targetPlayer.id).emit('local-chat-message', {
                            senderId: socket.id,
                            message: cleanMessage
                        });
                    }
                }
                console.log(`Local Chat Message from ${sender.name} (${socket.id}): "${cleanMessage}" (broadcast to nearby players)`);
            }
        });

        // Handle player swing action (authoritative combat logic)
        socket.on('player-swing', () => {
            const attacker = players[socket.id];
            if (!attacker || attacker.isDead) return; // Only living players can swing

            const now = Date.now();
            // Enforce swing cooldown on the server
            if (now - attacker.lastSwingTime < SWING_COOLDOWN) return;

            attacker.lastSwingTime = now;
            // Tell clients to play the swing animation
            io.emit('player-has-swung', socket.id);

            // --- Player vs Player Combat Logic ---
            for (const id in players) {
                if (id === socket.id || players[id].isDead) continue; // Don't hit self or dead players

                const target = players[id];

                const dx_target = target.x - attacker.x;
                const dy_target = target.y - attacker.y;
                const distance_target = Math.hypot(dx_target, dy_target);

                // Check if target is within the FIST_REACH and within the attack arc
                if (distance_target <= FIST_REACH + PLAYER_COLLISION_RADIUS) {
                    const angleToTarget = Math.atan2(dy_target, dx_target);
                    const angleDiff = getShortestAngleDiff(attacker.angle, angleToTarget);

                    if (Math.abs(angleDiff) <= FIST_ARC_HALF_ANGLE) {
                        target.health = Math.max(0, target.health - FIST_DAMAGE);
                        if (target.health <= 0) {
                            target.isDead = true;
                            target.deathTime = Date.now(); // Record death time
                            attacker.inventory.kills = (attacker.inventory.kills || 0) + 1; // Increment attacker's kills
                            console.log(`Server: ${target.name} has been defeated by ${attacker.name}!`);
                        }
                        console.log(`Server: ${attacker.name} hit ${target.name}. ${target.name}'s health is now ${target.health}`);

                        // Apply knockback
                        const knockbackAngle = angleToTarget;
                        target.x += Math.cos(knockbackAngle) * FIST_KNOCKBACK_STRENGTH;
                        target.y += Math.sin(knockbackAngle) * FIST_KNOCKBACK_STRENGTH;

                        // Clamp target position to world boundaries after knockback
                        target.x = clamp(target.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
                        target.y = clamp(target.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);
                    }
                }
            }

            // --- Resource Collection Logic ---
            for (const resId in resources) {
                const resource = resources[resId];

                const dx_resource = resource.x - attacker.x;
                const dy_resource = resource.y - attacker.y;
                const distanceToResource = Math.hypot(dx_resource, dy_resource);

                if (distanceToResource <= FIST_REACH + resource.hitRadius) {
                    const angleToResource = Math.atan2(dy_resource, dx_resource);
                    const angleDiff = getShortestAngleDiff(attacker.angle, angleToResource);

                    if (Math.abs(angleDiff) <= FIST_ARC_HALF_ANGLE) {
                        // Enforce wiggle emit cooldown to prevent excessive client updates
                        if (now - resource.lastWiggleEmitTime >= RESOURCE_WIGGLE_EMIT_COOLDOWN) {
                            // Tell clients to show resource wiggle animation
                            io.emit('resource-wiggled', { resourceId: resId, direction: angleToResource });
                            
                            // Update player's inventory and XP (authoritative)
                            attacker.inventory[resource.type] += RESOURCE_PROPERTIES[resource.type].collectionAmount;
                            attacker.xp += RESOURCE_PROPERTIES[resource.type].xpReward; 
                            checkAgeUp(attacker); // Check for age up after gaining XP

                            resource.lastWiggleEmitTime = now; // Reset wiggle cooldown
                            console.log(`Server: ${attacker.name} collected ${RESOURCE_PROPERTIES[resource.type].collectionAmount} ${resource.type}. Inventory:`, attacker.inventory);
                            console.log(`Server: ${attacker.name} gained ${RESOURCE_PROPERTIES[resource.type].xpReward} XP. Current XP: ${attacker.xp}/${attacker.xpToNextAge}`);
                        }
                    }
                }
            }
        });

        // Handle player respawn request
        socket.on('respawn', () => {
            const player = players[socket.id];
            if (player && player.isDead) {
                console.log(`Server: ${player.name} is respawning.`);
                // Reset player state to alive and initial values
                player.health = MAX_HEALTH;
                player.isDead = false;
                player.deathTime = 0; // Clear death time
                player.x = Math.random() * (WORLD_WIDTH - 200) + 100; // New random spawn position
                player.y = Math.random() * (WORLD_HEIGHT - 200) + 100;
                player.inventory = { // Reset inventory on respawn
                    wood: 0,
                    stone: 0,
                    food: 0,
                    gold: 0,
                    kills: 0,
                };
                player.age = 0; // Reset age
                player.xp = 0; // Reset XP
                player.xpToNextAge = calculateXpToNextAge(0); // Recalculate XP for next age
            }
        });

        // Handle player disconnection
        socket.on("disconnect", () => {
            console.log("Server: Player disconnected:", socket.id);
            delete players[socket.id]; // Remove player from server state
            io.emit("player-left", socket.id); // Notify other clients
        });

        // Handle ping requests from client and send pong back for latency calculation
        socket.on('ping', () => {
            socket.emit('pong', Date.now());
        });
    });

    // --- Initial Fixed Resource Generation ---
    generateInitialResources();

    // --- Server-Side Game Loop (Authoritative State Updates) ---
    setInterval(() => {
        // NEW: Determine the top killer on the server
        let currentTopKillerId = null;
        let maxKills = -1;

        for (const id in players) {
            const player = players[id];
            // Only consider living players for top killer status and those with actual kills
            if (!player.isDead && player.inventory && player.inventory.kills !== undefined && player.inventory.kills > 0) {
                if (player.inventory.kills > maxKills) {
                    maxKills = player.inventory.kills;
                    currentTopKillerId = id;
                }
            }
        }
        // If no one has kills (maxKills remains -1 or 0), then no one is the top killer.
        // Otherwise, set the topKillerId.
        topKillerId = (maxKills > 0) ? currentTopKillerId : null;

        for (const id in players) {
            const player = players[id];
            if (player.isDead) continue; 

            let moveX = 0;
            let moveY = 0;
            // Process player movement based on client input
            if (player.keys["w"]) moveY -= 1;
            if (player.keys["s"]) moveY += 1;
            if (player.keys["a"]) moveX -= 1;
            if (player.keys["d"]) moveX += 1;

            const magnitude = Math.hypot(moveX, moveY);
            if (magnitude > 0) {
                player.x += (moveX / magnitude) * PLAYER_SPEED;
                player.y += (moveY / magnitude) * PLAYER_SPEED;
            }

            // Clamp player positions to world boundaries
            player.x = clamp(player.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
            player.y = clamp(player.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);

            // Update player angle based on client input
            player.angle = player.inputAngle;
        }

        // Perform server-side collision checks
        checkPlayerCollisions();
        checkPlayerResourceCollisions();

        // Emit the updated game state to all connected clients, including the top killer ID
        io.emit("player-moved", { players: players, resources: resources, topKillerId: topKillerId });
    }, GAME_TICK_RATE);
});
