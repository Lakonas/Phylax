'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { authFetch } from '@/lib/api';

/**
 * Comments — client component for incident discussion thread
 * Supports regular comments and internal notes (yellow background)
 * Author set from JWT token, not user input
 * Internal notes will be hidden from submitters once role filtering is added
 */

interface Comment {
  id: string;
  author: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export default function Comments({ incidentId }: { incidentId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      const response = await authFetch(`/api/incidents/${incidentId}/comments`);
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
      const response = await authFetch(`/api/incidents/${incidentId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
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
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Comments ({comments.length})
      </h3>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">No comments yet.</p>
      ) : (
        <div className="mb-4 space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border ${comment.is_internal ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-gray-700">
                  {comment.author}
                  {comment.is_internal && (
                    <span className="ml-2 text-xs font-normal text-amber-700">Internal Note</span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed m-0">
                {comment.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* New comment form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
        />
        <div className="flex justify-between items-center">
          <label className="text-xs text-gray-500 flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded"
            />
            Internal note (visible to agents only)
          </label>
          <button
            onClick={handleSubmit}
            disabled={loading || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
