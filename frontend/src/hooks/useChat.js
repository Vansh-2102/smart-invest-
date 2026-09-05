import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi } from '../api/chatApi';

export function useChat({ skipHistory = false } = {}) {
  const [messages, setMessages]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [sending, setSending]         = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError]             = useState(null);
  const bottomRef                     = useRef(null);
  const streamTimerRef                = useRef(null);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
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
          isStreaming: false,
        }));
      setMessages(ordered);
    } catch {
      // History might be empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!skipHistory) {
      loadHistory();
    }
    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
  }, [skipHistory, loadHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = useCallback(() => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setMessages([]);
    setIsStreaming(false);
    setSending(false);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text || !text.trim()) return;

    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }

    const userMsg = {
      id:        Date.now() + '_u',
      role:      'user',
      content:   text,
      timestamp: new Date().toISOString(),
      isStreaming: false,
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
      const assistantId = Date.now() + '_a';

      // Split into words and whitespace tokens so formatting/spaces remain intact
      const tokens = aiResponse.match(/\S+|\s+/g) || [aiResponse];
      let currentIndex = 0;
      let accumulated = '';

      // Replace typing indicator with active assistant message
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true,
        },
      ]);
      setSending(false);
      setIsStreaming(true);

      // Word-by-word streaming effect (like ChatGPT / Gemini)
      streamTimerRef.current = setInterval(() => {
        if (currentIndex < tokens.length) {
          const currentToken = tokens[currentIndex];
          accumulated += currentToken;
          currentIndex++;

          // If current token is whitespace, append the next word immediately to keep natural flow
          if (/^\s+$/.test(currentToken) && currentIndex < tokens.length) {
            accumulated += tokens[currentIndex];
            currentIndex++;
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated, isStreaming: true } : m
            )
          );
        } else {
          clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated, isStreaming: false } : m
            )
          );
          setIsStreaming(false);
        }
      }, 20);

    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to send message');
      setSending(false);
      setIsStreaming(false);
    }
  }, []);

  const clearError = () => setError(null);

  return {
    messages,
    loading,
    sending,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    clearError,
    bottomRef,
  };
}

