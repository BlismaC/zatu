// leaderboard.js - Handles client-side leaderboard functionality

let leaderboardContainer;
let leaderboardList;

/**
 * Initializes the leaderboard system.
 * This function should be called once when the game starts.
 */
export function initLeaderboard() {
    leaderboardContainer = document.getElementById('leaderboardContainer');
    leaderboardList = document.getElementById('leaderboardList');

    if (!leaderboardContainer || !leaderboardList) {
        console.error("Leaderboard UI elements not found. Make sure leaderboardContainer and leaderboardList exist in index.html.");
        return;
    }

    console.log("Leaderboard system initialized.");
}

/**
 * Updates the leaderboard display with current player data.
 * @param {object} players - An object containing all player data, keyed by player ID.
 * @param {string} myId - The ID of the current client's player.
 * @param {string|null} topKillerId - The ID of the current top killer, or null if none.
 */
export function updateLeaderboard(players, myId, topKillerId) {
    if (!leaderboardList) {
        console.warn("Leaderboard list element not found, cannot update leaderboard.");
        return;
    }

    // Convert players object to an array, filter out dead players, and sort by gold
    const sortedPlayers = Object.values(players)
        .filter(player => !player.isDead) // Only show living players
        .sort((a, b) => (b.inventory.gold || 0) - (a.inventory.gold || 0)); // Sort by gold (descending)

    // Clear existing list items
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
        
        // Highlight current player
        if (player.id === myId) {
            nameSpan.style.fontWeight = 'bold';
            nameSpan.style.color = 'white';
        } else {
            nameSpan.style.color = '#AAAAAA';
        }

        // NEW: Add skull image if this player is the top killer and has kills
        // Ensure the skull is only shown if the top killer actually has kills.
        if (topKillerId && player.id === topKillerId && (player.inventory.kills || 0) > 0) {
            const skullImg = document.createElement('img');
            skullImg.src = 'assets/Skull.webp';
            skullImg.alt = 'Top Killer';
            skullImg.classList.add('skull-icon'); // Add a class for CSS styling
            // Prepend the skull image to the name span, or append to listItem directly
            // Appending to listItem directly gives more control over layout with flexbox
            listItem.appendChild(skullImg); 
        }

        listItem.appendChild(rankSpan);
        listItem.appendChild(nameSpan);
        
        const goldSpan = document.createElement('span');
        goldSpan.classList.add('gold');
        goldSpan.textContent = Math.floor(player.inventory.gold || 0);
        listItem.appendChild(goldSpan);

        leaderboardList.appendChild(listItem);
    }
}
