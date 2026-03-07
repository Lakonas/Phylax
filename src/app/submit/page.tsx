'use client';

import { useState } from 'react';

export default function SubmitPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState('');

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
          reported_by: 'Demo User',
          severity: 'P4',
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

        <div style={{ marginBottom: 24 }}>
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