import { Client } from "npm:@notionhq/client@2.2.14";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  // Add a status check endpoint
  if (req.method === 'GET') {
    try {
      // Verify Notion API key is available
      const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
      const status = NOTION_API_KEY ? 'ok' : 'error';
      const message = NOTION_API_KEY 
        ? 'Edge Function is running and Notion API key is configured'
        : 'Edge Function is running but Notion API key is missing';

      return new Response(
        JSON.stringify({ status, message, timestamp: new Date().toISOString() }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          status: 'error',
          message: 'Failed to check function status',
          error: error.message,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 500
        }
      );
    }
  }

  try {
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
    if (!NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY environment variable is not configured. Please add it in your Supabase project settings under Edge Functions.');
    }

    const body = await req.json().catch(() => ({}));
    console.log('Request body:', body);

    const { notionUrl } = body;

    if (!notionUrl) {
      throw new Error('Notion URL is required');
    }

    // Extract page ID from Notion URL - support multiple formats
    let pageId;
    try {
      const urlObj = new URL(notionUrl);
      // Handle both www.notion.so and custom subdomain URLs
      const path = urlObj.pathname.split('?')[0]; // Remove query parameters
      
      // Try to find a 32-character sequence that could be the page ID
      const matches = path.match(/([a-zA-Z0-9]{32})/);
      pageId = matches?.[1];

      if (!pageId) {
        // If no direct match, try extracting from hyphenated format
        const pathParts = path.split('-');
        const possibleId = pathParts[pathParts.length - 1]?.replace(/[^a-zA-Z0-9]/g, '');
        if (possibleId?.length === 32) {
          pageId = possibleId;
        }
      }
    } catch (error) {
      throw new Error('Invalid URL format. Please provide a valid Notion page URL.');
    }

    if (!pageId || pageId.length !== 32) {
      throw new Error(
        'Could not find a valid page ID in the URL. The page ID should be a 32-character sequence in your Notion URL. ' +
        'Both formats are supported:\n' +
        '• https://www.notion.so/page-title-1c801d0b16b78052a526c21dbc3dd8d4\n' +
        '• https://your-workspace.notion.site/1c801d0b16b78052a526c21dbc3dd8d4'
      );
    }

    console.log('Extracted page ID:', pageId);

    // Initialize Notion client
    const notion = new Client({ auth: NOTION_API_KEY });

    try {
      // First, verify page access
      console.log('Verifying page access...');
      try {
        await notion.pages.retrieve({ page_id: pageId });
      } catch (error) {
        if (error.code === 'object_not_found' || error.status === 404) {
          throw new Error(
            'Could not access the Notion page. Please verify:\n\n' +
            '1. You\'ve created a Notion integration at https://www.notion.so/my-integrations\n' +
            '2. You\'ve shared the page with your integration (use the "Share" button and add the integration)\n' +
            '3. You\'ve provided the correct page URL\n' +
            '4. You\'ve waited a few minutes for sharing permissions to take effect\n' +
            '5. Your integration has the correct capabilities enabled (Read Content permission is required)'
          );
        }
        throw error;
      }
      
      // Get page blocks
      console.log('Fetching page blocks...');
      const { results: blocks } = await notion.blocks.children.list({ 
        block_id: pageId,
        page_size: 100,
      });
      console.log('Page blocks retrieved successfully');

      // Get page properties
      const page = await notion.pages.retrieve({ page_id: pageId });
      
      // Get title from either 'title' or 'Name' property
      const titleProperty = page.properties.title || page.properties.Name;
      const title = titleProperty?.type === 'title' 
        ? titleProperty.title[0]?.plain_text 
        : 'Untitled';

      let content = '';
      let summary = '';
      let category = '';
      let region = '';
      let imageUrl = '';

      console.log('Processing page blocks...');
      for (const block of blocks) {
        if ('paragraph' in block) {
          const text = block.paragraph.rich_text
            .map(t => t.plain_text)
            .join('')
            .trim();

          if (text) {
            if (!summary) {
              summary = text;
            }
            content += text + '\n\n';
          }

          const lowerText = text.toLowerCase();
          if (lowerText.startsWith('category:')) {
            category = text.substring(9).trim();
          } else if (lowerText.startsWith('region:')) {
            region = text.substring(7).trim();
          }
        }
        
        if ('image' in block && !imageUrl) {
          imageUrl = block.image.type === 'external' 
            ? block.image.external.url 
            : block.image.file.url;
        }
      }

      if (!title || !summary) {
        throw new Error(
          'The Notion page is missing required content. Please ensure your page has:\n\n' +
          '1. A title at the top of the page\n' +
          '2. At least one paragraph for the summary\n' +
          '3. Optional: Category and Region labels (e.g., "Category: Technology")\n' +
          '4. Optional: An image for the article thumbnail'
        );
      }

      category = category || 'General';
      region = region || 'Global';
      imageUrl = imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c';
      summary = summary || 'No summary available';

      const responseData = { 
        title,
        summary,
        content: content.trim(),
        category,
        region,
        imageUrl,
      };

      console.log('Successfully processed page content');

      return new Response(
        JSON.stringify(responseData),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200
        }
      );

    } catch (notionError) {
      console.error('Notion API Error:', notionError);
      return new Response(
        JSON.stringify({
          error: notionError.message,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400
        }
      );
    }

  } catch (error) {
    console.error('Edge Function Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400
      }
    );
  }
});