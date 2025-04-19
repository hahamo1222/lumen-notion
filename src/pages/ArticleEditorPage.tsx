import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Link, Loader2, Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function ArticleEditorPage() {
  const navigate = useNavigate();
  const [notionUrl, setNotionUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [functionStatus, setFunctionStatus] = useState<'checking' | 'available' | 'error' | 'missing-key'>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    async function checkFunctionStatus() {
      try {
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notion-page-content`;
        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'ok') {
          setFunctionStatus('available');
        } else if (data.message?.includes('Notion API key is missing')) {
          setFunctionStatus('missing-key');
          setStatusMessage('Notion API key is not configured. Please contact the administrator.');
        } else {
          setFunctionStatus('error');
          setStatusMessage(data.message || 'Function is not working properly');
        }
      } catch (err) {
        console.error('Function check error:', err);
        setFunctionStatus('error');
        setStatusMessage('Could not connect to the Edge Function');
      }
    }

    checkFunctionStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notion-page-content`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          notionUrl,
          timestamp: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.title || !data.summary || !data.content) {
        throw new Error('Invalid response from Notion: Missing required fields');
      }

      const { error: insertError } = await supabase
        .from('topics')
        .insert([
          {
            title: data.title,
            summary: data.summary,
            content: data.content,
            category: data.category || 'Uncategorized',
            region: data.region || 'Global',
            image_url: data.imageUrl,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      navigate('/admin');
    } catch (err) {
      console.error('Article creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create article. Please check your Notion URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Article</h1>
        
        {/* Status indicators */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-medium">Edge Function Status:</span>
            {functionStatus === 'checking' ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : functionStatus === 'available' ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Available
              </div>
            ) : functionStatus === 'missing-key' ? (
              <div className="flex items-center text-yellow-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Configuration Required
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                Unavailable
              </div>
            )}
            {statusMessage && (
              <span className="text-gray-600 ml-2">{statusMessage}</span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <span className="font-medium">Environment Variables:</span>
            {import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Configured
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                Missing
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg whitespace-pre-wrap">
            {error}
          </div>
        )}

        {functionStatus === 'missing-key' && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium mb-1">Notion API Key Required</p>
              <p>The Edge Function requires a Notion API key to be configured. Please follow these steps:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Create a new integration at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-800">Notion Integrations</a></li>
                <li>Copy the integration secret token</li>
                <li>Add the token as NOTION_API_KEY in your Supabase project settings under Edge Functions</li>
              </ol>
            </div>
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Before you begin:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a new integration at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">Notion Integrations</a></li>
              <li>Copy the integration secret token</li>
              <li>Share your Notion page with the integration</li>
              <li>Make sure the page has proper formatting:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Title at the top</li>
                  <li>Summary in the first paragraph</li>
                  <li>Category and Region as separate lines (e.g., "Category: Technology")</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-sm font-medium text-gray-900 mb-2">Supported URL Formats:</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Both URL formats are supported:</p>
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-white p-3 rounded border border-gray-200 break-all">
                https://www.notion.so/page-title-<span className="text-blue-600 font-semibold">1c801d0b16b78052a526c21dbc3dd8d4</span>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200 break-all">
                https://workspace.notion.site/<span className="text-blue-600 font-semibold">1c801d0b16b78052a526c21dbc3dd8d4</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">The important part is the 32-character page ID (highlighted in blue above). Make sure this ID is present in your URL.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="notionUrl" className="block text-sm font-medium text-gray-700">
              Notion Page URL
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="notionUrl"
                value={notionUrl}
                onChange={(e) => setNotionUrl(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                placeholder="https://www.notion.so/your-page-32-character-id"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Paste the URL of your Notion page containing the article content. Make sure you've shared the page with your integration.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || functionStatus !== 'available'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Article'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}