'use client';

import { useState } from 'react';

export default function Postmortem({ incidentId }: { incidentId: string }) {
  const [postmortem, setPostmortem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/postmortem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: incidentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to generate postmortem');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setPostmortem(data.postmortem);
      setLoading(false);
    } catch (err) {
      setError('Failed to generate postmortem');
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      {!postmortem && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: '10px 20px', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: 6, border: 'none',
            backgroundColor: '#7c3aed', color: 'white',
          }}
        >
          {loading ? 'Generating Postmortem...' : 'Generate AI Postmortem'}
        </button>
      )}

      {error && (
        <p style={{ color: '#dc2626', fontSize: 14, marginTop: 8 }}>{error}</p>
      )}

      {postmortem && (
        <div style={{
          marginTop: 12, padding: 20, borderRadius: 8,
          backgroundColor: '#f5f3ff', border: '1px solid #c4b5fd',
        }}>
          <h3 style={{ fontSize: 16, marginBottom: 12, color: '#7c3aed' }}>
            AI Postmortem Analysis
          </h3>
          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {postmortem}
          </div>
        </div>
      )}
    </div>
  );
}