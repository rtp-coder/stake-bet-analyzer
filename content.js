function interceptResponse(response) {
    const originalJson = response.json;
    response.json = function() {
        return originalJson.apply(this, arguments).then(data => {
            if (data && data.data) {
                if (data.data.plinkoBet) {
                    chrome.runtime.sendMessage({
                        type: 'PLINKO_BET_DATA',
                        data: data.data.plinkoBet
                    });
                } else if (data.data.kenoBet) {
                    chrome.runtime.sendMessage({
                        type: 'KENO_BET_DATA',
                        data: data.data.kenoBet
                    });
                }
            }
            return data;
        });
    };
    return response;
}
// Intercept fetch requests
const originalFetch = window.fetch;
window.fetch = function(input, init) {
    return originalFetch.apply(this, arguments).then(interceptResponse);
};
// Intercept XMLHttpRequests
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function() {
    this.addEventListener('load', function() {
        if (this.responseURL.includes('/_api/graphql')) {
            try {
                const responseData = JSON.parse(this.responseText);
                if (responseData.data) {
                    if (responseData.data.plinkoBet) {
                        chrome.runtime.sendMessage({
                            type: 'PLINKO_BET_DATA',
                            data: responseData.data.plinkoBet
                        });
                    } else if (responseData.data.kenoBet) {
                        chrome.runtime.sendMessage({
                            type: 'KENO_BET_DATA',
                            data: responseData.data.kenoBet
                        });
                    }
                }
            } catch (error) {
                console.error('Error parsing XHR response:', error);
            }
        }
    });
    originalXHROpen.apply(this, arguments);
};
console.log('Content script setup complete');