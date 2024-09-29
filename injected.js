(function() {
    // Intercept XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    function interceptXHR() {
        const xhr = new originalXHR();
        const open = xhr.open;
        const send = xhr.send;
        xhr.open = function() {
            this._url = arguments[1];
            return open.apply(this, arguments);
        };
        xhr.send = function() {
            if (this._url.includes('/_api/graphql')) {
                this.addEventListener('load', function() {
                    handleResponse(this.responseText);
                });
            }
            return send.apply(this, arguments);
        };
        return xhr;
    }
    window.XMLHttpRequest = interceptXHR;
    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = function() {
        const url = arguments[0];
        if (typeof url === 'string' && url.includes('/_api/graphql')) {
            return originalFetch.apply(this, arguments).then(response => {
                response.clone().text().then(handleResponse);
                return response;
            });
        }
        return originalFetch.apply(this, arguments);
    };
    function handleResponse(responseText) {
        try {
            const response = JSON.parse(responseText);
            if (response.data) {
                if (response.data.plinkoBet) {
                    const betData = response.data.plinkoBet;
                    window.postMessage({ type: 'PLINKO_BET_DATA', data: betData }, '*');
                } else if (response.data.kenoBet) {
                    const betData = response.data.kenoBet;
                    window.postMessage({ type: 'KENO_BET_DATA', data: betData }, '*');
                } 
            }
        } catch (error) {
            console.error('Error parsing GraphQL response:', error);
        }
    }
    console.log('Stake Bet Analyzer: GraphQL interception initialized');
})();