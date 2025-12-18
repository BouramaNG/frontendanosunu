import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Topic } from '../types';
import api from '../lib/api';
import { MessageSquare, AlertTriangle } from '@/lib/icons';

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sujets de Discussion</h1>
        <p className="text-gray-600 mt-2">
          Choisissez un sujet pour voir les publications ou créer la vôtre
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            to={`/topics/${topic.slug}`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${topic.color}20` }}
              >
                {topic.icon || '📝'}
              </div>
              {topic.is_sensitive && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Sensible
                </span>
              )}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition">
              {topic.name}
            </h3>

            {topic.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {topic.description}
              </p>
            )}

            <div className="flex items-center text-sm text-gray-500">
              <MessageSquare className="w-4 h-4 mr-1" />
              <span>{topic.posts_count} publication{topic.posts_count !== 1 ? 's' : ''}</span>
            </div>

            {topic.requires_moderation && (
              <div className="mt-3 text-xs text-gray-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Modération active
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
