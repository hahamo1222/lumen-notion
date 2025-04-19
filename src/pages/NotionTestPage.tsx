import React, { useState } from 'react';
import { AlertTriangle, Link, Loader2 } from 'lucide-react';

export function NotionTestPage() {
  const [notionUrl, setNotionUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const testNotionConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notion-page-content`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ notionUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setResult({
        success: true,
        message: 'Successfully connected to Notion page!',
        data,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Notion Integration</h1>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-sm font-medium text-gray-900 mb-2">Supported URL Formats:</h2>
          <div className="space-y-2 font-mono text-xs">
            <div className="bg-white p-3 rounded border border-gray-200 break-all">
              https://www.notion.so/page-title-<span className="text-blue-600 font-semibold">1c801d0b16b78052a526c21dbc3dd8d4</span>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200 break-all">
              https://workspace.notion.site/<span className="text-blue-600 font-semibold">1c801d0b16b78052a526c21dbc3dd8d4</span>
            </div>
          </div>
        </div>

        <form onSubmit={testNotionConnection} className="space-y-6">
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-start">
              {!result.success && (
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              )}
              <div>
                <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <p className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'} whitespace-pre-wrap`}>
                  {result.message}
                </p>
                {result.success && result.data && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Page Details:</h4>
                    <pre className="bg-white p-4 rounded-md border border-green-200 overflow-auto text-xs">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}