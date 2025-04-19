import React from 'react';
import { ArticleCard } from '../components/ArticleCard';

const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'The Future of AI: Breaking New Grounds in Technology',
    summary: 'Artificial Intelligence continues to evolve at an unprecedented pace, reshaping industries and creating new possibilities for innovation.',
    content: '',
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    bullet_points: [],
    tags: ['Technology', 'AI'],
    voting_options: [],
    created_at: '2024-03-10T12:00:00Z'
  },
  // Add more mock articles as needed
];

export function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section>
        <ArticleCard article={MOCK_ARTICLES[0]} isHero={true} />
      </section>

      {/* Latest Articles Grid */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_ARTICLES.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}