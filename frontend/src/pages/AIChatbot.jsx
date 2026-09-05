import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Bot, User, Trash2, Sparkles, AlertCircle } from 'lucide-react';
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

function parseInlineMarkdown(text) {
  if (!text) return '';
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedAssistantMessage({ content, isStreaming }) {
  if (!content && isStreaming) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        <span className="inline-block w-2 h-4 bg-emerald-400 rounded-xs animate-pulse" />
        <span className="text-xs text-gray-400">Analyzing portfolio data...</span>
      </div>
    );
  }

  const rawLines = (content || '').split('\n');
  const blocks = [];
  let currentTable = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (!currentTable) {
        currentTable = [];
      }
      currentTable.push(trimmed);
      continue;
    } else if (currentTable) {
      blocks.push({ type: 'table', rows: currentTable });
      currentTable = null;
    }

    blocks.push({ type: 'line', text: line, rawIndex: i });
  }

  if (currentTable) {
    blocks.push({ type: 'table', rows: currentTable });
  }

  return (
    <div className="space-y-2 text-sm leading-relaxed text-gray-200">
      {blocks.map((block, bIdx) => {
        const isLastBlock = bIdx === blocks.length - 1;

        if (block.type === 'table') {
          const validRows = block.rows.filter((r) => !/^\|[\s-:]+(\|[\s-:]+)+\|$/.test(r));
          if (validRows.length === 0) return null;

          const headerRow = validRows[0];
          const bodyRows = validRows.slice(1);

          const parseCells = (rowStr) =>
            rowStr
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim());

          const headers = parseCells(headerRow);

          return (
            <div key={bIdx} className="overflow-x-auto my-3 rounded-lg border border-gray-700/60 bg-gray-900/40">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-800/80 text-gray-300 uppercase tracking-wider font-semibold border-b border-gray-700">
                  <tr>
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-2.5">{parseInlineMarkdown(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {bodyRows.map((row, rIdx) => {
                    const cells = parseCells(row);
                    return (
                      <tr key={rIdx} className="hover:bg-gray-800/30 transition-colors">
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2 whitespace-normal">{parseInlineMarkdown(cell)}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {isLastBlock && isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-pulse rounded-xs" />
              )}
            </div>
          );
        }

        const line = block.text;
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={bIdx} className="h-1.5" />;
        }

        // H3 / H4
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={bIdx} className="text-sm font-bold text-white pt-2 pb-0.5 border-b border-gray-700/40">
              {parseInlineMarkdown(trimmed.slice(4))}
              {isLastBlock && isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-pulse rounded-xs" />
              )}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={bIdx} className="text-base font-bold text-emerald-400 pt-3 pb-1 border-b border-gray-700/60">
              {parseInlineMarkdown(trimmed.slice(3))}
              {isLastBlock && isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-pulse rounded-xs" />
              )}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={bIdx} className="text-lg font-extrabold text-white pt-3 pb-1">
              {parseInlineMarkdown(trimmed.slice(2))}
              {isLastBlock && isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-pulse rounded-xs" />
              )}
            </h2>
          );
        }

        // Bullet point
        const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <div key={bIdx} className="flex items-start gap-2 pl-1 text-gray-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
              <div className="flex-1">
                {parseInlineMarkdown(bulletMatch[1])}
                {isLastBlock && isStreaming && (
                  <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-pulse rounded-xs" />
                )}
              </div>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={bIdx} className="flex items-start gap-2 pl-1 text-gray-200">
              <span className="font-semibold text-emerald-400 text-xs mt-0.5 min-w-[16px]">
                {numMatch[1]}.
              </span>
              <div className="flex-1">
                {parseInlineMarkdown(numMatch[2])}
                {isLastBlock && isStreaming && (
                  <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-pulse rounded-xs" />
                )}
              </div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={bIdx} className="text-gray-200">
            {parseInlineMarkdown(line)}
            {isLastBlock && isStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-pulse rounded-xs" />
            )}
          </p>
        );
      })}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-emerald-500/20">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-700/50">
        <div className="flex gap-1.5 items-center h-4">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce animation-delay-0" />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce animation-delay-100" />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce animation-delay-200" />
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';

  if (msg.role === 'typing') return <TypingIndicator />;

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser
          ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-500/20'
          : 'bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 shadow-md shadow-black/20'
      }`}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot  className="w-4 h-4 text-emerald-400" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-emerald-600 text-white rounded-br-sm whitespace-pre-wrap shadow-md shadow-emerald-900/20'
            : 'bg-gray-800 text-gray-200 border border-gray-700/60 rounded-bl-sm shadow-md shadow-black/30'
        }`}>
          {isUser ? (
            msg.content
          ) : (
            <FormattedAssistantMessage content={msg.content} isStreaming={msg.isStreaming} />
          )}
        </div>
        {msg.timestamp && (
          <span className="text-[10px] text-gray-500 px-1">
            {formatDateTime(msg.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AIChatbot() {
  const location = useLocation();
  const shouldClear = Boolean(location.state?.clearChat);
  const {
    messages,
    loading,
    sending,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    clearError,
    bottomRef,
  } = useChat({ skipHistory: shouldClear });

  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const handledQueryRef = useRef(null);

  useEffect(() => {
    if (location.state?.initialQuery && location.state.initialQuery !== handledQueryRef.current) {
      handledQueryRef.current = location.state.initialQuery;
      if (location.state.clearChat) {
        clearChat();
      }
      sendMessage(location.state.initialQuery);
    }
  }, [location.state, sendMessage, clearChat]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || isStreaming) return;
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

        {/* Clear Chat button */}
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-red-500/30 rounded-lg px-3 py-1.5 transition-all"
            title="Clear current conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
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
                disabled={sending || isStreaming}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending || isStreaming}
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

