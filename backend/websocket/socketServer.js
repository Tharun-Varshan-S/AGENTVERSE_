const WebSocket = require('ws');

let wss = null;
const clients = new Set();

/**
 * Initialize WebSocket Server attached to Express HTTP Server.
 */
function initWebSocketServer(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  console.log('[WebSocket] WebSocket Server initialized on path /ws');

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.subscriptions = new Set();
    clients.add(ws);

    console.log(`[WebSocket] Client connected (Total active: ${clients.size})`);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message);
        const { action, incident_id } = payload;

        if (action === 'subscribe_incident' && incident_id) {
          ws.subscriptions.add(`incident:${incident_id}`);
          console.log(`[WebSocket] Client subscribed to incident '${incident_id}'`);
          ws.send(JSON.stringify({ event: 'subscribed', incident_id }));
        } else if (action === 'subscribe_admin') {
          ws.subscriptions.add('admin');
          console.log(`[WebSocket] Client subscribed to admin channel`);
          ws.send(JSON.stringify({ event: 'subscribed', channel: 'admin' }));
        } else if (action === 'subscribe_workflow' && payload.workflow_id) {
          const { workflow_id, since_seq } = payload;
          ws.subscriptions.add(`workflow:${workflow_id}`);
          console.log(`[WebSocket] Client subscribed to workflow '${workflow_id}'`);
          ws.send(JSON.stringify({ event: 'subscribed', workflow_id }));
          
          // Fetch and send replay batch
          const WorkflowEvent = require('../models/WorkflowEvent');
          const query = { workflow_id };
          if (since_seq !== undefined) {
             query.seq = { $gt: since_seq };
          }
          WorkflowEvent.find(query).sort({ seq: 1 }).then(events => {
             ws.send(JSON.stringify({ event: 'replay_batch', workflow_id, data: events }));
          }).catch(err => {
             console.error(`[WebSocket] Failed to replay workflow events: ${err.message}`);
          });
        } else if (action === 'ping') {
          ws.send(JSON.stringify({ event: 'pong' }));
        }
      } catch (err) {
        console.error(`[WebSocket] Failed to parse message: ${err.message}`);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected (Total active: ${clients.size})`);
    });

    ws.on('error', (err) => {
      console.warn(`[WebSocket Error] ${err.message}`);
    });

    // Send connection ACK
    ws.send(JSON.stringify({ event: 'connected', timestamp: new Date().toISOString() }));
  });

  // Heartbeat ping interval to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

/**
 * Broadcast event to all clients or specific subscriptions.
 */
function broadcastEvent(event, data, targetIncidentId = null, targetWorkflowId = null) {
  if (!wss) return;

  const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const isSubscribedToIncident = targetIncidentId && client.subscriptions.has(`incident:${targetIncidentId}`);
      const isSubscribedToAdmin = client.subscriptions.has('admin');
      const isSubscribedToWorkflow = targetWorkflowId && client.subscriptions.has(`workflow:${targetWorkflowId}`);

      // Send if broadcast to all, or client is subscribed to this incident or admin channel or workflow
      if ((!targetIncidentId && !targetWorkflowId) || isSubscribedToIncident || isSubscribedToAdmin || isSubscribedToWorkflow) {
        client.send(payload);
      }
    }
  });
}

module.exports = {
  initWebSocketServer,
  broadcastEvent
};
