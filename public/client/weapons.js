// weapons.js - Defines all weapon properties for the game.
// This file centralizes weapon data for easy management and balancing.

const WEAPON_DATA = new Map([
    // Default Weapon (Age 0) - Matches existing server.js FIST_DAMAGE and FIST_KNOCKBACK_STRENGTH
    // This is the baseline for all other weapons.
    ["hands", {
        type: "default",
        speed: 1.0,         // Attack speed multiplier (1.0 is base, higher is faster)
        dmg: 10,            // Damage dealt per hit
        knockback: 40,      // Knockback strength per hit (distance pushed)
        reach: 70,          // How far the attack reaches from player center
        upgrade: null       // No direct upgrade path from hands
    }],

    // Primary Weapons (Age 1 - unlocked early)
    // Generally solid combat options, offering various trade-offs.
    ["bat", {
        type: "primary",
        speed: 0.9,         // Slightly slower than hands
        dmg: 15,            // Noticeably more damage than hands
        knockback: 50,      // Better knockback
        reach: 80,          // Slightly longer reach
        upgrade: null
    }],
    ["axe", {
        type: "primary",
        speed: 0.8,         // Slower, heavy hits
        dmg: 18,            // High damage
        knockback: 60,      // Strong knockback
        reach: 85,          // Good reach
        upgrade: "battle axe"
    }],
    ["spear", {
        type: "primary",
        speed: 1.0,         // Same speed as hands
        dmg: 14,            // Good damage
        knockback: 45,      // Moderate knockback
        reach: 120,         // SIGNIFICANTLY longer reach
        upgrade: ["trident", "javelin"]
    }],
    ["dagger", {
        type: "primary",
        speed: 1.5,         // Very fast
        dmg: 8,             // Low damage, but high DPS due to speed
        knockback: 10,      // Minimal knockback
        reach: 60,          // Shorter reach
        upgrade: "dual daggers"
    }],
    ["short sword", {
        type: "primary",
        speed: 1.1,         // Slightly faster than hands
        dmg: 12,            // Decent damage
        knockback: 30,      // Moderate knockback
        reach: 75,          // Slightly longer reach
        upgrade: "long sword"
    }],

    // Primary Upgrades (Age 7–9 - late game unlocks)
    // Significant power increases from their base versions.
    ["battle axe", {
        type: "primary",
        speed: 0.7,         // Even slower, but massive impact
        dmg: 25,            // Very high damage
        knockback: 80,      // Very strong knockback
        reach: 95,          // Longer reach
        upgrade: null
    }],
    ["trident", {
        type: "primary",
        speed: 1.0,         // Balanced speed
        dmg: 16,            // Good damage
        knockback: 50,      // Good knockback
        reach: 130,         // Even longer reach
        multiHit: true,     // Custom property: can hit multiple targets
        upgrade: null
    }],
    ["javelin", {
        type: "primary",
        speed: 1.0,         // Balanced speed
        dmg: 15,            // Good damage
        knockback: 20,      // Lower knockback due to being throwable
        reach: 100,         // Good reach
        throwable: true,    // Custom property: can be thrown
        upgrade: null
    }],
    ["dual daggers", {
        type: "primary",
        speed: 1.8,         // Extremely fast
        dmg: 9,             // Low damage per hit, but very high DPS
        knockback: 10,      // Minimal knockback
        reach: 65,          // Shorter reach
        combo: true,        // Custom property: allows for combo attacks
        upgrade: null
    }],
    ["long sword", {
        type: "primary",
        speed: 1.0,         // Balanced speed
        dmg: 18,            // High damage
        knockback: 45,      // Good knockback
        reach: 90,          // Longer reach
        upgrade: null
    }],

    // Secondary Weapons (Age 4 - mid-game unlocks)
    // Often offer utility alongside damage, or specialize in a specific combat style.
    ["shield", {
        type: "secondary",
        speed: 0.5,         // Very slow attack, but primary use is blocking
        dmg: 5,             // Very low damage
        knockback: 70,      // High knockback (pushes enemies back to create space)
        reach: 50,          // Very short attack reach
        block: true,        // Custom property: can block attacks
        upgrade: "spiked shield"
    }],
    ["throwing knife", {
        type: "secondary",
        speed: 1.6,         // Very fast
        dmg: 7,             // Low damage
        knockback: 5,       // Very minimal knockback
        reach: 80,          // Good reach for a thrown projectile (initial contact)
        throwable: true,    // Custom property: can be thrown
        upgrade: "crossknife"
    }],
    ["hammer", {
        type: "secondary",
        speed: 0.6,         // Very slow, heavy
        dmg: 22,            // Very high damage
        knockback: 80,      // Extreme knockback
        reach: 80,          // Good reach
        upgrade: "war hammer"
    }],
    ["gloves", {
        type: "secondary",
        speed: 1.7,         // Very fast
        dmg: 6,             // Low damage, quick hits
        knockback: 15,      // Minimal knockback
        reach: 60,          // Shorter reach
        combo: true,        // Custom property: allows for combo attacks
        upgrade: "brass knuckles"
    }],
    ["boomerang", {
        type: "secondary",
        speed: 1.0,         // Balanced speed
        dmg: 10,            // Moderate damage
        knockback: 25,      // Moderate knockback
        reach: 100,         // Good reach for a thrown projectile
        throwable: true,
        return: true,       // Custom property: boomerang returns
        upgrade: null
    }],

    // Secondary Upgrades (Age 7–9 - late game unlocks)
    // Enhanced versions of secondary weapons, improving on their core strengths.
    ["spiked shield", {
        type: "secondary",
        speed: 0.5,         // Same slow speed
        dmg: 8,             // Slightly more damage
        knockback: 75,      // Slightly improved knockback
        reach: 55,          // Slightly longer attack reach
        block: true,
        counterDamage: true, // Custom property: deals damage when blocking
        upgrade: null
    }],
    ["crossknife", {
        type: "secondary",
        speed: 1.6,         // Same fast speed
        dmg: 7,             // Same damage per knife
        knockback: 5,       // Same minimal knockback
        reach: 85,          // Good reach
        throwable: true,
        dualThrow: true,    // Custom property: can throw two knives
        upgrade: null
    }],
    ["war hammer", {
        type: "secondary",
        speed: 0.5,         // Even slower, but ultimate impact
        dmg: 30,            // Extremely high damage
        knockback: 100,     // Max knockback
        reach: 90,          // Longer reach
        upgrade: null
    }],
    // Adjusted based on your request: "like hands but stronger and faster slightly and same knockback"
    ["brass knuckles", {
        type: "secondary",
        speed: 1.2,         // Faster than hands (1.0)
        dmg: 12,            // Stronger than hands (10)
        knockback: 40,      // Same knockback as hands
        reach: 60,          // Shorter reach
        combo: true,
        armorBreak: true,   // Custom property: can reduce enemy armor
        upgrade: null
    }]
]);

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

// Export the data and helper function
module.exports = {
    WEAPON_DATA,
    getWeaponProperties,
    WEAPON_NAMES: Array.from(WEAPON_DATA.keys()) // Export names for client-side lists
};
