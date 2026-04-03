// supabase/functions/search-movie/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

// API-ключ из переменной окружения (НЕ в коде!)
const POISK_KINO_API_KEY = Deno.env.get("POISK_KINO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();
    
    // ПОИСК ФИЛЬМА
    if (action === 'search') {
      const query = url.searchParams.get('query');
      const year = url.searchParams.get('year');
      const type = url.searchParams.get('type') || 'movie';
      
      if (!query) {
        return new Response(
          JSON.stringify({ error: "Query parameter required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Типы для API Кинопоиска
      const typeMap: Record<string, string> = {
        'movie': 'movie',
        'series': 'tv-series',
        'cartoon': 'animated-series'
      };
      
      const apiType = typeMap[type] || 'movie';
      let searchUrl = `https://api.poiskkino.dev/v1.4/movie/search?query=${encodeURIComponent(query)}&limit=5`;
      if (year) searchUrl += `&year=${year}`;
      
      const response = await fetch(searchUrl, {
        headers: { 'X-API-KEY': POISK_KINO_API_KEY || '' }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // ПОЛНЫЕ ДАННЫЕ ФИЛЬМА ПО ID
    if (action === 'movie') {
      const movieId = url.searchParams.get('id');
      
      if (!movieId) {
        return new Response(
          JSON.stringify({ error: "Movie ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const response = await fetch(`https://api.poiskkino.dev/v1.4/movie/${movieId}`, {
        headers: { 'X-API-KEY': POISK_KINO_API_KEY || '' }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Invalid action. Use /search or /movie" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});