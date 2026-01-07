import { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
}

// Simple syntax highlighting without external dependencies
function highlightCode(code: string, language: string): string {
  let highlighted = code
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (language === 'json') {
    // JSON: strings, numbers, booleans, null, keys
    highlighted = highlighted
      .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span class="text-brand">$1</span>$2') // keys
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="text-success">$1</span>') // string values
      .replace(/:\s*(\d+)/g, ': <span class="text-warning">$1</span>') // numbers
      .replace(/:\s*(true|false|null)/g, ': <span class="text-accent">$1</span>'); // booleans/null
  } else if (language === 'javascript' || language === 'js') {
    // JavaScript: keywords, strings, comments, functions
    highlighted = highlighted
      .replace(/(\/\/.*$)/gm, '<span class="text-text-tertiary">$1</span>') // comments
      .replace(/\b(const|let|var|function|async|await|return|if|else|for|while|new|class|import|export|from|default)\b/g, '<span class="text-accent">$1</span>') // keywords
      .replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, '<span class="text-success">$1</span>') // strings
      .replace(/\b(\d+)\b/g, '<span class="text-warning">$1</span>') // numbers
      .replace(/\b([A-Z][a-zA-Z]*)\b/g, '<span class="text-brand">$1</span>') // classes/constructors
      .replace(/(\w+)(\s*\()/g, '<span class="text-info">$1</span>$2'); // function calls
  } else if (language === 'bash' || language === 'shell') {
    // Bash: Use placeholder tokens to prevent regex from matching inside spans
    const tokens: string[] = [];
    const tokenize = (match: string) => {
      tokens.push(match);
      return `__TOKEN_${tokens.length - 1}__`;
    };

    // First, tokenize strings and URLs (protect them from further processing)
    highlighted = highlighted
      .replace(/('(?:[^'\\]|\\.)*')/g, (m) => tokenize(`<span class="text-success">${m}</span>`))
      .replace(/("(?:[^"\\]|\\.)*")/g, (m) => tokenize(`<span class="text-success">${m}</span>`))
      .replace(/(https?:\/\/[^\s'"]+)/g, (m) => tokenize(`<span class="text-brand">${m}</span>`));

    // Now highlight commands and flags (won't match inside tokens)
    highlighted = highlighted
      .replace(/^(\s*)(curl|wget|npm|bun|node|git|cd|ls|mkdir|rm|cp|mv|echo|cat)/gm, '$1<span class="text-accent">$2</span>')
      .replace(/(\s)(-[a-zA-Z]+)/g, '$1<span class="text-warning">$2</span>');

    // Restore tokens
    highlighted = highlighted.replace(/__TOKEN_(\d+)__/g, (_, i) => tokens[parseInt(i)]);
  }

  return highlighted;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState('');

  useEffect(() => {
    setHighlighted(highlightCode(code, language));
  }, [code, language]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden group">
      <div className="flex items-center justify-between px-4 py-2 bg-bg-tertiary border-b border-border-subtle">
        <span className="font-mono text-xs text-text-tertiary">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 font-mono text-sm text-text-secondary overflow-x-auto">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
