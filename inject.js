console.log('Stake Bet Analyzer: Content script injected');
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
    console.log('Stake Bet Analyzer: Injected script loaded');
};
(document.head || document.documentElement).appendChild(script);
// Listen for messages from the injected script
window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data.type === 'PLINKO_BET_DATA' || event.data.type === 'KENO_BET_DATA') {
        chrome.runtime.sendMessage(event.data);
    }
});