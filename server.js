const path = require("path");
const fastify = require("fastify")({ logger: false });
const fastifyStatic = require("@fastify/static");

// --- Static Files Setup ---
fastify.register(fastifyStatic, {
    root: path.join(__dirname, "public"), // Assuming 'public' is where index.html and client.js are
    prefix: "/",
});

// --- Server Startup ---
fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" }, (err, address) => { // Added default port 3000
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Fastify server running at ${address}`);

    const io = require("socket.io")(fastify.server, {
        cors: { origin: "*" }
    });

    // --- Game State and Constants ---
    let players = {};
    let resources = {}; // Object to hold all resource nodes (now permanent and infinite)
    let resourceIdCounter = 0; // To assign unique IDs to resources

    const MAX_HEALTH = 100;
    const WORLD_WIDTH = 10000;
    const WORLD_HEIGHT = 10000;
    const PLAYER_COLLISION_RADIUS = 30; // Player hitbox size
    const MAX_PLAYER_DIMENSION = PLAYER_COLLISION_RADIUS;
    const PLAYER_SPEED = 8;
    const GAME_TICK_RATE = 1000 / 30;
    const SWING_COOLDOWN = 400; // Adjusted: Player's personal swing cooldown (decreased for faster hits)
    const FIST_DAMAGE = 10; // Damage dealt by a player's punch (only to players now)
    const FIST_REACH = 70; // Adjusted: How far a player's punch reaches
    const FIST_ARC_HALF_ANGLE = Math.PI / 2; // ADJUSTED: Half a circle (90 degrees or PI/2 radians)
    const FIST_KNOCKBACK_STRENGTH = 40; // Knockback distance when hitting with fists

    // Resource Type-Specific Constants (New approach for flexible sizes/hitboxes)
    const RESOURCE_TYPES = {
        WOOD: 'wood',
        STONE: 'stone',
        FOOD: 'food', // Represents berry bushes for now
        GOLD: 'gold' // NEW: Gold resource type
    };

    // Define properties for each resource type, including XP reward
    const RESOURCE_PROPERTIES = {
        [RESOURCE_TYPES.WOOD]: {
            collectionAmount: 1,
            xpReward: 7.5, // XP gained per wood
            collisionRadius: 100, // Default size
            hitRadius: 120, // Default hit range
        },
        [RESOURCE_TYPES.STONE]: {
            collectionAmount: 1,
            xpReward: 7.5, // XP gained per stone
            collisionRadius: 100, // Default size
            hitRadius: 120, // Default hit range
        },
        [RESOURCE_TYPES.FOOD]: { // Bush properties
            collectionAmount: 1,
            xpReward: 7.5, // XP gained per food
            collisionRadius: 70, // Aligned with the outer radius of the inner green blob (100 * 0.7 = 70)
            hitRadius: 90,        // Adjusted hit radius (70 + 20 buffer)
        },
        [RESOURCE_TYPES.GOLD]: { // NEW: Gold properties
            collectionAmount: 10, // Changed: Gold gives 10 per collection
            xpReward: 15.0, // Gold gives more XP
            collisionRadius: 70, // Similar size to bush/stone
            hitRadius: 90,
        }
    };

    const RESOURCE_COUNT_TOTAL = 30; // Fixed total number of resources on the map

    // Define weights for resource spawning (more chances for common resources)
    const RESOURCE_SPAWN_WEIGHTS = [
        RESOURCE_TYPES.WOOD, RESOURCE_TYPES.WOOD, RESOURCE_TYPES.WOOD, RESOURCE_TYPES.WOOD, // 4 parts wood
        RESOURCE_TYPES.STONE, RESOURCE_TYPES.STONE, RESOURCE_TYPES.STONE, // 3 parts stone
        RESOURCE_TYPES.FOOD, RESOURCE_TYPES.FOOD, RESOURCE_TYPES.FOOD, // 3 parts food
        RESOURCE_TYPES.GOLD // 1 part gold (rarer)
    ];


    // Cooldown for emitting wiggle events (to prevent spamming clients)
    const RESOURCE_WIGGLE_EMIT_COOLDOWN = SWING_COOLDOWN;

    // --- Aging System Constants (Renamed from Leveling System) ---
    // XP needed to reach the NEXT age from the CURRENT age.
    const AGE_XP_REQUIREMENTS = {
        0: 100, // XP to go from Age 0 to Age 1
        1: 200, // XP to go from Age 1 to Age 2
        2: 500, // XP to go from Age 2 to Age 3
        3: 850, // XP to go from Age 3 to Age 4
        // Add more specific values or a general formula for higher ages if needed
    };
    const FALLBACK_XP_MULTIPLIER_PER_AGE = 1.3; // Multiplier for ages beyond explicitly defined

    // NEW: Chat Range for proximity-based messages
    const CHAT_RANGE = 500; // Players within this distance can see the message bubble

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

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Function to calculate the shortest angular distance between two angles
    function getShortestAngleDiff(angle1, angle2) {
        let diff = angle2 - angle1;
        diff = (diff + Math.PI) % (2 * Math.PI) - Math.PI;
        return diff;
    }

    // Function to create a single PERMANENT resource
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
            hitRadius: props.hitRadius,    // Store individual hit radius for collection
            lastWiggleEmitTime: 0,
        };
        return resources[id];
    }

    // Function to check if a new resource position overlaps with existing ones
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

    // Function to populate the world with FIXED resources at startup
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

    // Function to handle age up logic
    function checkAgeUp(player) {
        while (player.xp >= player.xpToNextAge) {
            player.age++;
            player.xp -= player.xpToNextAge; // Carry over excess XP
            player.xpToNextAge = calculateXpToNextAge(player.age);
            console.log(`Server: ${player.name} aged up to Age ${player.age}!`);
            // Potentially add age-up effects here (e.g., heal, stat increase)
            player.health = MAX_HEALTH; // Fully heal on age up
        }
    }


    // --- Collision Detection and Resolution Function (Players) ---
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

                    player1.x = clamp(player1.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
                    player1.y = clamp(player1.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);
                    player2.x = clamp(player2.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
                    player2.y = clamp(player2.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);
                }
            }
        }
    }

    // Collision Detection and Resolution Function (Player-Resource)
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

                    player.x = clamp(player.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
                    player.y = clamp(player.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);
                }
            }
        }
    }


    // --- Socket.IO Connection Handling ---
    io.on("connection", (socket) => {
        console.log("Server: Player connected:", socket.id);

        // Initialize a new player with aging properties
        players[socket.id] = {
            id: socket.id,
            x: Math.random() * (WORLD_WIDTH - 200) + 100, // Random spawn
            y: Math.random() * (WORLD_HEIGHT - 200) + 100, // Random spawn
            angle: 0,
            name: "Unnamed",
            health: MAX_HEALTH,
            isDead: false,
            deathTime: 0, // NEW: Initialize deathTime
            keys: {},
            inputAngle: 0,
            lastSwingTime: 0,
            inventory: { // Simple inventory for resources
                wood: 0,
                stone: 0,
                food: 0,
                gold: 0, // Initialize gold inventory
                kills: 0
            },
            age: 0, // Starting age
            xp: 0,    // Starting XP
            xpToNextAge: calculateXpToNextAge(0) // XP needed for Age 1
        };

        // Send all current players AND resources to the new client
        socket.emit("init", { players: players, resources: resources });
        socket.broadcast.emit("player-joined", players[socket.id]);

        socket.on("send-name", (data) => {
            if (players[data.id]) {
                players[data.id].name = data.name;
            }
        });

        socket.on("client-input", (data) => {
            const player = players[socket.id];
            if (player && !player.isDead) {
                player.keys = data.keys || {};
                player.inputAngle = data.angle || 0;
                if (data.name) {
                    player.name = data.name;
                }
            }
        });

        // NEW: Handle incoming local chat messages from a client
        socket.on('local-chat-message', (data) => {
            const sender = players[socket.id];
            if (sender && data.message && typeof data.message === 'string' && data.message.trim().length > 0) {
                // Sanitize message to prevent XSS or very long messages
                const cleanMessage = data.message.trim().substring(0, 100); // Max 100 chars

                // Iterate through all players to find nearby ones
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

        socket.on('player-swing', () => {
            const attacker = players[socket.id];
            if (!attacker || attacker.isDead) return;

            const now = Date.now();
            if (now - attacker.lastSwingTime < SWING_COOLDOWN) return;

            attacker.lastSwingTime = now;
            io.emit('player-has-swung', socket.id); // Tell clients player started swing animation

            // Check for hitting other players
            for (const id in players) {
                if (id === socket.id || players[id].isDead) continue;

                const target = players[id];

                const dx_target = target.x - attacker.x;
                const dy_target = target.y - attacker.y;
                const distance_target = Math.hypot(dx_target, dy_target);

                // Check if target is within the FIST_REACH + player's radius and within the attack arc
                if (distance_target <= FIST_REACH + PLAYER_COLLISION_RADIUS) {
                    const angleToTarget = Math.atan2(dy_target, dx_target);
                    const angleDiff = getShortestAngleDiff(attacker.angle, angleToTarget);

                    if (Math.abs(angleDiff) <= FIST_ARC_HALF_ANGLE) {
                        target.health = Math.max(0, target.health - FIST_DAMAGE);
                        if (target.health <= 0) {
                            target.isDead = true;
                            target.deathTime = Date.now(); 
                            console.log(`Server: ${target.name} has been defeated!`);
                            attacker.inventory.kills = (attacker.inventory.kills || 0) + 1;
                        }
                        console.log(`Server: ${attacker.name} hit ${target.name}. ${target.name}'s health is now ${target.health}`);

                        const knockbackAngle = angleToTarget;
                        target.x += Math.cos(knockbackAngle) * FIST_KNOCKBACK_STRENGTH;
                        target.y += Math.sin(knockbackAngle) * FIST_KNOCKBACK_STRENGTH;

                        target.x = clamp(target.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
                        target.y = clamp(target.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);
                    }
                }
            }

            for (const resId in resources) {
                const resource = resources[resId];

                const dx_resource = resource.x - attacker.x;
                const dy_resource = resource.y - attacker.y;
                const distanceToResource = Math.hypot(dx_resource, dy_resource);

                if (distanceToResource <= FIST_REACH + resource.hitRadius) {
                    const angleToResource = Math.atan2(dy_resource, dx_resource);
                    const angleDiff = getShortestAngleDiff(attacker.angle, angleToResource);

                    if (Math.abs(angleDiff) <= FIST_ARC_HALF_ANGLE) {
                        if (now - resource.lastWiggleEmitTime >= RESOURCE_WIGGLE_EMIT_COOLDOWN) {
                            io.emit('resource-wiggled', { resourceId: resId, direction: angleToResource });
                            
                            attacker.inventory[resource.type] += RESOURCE_PROPERTIES[resource.type].collectionAmount;
                            attacker.xp += RESOURCE_PROPERTIES[resource.type].xpReward; 
                            checkAgeUp(attacker); 

                            resource.lastWiggleEmitTime = now;
                            console.log(`Server: ${attacker.name} collected ${RESOURCE_PROPERTIES[resource.type].collectionAmount} ${resource.type}. Inventory:`, attacker.inventory);
                            console.log(`Server: ${attacker.name} gained ${RESOURCE_PROPERTIES[resource.type].xpReward} XP. Current XP: ${attacker.xp}/${attacker.xpToNextAge}`);
                        }
                    }
                }
            }
        });

        socket.on('respawn', () => {
            const player = players[socket.id];
            if (player && player.isDead) {
                console.log(`Server: ${player.name} is respawning.`);
                player.health = MAX_HEALTH;
                player.isDead = false;
                player.deathTime = 0; 
                player.x = Math.random() * (WORLD_WIDTH - 200) + 100;
                player.y = Math.random() * (WORLD_HEIGHT - 200) + 100;
                player.inventory = {
                    wood: 0,
                    stone: 0,
                    food: 0,
                    gold: 0,
                    kills: 0,
                };
                player.age = 0;
                player.xp = 0; 
                player.xpToNextAge = calculateXpToNextAge(0);
            }
        });

        socket.on("disconnect", () => {
            console.log("Server: Player disconnected:", socket.id);
            delete players[socket.id];
            io.emit("player-left", socket.id);
        });

        // Handle ping requests from client and send pong back
        socket.on('ping', () => {
            socket.emit('pong', Date.now());
        });
    });

    // --- Initial Fixed Resource Generation ---
    generateInitialResources();

    // --- Server-Side Game Loop ---
    setInterval(() => {
        for (const id in players) {
            const player = players[id];
            if (player.isDead) continue; 

            let moveX = 0;
            let moveY = 0;
            if (player.keys["w"]) moveY -= 1;
            if (player.keys["s"]) moveY += 1;
            if (player.keys["a"]) moveX -= 1;
            if (player.keys["d"]) moveX += 1;

            const magnitude = Math.hypot(moveX, moveY);
            if (magnitude > 0) {
                player.x += (moveX / magnitude) * PLAYER_SPEED;
                player.y += (moveY / magnitude) * PLAYER_SPEED;
            }

            player.x = clamp(player.x, MAX_PLAYER_DIMENSION, WORLD_WIDTH - MAX_PLAYER_DIMENSION);
            player.y = clamp(player.y, MAX_PLAYER_DIMENSION, WORLD_HEIGHT - MAX_PLAYER_DIMENSION);

            player.angle = player.inputAngle;
        }

        checkPlayerCollisions();
        checkPlayerResourceCollisions();

        io.emit("player-moved", { players: players, resources: resources });
    }, GAME_TICK_RATE);
});
