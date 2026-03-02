"use client";

import React, { useState, useEffect } from 'react';
import { freeapi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

interface CommentData {
    _id: string;
    content: string;
    createdAt: string;
    author?: {
        username?: string;
        avatar?: { url?: string };
    };
}

export function JobComments({ jobId }: { jobId: string }) {
    const { user } = useAuth();
    const [comments, setComments] = useState<CommentData[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const loadComments = async () => {
        try {
            setLoading(true);
            const res = await freeapi.social.getComments(jobId);
            if (res.success) {
                setComments((res.data.comments as unknown as CommentData[]) || []);
            }
        } catch (err) {
            console.error("Failed to load comments", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        loadComments();
    }, [jobId, user]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting || !user) return;

        try {
            setSubmitting(true);
            await freeapi.social.addComment(jobId, newComment.trim());
            setNewComment('');
            await loadComments(); // Reload to show new comment
        } catch (err) {
            console.error("Failed to add comment", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="mt-12 glass-card p-8 text-center border-white/5">
                <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white/80 mb-2">Join the Discussion</h3>
                <p className="text-white/50 mb-6">Sign in to ask questions and see what others are saying about this role.</p>
            </div>
        );
    }

    return (
        <ScrollReveal>
            <div className="mt-16 space-y-8">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <MessageSquare className="text-brand-cyan" />
                    <h2 className="text-2xl font-bold text-brand-text">Questions & Discussion</h2>
                    <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded-full text-sm font-bold ml-2">
                        {comments.length}
                    </span>
                </div>

                <form onSubmit={handleAddComment} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {user.avatar?.startsWith('http') ? (
                            <img src={user.avatar} alt="You" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-brand-cyan font-bold">{user.name?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <div className="flex-1 relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Ask a question about this role..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 transition-all resize-none min-h-[50px] max-h-[150px]"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(e);
                                }
                            }}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className="h-12 px-6 shrink-0 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    </Button>
                </form>

                <div className="space-y-6 pt-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-white/30" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-white/40">
                            No questions yet. Be the first to start the discussion!
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment._id} className="flex gap-4 glass-card p-5 bg-white/[0.02]">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                    {comment.author?.avatar?.url ? (
                                        <img src={comment.author.avatar.url} alt={comment.author.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white/50 font-bold">{comment.author?.username?.charAt(0).toUpperCase() || '?'}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <h4 className="font-bold text-white/90">{comment.author?.username || 'User'}</h4>
                                        <span className="text-xs text-white/40">{timeAgo(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-white/70 leading-relaxed text-sm whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </ScrollReveal>
    );
}
