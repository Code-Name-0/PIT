/**
 * WebSocket Client for Real-Time Post-it Sync
 * 
 * Handles:
 * - Connection to WebSocket server
 * - Auto-reconnect with exponential backoff
 * - Message handling for post-created, post-updated, post-deleted
 * - DOM updates via callbacks
 */

class PostItWebSocketClient {
    constructor(options = {}) {
        this.url = options.url || this.getWebSocketURL();
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000; // Start at 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds

        // Callbacks for message handling
        this.callbacks = {
            'post-created': options.onPostCreated || (() => { }),
            'post-updated': options.onPostUpdated || (() => { }),
            'post-deleted': options.onPostDeleted || (() => { })
        };

        // Start connection
        this.connect();
    }

    /**
     * Determine WebSocket URL from current location
     */
    getWebSocketURL() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws`;
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        try {
            console.log(`[WSClient] Connecting to ${this.url}`);

            // Create WebSocket with proper options to include credentials
            // Note: WebSocket doesn't support custom headers or credentials in the same way
            // as fetch, but the browser will automatically send cookies for wss:// on same origin
            this.ws = new WebSocket(this.url);

            // For debugging - show what's being connected to
            console.log('[WSClient] WebSocket URL:', this.url);
            console.log('[WSClient] Current origin:', window.location.origin);

            this.ws.onopen = () => this.onOpen();
            this.ws.onmessage = (event) => this.onMessage(event);
            this.ws.onclose = () => this.onClose();
            this.ws.onerror = (error) => this.onError(error);
        } catch (error) {
            console.error('[WSClient] Connection error:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Handle connection open
     */
    onOpen() {
        console.log('[WSClient] Connected to server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Optional: send initial ping
        this.ping();
    }

    /**
     * Handle incoming message
     */
    onMessage(event) {
        try {
            const message = JSON.parse(event.data);

            console.log(`[WSClient] Received: ${message.type}`, message.data);

            // Route to appropriate handler
            if (message.type === 'pong') {
                console.log('[WSClient] Pong received');
                return;
            }

            if (this.callbacks[message.type]) {
                this.callbacks[message.type](message.data);
            }
        } catch (error) {
            console.error('[WSClient] Error processing message:', error);
        }
    }

    /**
     * Handle connection close
     */
    onClose() {
        console.log('[WSClient] Disconnected from server');
        this.isConnected = false;
        this.scheduleReconnect();
    }

    /**
     * Handle connection error
     */
    onError(error) {
        console.error('[WSClient] WebSocket error:', error);
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[WSClient] Max reconnection attempts reached');
            return;
        }

        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            this.maxReconnectDelay
        );

        this.reconnectAttempts++;
        console.log(`[WSClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => this.connect(), delay);
    }

    /**
     * Send ping to server (heartbeat)
     */
    ping() {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
        }
    }

    /**
     * Gracefully disconnect
     */
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client closing');
        }
    }
}

// Global instance for board.js to use
let wsClient;
