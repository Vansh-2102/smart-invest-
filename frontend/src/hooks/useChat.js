import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi } from '../api/chatApi';

export function useChat() {
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState(null);
  const bottomRef                 = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await chatApi.getHistory(50);
      const ordered = [...res.data]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((m) => ({
          id: m.id,
          role: m.type === 'USER' ? 'user' : 'assistant',
          content: m.content,
          timestamp: m.createdAt,
        }));
      setMessages(ordered);
    } catch {
      // History might be empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = {
      id:        Date.now() + '_u',
      role:      'user',
      content:   text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setError(null);

    // Typing indicator
    const typingId = Date.now() + '_typing';
    setMessages((prev) => [...prev, { id: typingId, role: 'typing', content: '' }]);

    try {
      const res = await chatApi.sendMessage(text);
      const aiResponse = res.data?.content ?? 'No response received';
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        { id: Date.now() + '_a', role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
      ]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, []);

  const clearError = () => setError(null);

  return { messages, loading, sending, error, sendMessage, clearError, bottomRef };
}
