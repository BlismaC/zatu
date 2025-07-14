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
 */
export function updateLeaderboard(players, myId) {
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
        // Rank will now be white by default from index.html CSS

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('name');
        nameSpan.textContent = (player.name || "Unnamed");
        nameSpan.appendChild(skullIcon);
        
        if (player.id === myId) {
            nameSpan.style.fontWeight = 'bold';
            nameSpan.style.color = 'white'; // Set own player name to white
        } else {
            nameSpan.style.color = '#AAAAAA'; // Set other player names to gray
        }

        const goldSpan = document.createElement('span');
        goldSpan.classList.add('gold');
        goldSpan.textContent = Math.floor(player.inventory.gold || 0);
        // Gold count will now be white by default from index.html CSS

        listItem.appendChild(rankSpan);
        listItem.appendChild(nameSpan);
        listItem.appendChild(goldSpan);

        leaderboardList.appendChild(listItem);
    }
}
