import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SB_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/api', '');
    
    const supabaseUrl = `${SUPABASE_URL}/rest/v1${path}${url.search}`;
    
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      body = await req.text();
    }
    
    const response = await fetch(supabaseUrl, {
      method: req.method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': req.headers.get('Prefer') || 'return=representation'
      },
      body: body
    });
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return new Response(
      typeof data === 'string' ? data : JSON.stringify(data),
      {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType || 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error("API Gateway error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});