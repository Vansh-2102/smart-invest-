import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { formatDateTime } from '../utils/formatters';

const SUGGESTED = [
  "What's the best investment for a 25-year-old beginner?",
  'How should I allocate ₹5 lakhs across asset classes?',
  'Explain SIP vs lumpsum investment strategy',
  'What are the tax implications of equity mutual funds?',
  'How does inflation affect my investment returns?',
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-0" />
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-100" />
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animation-delay-200" />
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';

  if (msg.role === 'typing') return <TypingIndicator />;

  return (
    <div className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
          : 'bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600'
      }`}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot  className="w-4 h-4 text-emerald-400" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-emerald-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-200 border border-gray-700/50 rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        {msg.timestamp && (
          <span className="text-[10px] text-gray-600 px-1">
            {formatDateTime(msg.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AIChatbot() {
  const { messages, loading, sending, error, sendMessage, clearError, bottomRef } = useChat();
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    await sendMessage(text);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Investment Advisor</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">Online · Powered by AI</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Chat window */}
        <Card className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <Bot className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Ask your AI Investment Advisor</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    Get personalized investment advice, market insights, and financial planning guidance.
                  </p>
                </div>
                <div className="grid gap-2 w-full max-w-sm">
                  {SUGGESTED.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="text-left text-xs text-gray-400 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl px-4 py-2.5 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => <Message key={msg.id} msg={msg} />)
            )}
            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 pb-2">
              <ErrorAlert message={error} onDismiss={clearError} />
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-gray-800/50 p-4">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about investments, market trends, portfolio strategies..."
                rows={1}
                className="form-input resize-none flex-1 min-h-[44px] max-h-[120px]"
                style={{ scrollbarWidth: 'none' }}
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                loading={sending}
                className="!px-4 !py-3 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </Card>

        {/* Suggestions sidebar */}
        <div className="hidden xl:flex flex-col w-64 space-y-4">
          <Card>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Suggested Questions</h4>
            <div className="space-y-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="w-full text-left text-xs text-gray-400 hover:text-gray-200 bg-gray-800/30 hover:bg-gray-800/60 rounded-lg px-3 py-2.5 transition-all border border-transparent hover:border-gray-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Topics</h4>
            <div className="flex flex-wrap gap-2">
              {['Mutual Funds', 'Stocks', 'Gold', 'Crypto', 'SIP', 'Tax', 'Insurance', 'Bonds'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setInput(`Tell me about ${t}`); inputRef.current?.focus(); }}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-full px-3 py-1 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
