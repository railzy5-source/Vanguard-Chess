import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

interface PlayerSession {
  ws: WebSocket;
  roomCode: string;
  color: "white" | "black" | "spectator";
}

interface Room {
  code: string;
  white: WebSocket | null;
  black: WebSocket | null;
  spectators: WebSocket[];
  fen: string;
  history: any[];
}

const rooms = new Map<string, Room>();
const sessions = new Map<WebSocket, PlayerSession>();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  const PORT = 3000;

  // JSON parsing and static assets
  app.use(express.json());

  // API Status Route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", activeRooms: rooms.size });
  });

  // WebSocket connection handling
  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket connection established");

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);
        const { type } = data;

        if (type === "join") {
          const roomCode = (data.roomCode || "default").toUpperCase().trim();
          let room = rooms.get(roomCode);

          if (!room) {
            room = {
              code: roomCode,
              white: null,
              black: null,
              spectators: [],
              fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              history: [],
            };
            rooms.set(roomCode, room);
          }

          let assignedColor: "white" | "black" | "spectator" = "spectator";

          if (!room.white) {
            room.white = ws;
            assignedColor = "white";
          } else if (!room.black) {
            room.black = ws;
            assignedColor = "black";
          } else {
            room.spectators.push(ws);
            assignedColor = "spectator";
          }

          sessions.set(ws, { ws, roomCode, color: assignedColor });

          // Send confirmation to the joining client
          ws.send(JSON.stringify({
            type: "joined",
            roomCode,
            color: assignedColor,
            fen: room.fen,
            history: room.history,
            hasOpponent: !!(room.white && room.black)
          }));

          // Notify existing players in the room
          const notifyMessage = JSON.stringify({
            type: "room_update",
            hasOpponent: !!(room.white && room.black),
            playerJoined: assignedColor,
          });

          if (room.white && room.white !== ws) room.white.send(notifyMessage);
          if (room.black && room.black !== ws) room.black.send(notifyMessage);
          room.spectators.forEach(spec => {
            if (spec !== ws) spec.send(notifyMessage);
          });

        } else if (type === "move") {
          const session = sessions.get(ws);
          if (!session) return;

          const room = rooms.get(session.roomCode);
          if (!room) return;

          // Store current FEN and history on the server
          room.fen = data.fen || room.fen;
          if (data.move) {
            room.history.push(data.move);
          }

          // Broadcast the move to the other player and spectators
          const broadcastMsg = JSON.stringify({
            type: "move",
            move: data.move,
            fen: room.fen,
            senderColor: session.color,
          });

          if (room.white && room.white !== ws) room.white.send(broadcastMsg);
          if (room.black && room.black !== ws) room.black.send(broadcastMsg);
          room.spectators.forEach(spec => {
            if (spec !== ws) spec.send(broadcastMsg);
          });

        } else if (type === "reset") {
          const session = sessions.get(ws);
          if (!session) return;

          const room = rooms.get(session.roomCode);
          if (!room) return;

          room.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
          room.history = [];

          const broadcastMsg = JSON.stringify({
            type: "reset",
            fen: room.fen,
          });

          if (room.white) room.white.send(broadcastMsg);
          if (room.black) room.black.send(broadcastMsg);
          room.spectators.forEach(spec => spec.send(broadcastMsg));
        }

      } catch (err) {
        console.error("Error processing websocket message:", err);
      }
    });

    ws.on("close", () => {
      const session = sessions.get(ws);
      if (session) {
        const { roomCode, color } = session;
        const room = rooms.get(roomCode);
        if (room) {
          if (color === "white") {
            room.white = null;
          } else if (color === "black") {
            room.black = null;
          } else {
            room.spectators = room.spectators.filter(s => s !== ws);
          }

          // If the room is completely empty, delete it
          if (!room.white && !room.black && room.spectators.length === 0) {
            rooms.delete(roomCode);
          } else {
            // Notify remaining players
            const notifyMessage = JSON.stringify({
              type: "room_update",
              hasOpponent: !!(room.white && room.black),
              playerLeft: color,
            });

            if (room.white) room.white.send(notifyMessage);
            if (room.black) room.black.send(notifyMessage);
            room.spectators.forEach(spec => spec.send(notifyMessage));
          }
        }
        sessions.delete(ws);
      }
      console.log("WebSocket connection closed");
    });
  });

  // Upgrade HTTP connections to WebSocket
  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  // Vite middleware for development or Static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 as required by the container environment
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Vanguard Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
