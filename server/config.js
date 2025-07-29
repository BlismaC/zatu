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
        collisionRadius: 100, // Similar size to bush/stone
        hitRadius: 120,
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

module.exports.MAX_HEALTH = MAX_HEALTH;
module.exports.WORLD_WIDTH = WORLD_WIDTH;
module.exports.WORLD_HEIGHT = WORLD_HEIGHT;
module.exports.PLAYER_COLLISION_RADIUS = PLAYER_COLLISION_RADIUS;
module.exports.MAX_PLAYER_DIMENSION = MAX_PLAYER_DIMENSION;
module.exports.PLAYER_SPEED = PLAYER_SPEED;
module.exports.GAME_TICK_RATE = GAME_TICK_RATE;
module.exports.SWING_COOLDOWN = SWING_COOLDOWN;
module.exports.FIST_DAMAGE = FIST_DAMAGE;
module.exports.FIST_REACH = FIST_REACH;
module.exports.FIST_ARC_HALF_ANGLE = FIST_ARC_HALF_ANGLE;
module.exports.FIST_KNOCKBACK_STRENGTH = FIST_KNOCKBACK_STRENGTH;

module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
module.exports.RESOURCE_PROPERTIES = RESOURCE_PROPERTIES;
module.exports.RESOURCE_COUNT_TOTAL = RESOURCE_COUNT_TOTAL;
module.exports.RESOURCE_SPAWN_WEIGHTS = RESOURCE_SPAWN_WEIGHTS;
module.exports.RESOURCE_WIGGLE_EMIT_COOLDOWN = RESOURCE_WIGGLE_EMIT_COOLDOWN;
module.exports.AGE_XP_REQUIREMENTS = AGE_XP_REQUIREMENTS;
module.exports.FALLBACK_XP_MULTIPLIER_PER_AGE = FALLBACK_XP_MULTIPLIER_PER_AGE;
module.exports.CHAT_RANGE = CHAT_RANGE;

