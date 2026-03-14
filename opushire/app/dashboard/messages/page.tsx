"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { freeapi } from '@/lib/api';
import { Loader2, Send, Search, User } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface ChatMessage {
    _id: string;
    content: string;
    createdAt: string;
    sender: { email?: string; username?: string };
}

interface ChatParticipant {
    email?: string;
    username?: string;
    avatar?: { url?: string };
}

interface ChatSession {
    _id: string;
    participants?: ChatParticipant[];
    lastMessage?: ChatMessage;
}

export default function MessagesDashboard() {
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadChats();
    }, []);

    useEffect(() => {
        if (selectedChat) {
            loadMessages(selectedChat._id);
        }
    }, [selectedChat]);

    useEffect(() => {
        // Auto-scroll to bottom of messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadChats = async () => {
        try {
            setLoadingChats(true);
            const res = await freeapi.chat.getAllChats();
            if (res.success) {
                setChats((res.data.chats as unknown as ChatSession[]) || []);
            }
        } catch (err) {
            console.error('Failed to load chats', err);
        } finally {
            setLoadingChats(false);
        }
    };

    const loadMessages = async (chatId: string) => {
        try {
            setLoadingMessages(true);
            const res = await freeapi.chat.getMessages(chatId);
            if (res.success) {
                // FreeAPI typically returns messages in descending order (newest first).
                // We want to display oldest top, newest bottom.
                setMessages((res.data.messages.reverse() as unknown as ChatMessage[]) || []);
            }
        } catch (err) {
            console.error('Failed to load messages', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || sending) return;

        const text = newMessage.trim();
        setNewMessage('');

        try {
            setSending(true);
            const res = await freeapi.chat.sendMessage(selectedChat._id, text);
            if (res.success) {
                setMessages(prev => [...prev, res.data.message as unknown as ChatMessage]);
                // Also update the latest message in the sidebar
                setChats(prev => prev.map(c =>
                    c._id === selectedChat._id ? { ...c, lastMessage: res.data.message as unknown as ChatMessage } : c
                ));
            }
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setSending(false);
        }
    };

    const getChatPartner = (chat: ChatSession): ChatParticipant | null => {
        if (!chat.participants) return null;
        return chat.participants.find((p) => p.email !== user?.email) || chat.participants[0];
    };

    return (
        <ProtectedRoute>
            <main className="pt-28 pb-10 px-6 h-screen flex flex-col">
                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col xl:flex-row gap-6 h-full min-h-0">

                    {/* Sidebar */}
                    <div className="w-full xl:w-96 flex flex-col gap-4">
                        <h1 className="text-3xl font-black text-brand-text mb-2">Messages</h1>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 transition-all"
                            />
                        </div>

                        <div className="flex-1 glass-card overflow-y-auto overflow-x-hidden border-white/10 rounded-2xl">
                            {loadingChats ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-white/30" />
                                </div>
                            ) : chats.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/40">
                                    <User className="w-12 h-12 mb-4 opacity-20" />
                                    <p>No active conversations yet.</p>
                                    <p className="text-sm mt-2 opacity-60">Chats will appear here when you message other users on the platform.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {chats.map(chat => {
                                        const partner = getChatPartner(chat);
                                        const isSelected = selectedChat?._id === chat._id;
                                        return (
                                            <button
                                                key={chat._id}
                                                onClick={() => setSelectedChat(chat)}
                                                className={`flex items-start gap-4 p-5 border-b border-white/5 transition-colors text-left
                                                    ${isSelected ? 'bg-brand-cyan/10 border-l-2 border-l-brand-cyan' : 'hover:bg-white/5 border-l-2 border-l-transparent'}
                                                `}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                                                    {partner?.avatar?.url ? (
                                                        <img src={partner.avatar.url} alt={partner.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-white/50">{partner?.username?.charAt(0).toUpperCase() || '?'}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <h3 className="font-bold text-white truncate pr-2">{partner?.username || 'Unknown User'}</h3>
                                                        <span className="text-xs text-white/40 shrink-0">
                                                            {chat.lastMessage ? timeAgo(chat.lastMessage.createdAt) : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-white/60 truncate">
                                                        {chat.lastMessage?.content || 'No messages yet...'}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className="flex-1 glass-card border-white/10 rounded-2xl flex flex-col overflow-hidden">
                        {!selectedChat ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                                <MessagePlaceholder />
                                <p className="mt-6 text-lg">Select a conversation to start chatting</p>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="h-20 border-b border-white/10 flex items-center px-8 bg-white/[0.02]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                            {getChatPartner(selectedChat)?.avatar?.url ? (
                                                <img src={getChatPartner(selectedChat)?.avatar?.url} alt="avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-white/50">{getChatPartner(selectedChat)?.username?.charAt(0).toUpperCase() || '?'}</span>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-bold text-white">{getChatPartner(selectedChat)?.username || 'User'}</h2>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-black/20">
                                    {loadingMessages ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-white/30" />
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, idx) => {
                                                const isMine = msg.sender.email === user?.email;
                                                return (
                                                    <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${isMine
                                                            ? 'bg-brand-cyan text-brand-dark rounded-tr-sm'
                                                            : 'bg-white/10 text-white rounded-tl-sm'
                                                            }`}>
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                            <div className={`text-[10px] mt-2 block ${isMine ? 'text-brand-dark/50' : 'text-white/40'}`}>
                                                                {timeAgo(msg.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-6 bg-white/[0.02] border-t border-white/10">
                                    <form onSubmit={handleSendMessage} className="flex gap-4">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="w-14 items-center justify-center flex rounded-xl bg-brand-cyan text-brand-dark hover:bg-brand-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </main>
        </ProtectedRoute>
    );
}

function MessagePlaceholder() {
    return (
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
            <Send className="w-10 h-10 text-white/20" />
        </div>
    );
}
