import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  isHero?: boolean;
}

export function ArticleCard({ article, isHero = false }: ArticleCardProps) {
  return (
    <Link
      to={`/article/${article.id}`}
      className={clsx(
        'group block overflow-hidden rounded-lg bg-white shadow-md transition-transform hover:shadow-xl',
        isHero ? 'relative' : ''
      )}
    >
      <div className={clsx(
        'relative overflow-hidden',
        isHero ? 'aspect-[21/9]' : 'aspect-[16/9]'
      )}>
        <img
          src={article.image_url}
          alt={article.title}
          className="object-cover w-full h-full transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          {article.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 className={clsx(
          'font-bold text-gray-900 mb-2',
          isHero ? 'text-3xl' : 'text-xl'
        )}>
          {article.title}
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {article.summary}
        </p>
        <time className="text-sm text-gray-500">
          {format(new Date(article.created_at), 'MMM d, yyyy')}
        </time>
      </div>
    </Link>
  );
}