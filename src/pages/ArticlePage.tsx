import React from 'react';
import { useParams } from 'react-router-dom';

export function ArticlePage() {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Coming Soon</h1>
        <p className="text-gray-600">Article ID: {id}</p>
      </div>
    </div>
  );
}