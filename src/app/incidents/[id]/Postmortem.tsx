'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/api';

/**
 * Postmortem — client component for AI-generated incident analysis
 * Only rendered for Resolved/Closed incidents (parent controls visibility)
 * Sends full incident data to Claude for structured postmortem:
 * Summary, Timeline, Root Cause, Impact, Resolution, Recommendations
 */
export default function Postmortem({ incidentId }: { incidentId: string }) {
  const [postmortem, setPostmortem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await authFetch('/api/ai/postmortem', {
        method: 'POST',
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
    <div className="mb-6">
      {/* Generate button — purple theme to distinguish AI features */}
      {!postmortem && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating Postmortem...' : 'Generate AI Postmortem'}
        </button>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      {/* Postmortem result — purple card matching AI suggestion theme */}
      {postmortem && (
        <div className="mt-3 p-5 rounded-lg bg-violet-50 border border-violet-200">
          <h3 className="text-sm font-semibold text-violet-700 mb-3">
            AI Postmortem Analysis
          </h3>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {postmortem}
          </div>
        </div>
      )}
    </div>
  );
}
