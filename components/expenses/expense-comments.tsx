"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getExpenseComments, createExpenseComment } from "@/app/actions/shared-experience";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Send } from "lucide-react";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user: { full_name: string | null };
}

export function ExpenseComments({ expenseId }: { expenseId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const loadComments = useCallback(async () => {
        setFetching(true);
        const { data } = await getExpenseComments(expenseId);
        if (data) setComments(data as Comment[]);
        setFetching(false);
    }, [expenseId]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        const result = await createExpenseComment(expenseId, newComment);
        setLoading(false);

        if (result.error) {
            alert(result.error);
        } else {
            setNewComment("");
            loadComments();
        }
    }

    return (
        <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold">Comentarios</h4>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {fetching ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sin comentarios aún.</p>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-[10px]">
                                    {(c.user?.full_name || "U")[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold">{c.user?.full_name || "Usuario"}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground">{c.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 min-h-[40px] text-sm"
                    rows={1}
                />
                <Button type="submit" size="icon" disabled={loading || !newComment.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </form>
        </div>
    );
}
