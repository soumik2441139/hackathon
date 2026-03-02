import { freeApiClient } from './freeapi.client';

export class FreeApiChatService {
    /**
     * Gets all chats for a given user's FreeAPI session.
     */
    public static async getAllChats(userToken: string): Promise<any[]> {
        const res = await freeApiClient.get('/chat-app/chats', {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
        return res.data.data;
    }

    /**
     * Creates or gets a 1-on-1 chat between the requesting user and the specific receiver.
     */
    public static async createOrGetChat(userToken: string, receiverFreeApiId: string): Promise<any> {
        const res = await freeApiClient.post(`/chat-app/chats/c/${receiverFreeApiId}`, {}, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
        return res.data.data;
    }

    /**
     * Gets messages for a specific chat.
     */
    public static async getChatMessages(userToken: string, chatId: string): Promise<any[]> {
        const res = await freeApiClient.get(`/chat-app/messages/${chatId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
        return res.data.data;
    }

    /**
     * Sends a text message to a specific chat.
     */
    public static async sendMessage(userToken: string, chatId: string, content: string): Promise<any> {
        // According to FreeAPI docs, this endpoint expects multipart/form-data or json
        // We will send JSON for text-only messages
        const res = await freeApiClient.post(`/chat-app/messages/${chatId}`, {
            content
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
        return res.data.data;
    }
}
