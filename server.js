const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

// Map: player ID → WebSocket
const players = new Map();
let nextId = 1;

wss.on('connection', (ws) => {
  const playerId = String(nextId++);
  players.set(playerId, ws);
  console.log(`Player ${playerId} connected. Total: ${players.size}`);

  // Welcome the new player with their ID
  ws.send(JSON.stringify({ type: 'welcome', id: playerId }));

  // Notify others that a new player joined
  broadcast({ type: 'playerJoined', id: playerId }, playerId);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      return;
    }
    // Attach sender ID
    msg.from = playerId;
    // Relay to all other players
    broadcast(msg, playerId);
  });

  ws.on('close', () => {
    players.delete(playerId);
    console.log(`Player ${playerId} left. Total: ${players.size}`);
    broadcast({ type: 'playerLeft', id: playerId }, playerId);
  });
});

function broadcast(message, excludeId) {
  for (const [id, client] of players.entries()) {
    if (id !== excludeId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

console.log(`Relay server running on port ${PORT}`);
