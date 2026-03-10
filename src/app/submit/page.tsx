'use client';

import { useState } from 'react';

export default function SubmitPage() {
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
      const response = await fetch('/api/ai/suggest-severity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          reported_by: 'Demo User',
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

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: 24 }}>
        <h1>Incident Submitted</h1>
        <p style={{ fontSize: 18, marginTop: 16 }}>
          Your ticket number is <strong>{ticketNumber}</strong>
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setTitle('');
            setDescription('');
            setCategory('Other');
            setSeverity('P4');
            setAiSuggestion(null);
          }}
          style={{ marginTop: 24, padding: '10px 20px', cursor: 'pointer' }}
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 24 }}>
      <h1>Report an Incident</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of the issue"
            required
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened? What's the impact?"
            required
            rows={5}
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          >
            <option value="Infrastructure">Infrastructure</option>
            <option value="Application">Application</option>
            <option value="Network">Network</option>
            <option value="Security">Security</option>
            <option value="Access">Access</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* AI Severity Suggestion — Story #2 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Severity
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={{ flex: 1, padding: 10, fontSize: 16 }}
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
              style={{
                padding: '10px 16px', fontSize: 14, fontWeight: 600,
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                borderRadius: 6, border: 'none',
                backgroundColor: '#7c3aed', color: 'white',
                whiteSpace: 'nowrap',
              }}
            >
              {aiLoading ? 'Analyzing...' : 'AI Suggest'}
            </button>
          </div>

          {aiSuggestion && (
            <div style={{
              marginTop: 8, padding: 12, borderRadius: 8,
              backgroundColor: '#f5f3ff', border: '1px solid #c4b5fd',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#7c3aed', marginBottom: 4 }}>
                AI Suggested: {aiSuggestion.severity}
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                {aiSuggestion.reason}
              </p>
            </div>
          )}
        </div>

        {error && (
          <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          style={{ padding: '12px 32px', fontSize: 16, cursor: 'pointer' }}
        >
          Submit Incident
        </button>
      </form>
    </div>
  );
}