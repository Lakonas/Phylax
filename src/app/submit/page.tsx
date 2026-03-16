'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { authFetch } from '@/lib/api';

/**
 * Submit page — incident creation form with AI severity suggestion
 * Client component — uses useState for form fields and authFetch for API calls
 * AI suggest button sends title/description to Claude for severity recommendation
 * User can accept or override the suggestion before submitting
 */
export default function SubmitPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [severity, setSeverity] = useState('P4');
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<{ severity: string; reason: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSuggest = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Enter a title and description first');
      return;
    }

    setAiLoading(true);
    setError('');

    try {
      const response = await authFetch('/api/ai/suggest-severity', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        setError('AI suggestion failed');
        setAiLoading(false);
        return;
      }

      const suggestion = await response.json();
      setAiSuggestion(suggestion);
      setSeverity(suggestion.severity);
      setAiLoading(false);
    } catch (err) {
      setError('Failed to get AI suggestion');
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authFetch('/api/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Something went wrong');
        return;
      }

      const incident = await response.json();
      setTicketNumber(incident.ticket_number);
      setSubmitted(true);

    } catch (err) {
      setError('Failed to submit incident');
    }
  };

  // Success state — shows ticket number after submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-10 shadow-sm">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Incident Submitted</h1>
            <p className="text-gray-600 mb-1">Your ticket number is</p>
            <p className="text-2xl font-mono font-bold text-blue-600 mb-8">{ticketNumber}</p>
            <button
              onClick={() => {
                setSubmitted(false);
                setTitle('');
                setDescription('');
                setCategory('Other');
                setSeverity('P4');
                setAiSuggestion(null);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-lg mx-auto px-6 py-10">

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Report an Incident</h1>

        {/* Form card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? What's the impact?"
                required
                rows={5}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Application">Application</option>
                <option value="Network">Network</option>
                <option value="Security">Security</option>
                <option value="Access">Access</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Severity with AI suggestion — the key differentiator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <div className="flex gap-2 items-center">
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="P1">P1 — Critical</option>
                  <option value="P2">P2 — High</option>
                  <option value="P3">P3 — Medium</option>
                  <option value="P4">P4 — Low</option>
                </select>
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={aiLoading}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-md transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? 'Analyzing...' : 'AI Suggest'}
                </button>
              </div>

              {/* AI suggestion result — purple theme to distinguish from standard UI */}
              {aiSuggestion && (
                <div className="mt-2 p-3 rounded-lg bg-violet-50 border border-violet-200">
                  <div className="text-sm font-semibold text-violet-700 mb-1">
                    AI Suggested: {aiSuggestion.severity}
                  </div>
                  <p className="text-xs text-gray-600 m-0">
                    {aiSuggestion.reason}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {/* Submit — primary action, full width for emphasis */}
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors"
            >
              Submit Incident
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}