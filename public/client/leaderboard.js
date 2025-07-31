let leaderboardContainer;
let leaderboardList;

export function initLeaderboard() {
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
export function updateLeaderboard(players, myId) {
    if (!leaderboardList) {
        console.warn("lLeaderboard list");
        return;
    }

    const sortedPlayers = Object.values(players)
        .filter(player => !player.isDead)
        .sort((a, b) => (b.inventory.gold || 0) - (a.inventory.gold || 0));

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
        nameSpan.textContent = (player.name || "Unnamed");
        
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
