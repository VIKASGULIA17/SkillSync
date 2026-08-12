import { useState } from 'react';
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';

export default function FeedbackPanel({ feedback, isLoading, error }) {
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="bg-bg-secondary border border-border rounded-md w-full animate-[slideUp_0.95s_cubic-bezier(0.22,1,0.36,1)_forwards]">
        <div className="flex items-center justify-between p-6 border-b border-border select-none">
          <h3 className="flex items-center gap-2 font-headings text-lg font-semibold text-text-primary">
            <span>🤖</span>
            AI Career Feedback
          </h3>
        </div>
        <div className="p-6">
          {Array.from({ length: 8 }).map((_, i) => {
            const widths = ["w-[90%]", "w-[75%]", "w-[85%]", "w-[60%]", "w-[80%]", "w-[45%]", "w-[70%]", "w-[55%]"];
            return (
              <div key={i} className={`h-3.5 mb-4 rounded-sm bg-bg-tertiary shimmer ${widths[i % widths.length]}`} />
            );
          })}
        </div>
      </div>
    );
  }

  if (error) {
    const isApiKeyError =
      error.toLowerCase().includes('api key') ||
      error.toLowerCase().includes('api_key') ||
      error.toLowerCase().includes('not configured') ||
      error.toLowerCase().includes('groq');

    return (
      <div className="bg-bg-secondary border border-border rounded-md w-full animate-[slideUp_0.95s_cubic-bezier(0.22,1,0.36,1)_forwards]">
        <div className="flex items-center justify-between p-6 border-b border-border select-none">
          <h3 className="flex items-center gap-2 font-headings text-lg font-semibold text-text-primary">
            <span>🤖</span>
            AI Career Feedback
          </h3>
        </div>
        <div className="p-6 text-center">
          <span className="text-3xl mb-4 block">
            {isApiKeyError ? '🔑' : '⚠️'}
          </span>
          <p className="text-sm text-text-secondary leading-relaxed">
            {isApiKeyError ? (
              <>
                API key not configured. Please{' '}
                <Link to="/profile" className="text-primary font-semibold hover:underline">configure your Groq API key</Link>{' '}
                in your profile to get AI-powered career feedback.
              </>
            ) : (
              error
            )}
          </p>
        </div>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <div className="bg-bg-secondary border border-border rounded-md w-full animate-[slideUp_0.95s_cubic-bezier(0.22,1,0.36,1)_forwards]">
      <div className="flex items-center justify-between p-6 border-b border-border cursor-pointer transition-colors duration-250 hover:bg-bg-card-hover select-none" onClick={() => setExpanded((v) => !v)}>
        <h3 className="flex items-center gap-2 font-headings text-lg font-semibold text-text-primary">
          <span>🤖</span>
          AI Career Feedback
        </h3>
        <span className={`text-lg text-text-tertiary transition-transform duration-650 line-none ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </div>
      <div className={`p-6 overflow-hidden transition-all duration-650 ${expanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 !pt-0 !pb-0 opacity-0'}`}>
        <div className="markdown-content">
          <Markdown>{feedback}</Markdown>
        </div>
      </div>
    </div>
  );
}
