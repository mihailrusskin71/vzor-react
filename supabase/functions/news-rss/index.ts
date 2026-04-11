// supabase/functions/news-rss/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  // Обработка preflight-запросов
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ИСПОЛЬЗУЕМ KINONEWS.RU - ПРОВЕРЕНО И РАБОТАЕТ
    const rssUrl = "https://www.kinonews.ru/rss/";
    
    console.log(`📡 Запрос к KinoNews.ru RSS: ${rssUrl}`);
    
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const xmlData = await response.text();
    console.log(`✅ Получено ${xmlData.length} символов от KinoNews.ru`);
    
    return new Response(xmlData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600", // Кэш 10 минут
      },
    });
    
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});