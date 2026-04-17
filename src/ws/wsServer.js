const WebSocket = require('ws');
const url = require('url');

/**
 * WebSocket Server for Real-Time Post-it Sync
 * 
 * Clients connect with: ws://localhost:3000/ws
 * Messages:
 *   - post-created: { type: 'post-created', data: { id, text, author, x, y, created_at } }
 *   - post-updated: { type: 'post-updated', data: { id, text, updated_at } }
 *   - post-deleted: { type: 'post-deleted', data: { id } }
 */

class PostItWebSocketServer {
    constructor(httpServer) {
        this.wss = new WebSocket.Server({
            noServer: true,
            maxPayload: 64 * 1024
        });

        this.clients = new Map();
        this.heartbeatInterval = null;
        this.clientCounter = 0;

        // Handle HTTP upgrade for WebSocket
        httpServer.on('upgrade', (request, socket, head) => {
            const pathname = url.parse(request.url).pathname;

            // Only upgrade requests to /ws path
            if (pathname !== '/ws') {
                socket.destroy();
                return;
            }

            // Accept all WebSocket connections (posts are public)
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.onConnection(ws, request);
            });
        });

        // Start heartbeat
        this.startHeartbeat();
    }

    /**
     * Handle new WebSocket connection
     */
    onConnection(ws, request) {
        this.clientCounter++;
        const clientId = this.clientCounter;

        console.log(`[WS] Client ${clientId} connected`);

        // Store connection in a simple set
        if (!this.clients.has('all')) {
            this.clients.set('all', new Set());
        }
        this.clients.get('all').add(ws);

        // Track client on ws object
        ws.clientId = clientId;
        ws.isAlive = true;

        // Handle messages from client
        ws.on('message', (data) => {
            this.onMessage(ws, data);
        });

        // Handle client disconnect
        ws.on('close', () => {
            this.onClose(ws);
        });

        // Handle errors
        ws.on('error', (error) => {
            console.error(`[WS] Error for client ${clientId}:`, error.message);
        });

        // Respond to ping with pong
        ws.on('pong', () => {
            ws.isAlive = true;
        });
    }

    /**
     * Handle message from client
     */
    onMessage(ws, data) {
        try {
            const message = JSON.parse(data);

            if (message.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
            }
        } catch (error) {
            console.error(`[WS] Invalid message from client ${ws.clientId}:`, error.message);
        }
    }

    /**
     * Handle client disconnect
     */
    onClose(ws) {
        const clientId = ws.clientId;
        console.log(`[WS] Client ${clientId} disconnected`);

        if (this.clients.has('all')) {
            this.clients.get('all').delete(ws);
        }
    }

    /**
     * Broadcast message to all connected clients
     */
    broadcast(message) {
        const payload = JSON.stringify(message);
        let broadcastCount = 0;

        const connections = this.clients.get('all');
        if (connections) {
            for (const ws of connections) {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(payload, (error) => {
                        if (error) {
                            console.error(`[WS] Error sending message:`, error.message);
                        }
                    });
                    broadcastCount++;
                }
            }
        }

        console.log(`[WS] Broadcast: ${message.type} to ${broadcastCount} clients`);
    }

    /**
     * Start heartbeat to detect dead connections
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const connections = this.clients.get('all');
            if (connections) {
                for (const ws of connections) {
                    if (!ws.isAlive) {
                        ws.terminate();
                        console.log(`[WS] Terminated dead connection`);
                        continue;
                    }

                    ws.isAlive = false;
                    ws.ping();
                }
            }
        }, 25000);
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }

    /**
     * Graceful shutdown
     */
    shutdown() {
        this.stopHeartbeat();

        const connections = this.clients.get('all');
        if (connections) {
            for (const ws of connections) {
                ws.close(1000, 'Server shutting down');
            }
        }

        this.clients.clear();
        this.wss.close(() => {
            console.log('[WS] WebSocket server closed');
        });
    }
}

module.exports = PostItWebSocketServer;
