import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Enterprise Real-Time Event Streaming
 * Broadcasts background Job/Bot progress directly to the React Next.js Dashboard
 * preventing the need for heavy HTTP polling loops.
 */
export class WebSocketService {
    private static io: Server | null = null;

    static init(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: env.FRONTEND_URL,
                methods: ['GET', 'POST'],
                credentials: true,
            }
        });

        this.io.on('connection', (socket: Socket) => {
            logger.info({ scope: 'WebSocket', socketId: socket.id }, 'New React Client Connected to Real-time Stream');

            // Admins can join dedicated log channels
            socket.on('join_channel', (channel: string) => {
                socket.join(channel);
                logger.info({ scope: 'WebSocket', socketId: socket.id }, `Client joined channel: ${channel}`);
            });

            socket.on('disconnect', () => {
                logger.debug({ scope: 'WebSocket', socketId: socket.id }, 'React Client Disconnected');
            });
        });
    }

    /**
     * Forcefully pushes a real-time event to the connected clients.
     */
    static broadcast(event: string, payload: any, channel?: string) {
        if (!this.io) return;
        
        if (channel) {
            this.io.to(channel).emit(event, payload);
        } else {
            this.io.emit(event, payload);
        }
    }
}
