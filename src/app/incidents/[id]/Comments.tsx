'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  author: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export default function Comments({ incidentId }: { incidentId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [incidentId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/incidents/${incidentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'Demo User',
          body: newComment,
          is_internal: isInternal,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to post comment');
        setLoading(false);
        return;
      }

      setNewComment('');
      setIsInternal(false);
      setLoading(false);
      fetchComments();
    } catch (err) {
      setError('Failed to post comment');
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>
        Comments ({comments.length})
      </h3>

      {/* Comment List */}
      {comments.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>No comments yet.</p>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: 12, marginBottom: 8, borderRadius: 8,
                backgroundColor: comment.is_internal ? '#fef3c7' : '#f9fafb',
                border: `1px solid ${comment.is_internal ? '#fcd34d' : '#e5e7eb'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {comment.author}
                  {comment.is_internal && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#b45309', fontWeight: 400 }}>
                      Internal Note
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>
                {comment.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* New Comment Form */}
      <div style={{
        padding: 12, borderRadius: 8,
        border: '1px solid #e5e7eb',
      }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          style={{ width: '100%', padding: 10, fontSize: 14, marginBottom: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            Internal note (visible to agents only)
          </label>
          <button
            onClick={handleSubmit}
            disabled={loading || !newComment.trim()}
            style={{
              padding: '8px 16px', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: 6, border: 'none',
              backgroundColor: '#2563eb', color: 'white',
            }}
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
        {error && (
          <p style={{ color: '#dc2626', fontSize: 14, marginTop: 8 }}>{error}</p>
        )}
      </div>
    </div>
  );
}