let seedResults = {};
let allMultipliers = {};
let betsSinceMultiplier = {};
let lastOccurrenceMultiplier = {};
let lastPlayedGame = 'Plinko';
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PLINKO_BET_DATA') {
    handlePlinkoBet(message.data);
  } else if (message.type === 'KENO_BET_DATA') {
    handleKenoBet(message.data);
  } else if (message.type === 'RESET_STATS') {
    resetStats();
    sendResponse({ success: true });
    return true; 
  }
});
function handlePlinkoBet(betData) {
  const seed = betData.seed || 'unknown';
  if (!seedResults[seed]) {
    seedResults[seed] = [];
    allMultipliers[seed] = {};
    betsSinceMultiplier[seed] = {};
    lastOccurrenceMultiplier[seed] = {};
  }
  seedResults[seed].unshift(betData);
  updateAllMultipliers(seed, betData.payoutMultiplier);
  lastPlayedGame = 'Plinko';
  saveToStorage();
}
function handleKenoBet(betData) {
  const seed = betData.seed || 'unknown';
  if (!kenoResults[seed]) {
    kenoResults[seed] = [];
  }
  kenoResults[seed].unshift(betData);
  lastPlayedGame = 'Keno';
  saveToStorage();
}
function updateAllMultipliers(seed, multiplier) {
  allMultipliers[seed][multiplier] = (allMultipliers[seed][multiplier] || 0) + 1;
  // Update lastOccurrenceMultiplier before resetting betsSinceMultiplier
  if (betsSinceMultiplier[seed][multiplier] !== undefined) {
    lastOccurrenceMultiplier[seed][multiplier] = betsSinceMultiplier[seed][multiplier];
  }
  // Reset betsSinceMultiplier for the current multiplier
  betsSinceMultiplier[seed][multiplier] = 0;
  // Increment betsSinceMultiplier for all other multipliers
  Object.keys(betsSinceMultiplier[seed]).forEach(m => {
    if (m !== multiplier.toString()) {
      betsSinceMultiplier[seed][m]++;
    }
  });
}
function saveToStorage() {
  chrome.storage.local.set({ 
    seedResults: seedResults, 
    allMultipliers: allMultipliers,
    betsSinceMultiplier: betsSinceMultiplier,
    lastOccurrenceMultiplier: lastOccurrenceMultiplier,
    kenoResults: kenoResults,
    lastPlayedGame: lastPlayedGame
  }, () => {
    console.log('Data saved to storage');
  });
}
function resetStats() {
  console.log('Resetting all stats');
  seedResults = {};
  allMultipliers = {};
  betsSinceMultiplier = {};
  lastOccurrenceMultiplier = {};
  kenoResults = {};
  lastPlayedGame = 'Plinko';
  chrome.storage.local.set({ 
    seedResults: seedResults, 
    allMultipliers: allMultipliers,
    betsSinceMultiplier: betsSinceMultiplier,
    lastOccurrenceMultiplier: lastOccurrenceMultiplier,
    kenoResults: kenoResults,
    lastPlayedGame: lastPlayedGame
  }, () => {
    console.log('Stats reset and saved to storage');
  });
}
// Initialize data from storage
chrome.storage.local.get(['seedResults', 'allMultipliers', 'betsSinceMultiplier', 'lastOccurrenceMultiplier', 'kenoResults'], (result) => {
  seedResults = result.seedResults || {};
  allMultipliers = result.allMultipliers || {};
  betsSinceMultiplier = result.betsSinceMultiplier || {};
  lastOccurrenceMultiplier = result.lastOccurrenceMultiplier || {};
  kenoResults = result.kenoResults || {};
  console.log('Data initialized from storage');
});
console.log('Stake Bet Analyzer: Service worker setup complete');