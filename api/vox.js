// File: api/vox.js
import { headers } from 'next/headers';

export const config = {
  runtime: 'edge', // Ważne dla Vercel
  regions: ['fra1'], // Wybierz region bliski użytkownikom
};

export default async function handler(req) {
  // Weryfikacja metody
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Konfiguracja modeli
  const models = {
    claude: 'anthropic/claude-3-sonnet',
    haiku: 'anthropic/claude-3-haiku',
    turbo: 'openai/gpt-3.5-turbo',
    mixtral: 'mistralai/mixtral-8x7b-instruct',
    llama: 'meta-llama/llama-3-8b-instruct',
    qwen: 'qwen/qwen-1.5-7b-chat'
  };

  try {
    // Parsowanie body
    const { message, level, model, lang = 'en' } = await req.json();
    const userMessage = message?.trim();
    const currentModel = model && models[model] ? models[model] : models.haiku;

    // Walidacja
    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Empty message', details: lang === 'pl' ? 'Brak wiadomości' : 'No message provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Konfiguracja promptu
    const systemContent = lang === 'pl' 
      ? `Jesteś VoxMancerem – glitchowym narratorem SEEDRIFT. Poziom ech: ${level}`
      : `You are VoxMancer – glitch-noise narrator embedded in SEEDRIFT. Echo level: ${level}`;

    const messages = [
      { role: 'system', content: systemContent },
      { role: 'user', content: userMessage }
    ];

    // Logika zapytania do OpenRouter
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vox.sdrift.net',
        'X-Title': 'VoxMancer'
      },
      body: JSON.stringify({
        model: currentModel,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    // Obsługa odpowiedzi
    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json();
      throw new Error(errorData.error?.message || 'OpenRouter API error');
    }

    const data = await openRouterResponse.json();
    
    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' // Wyłącz cache dla dynamicznych odpowiedzi
        }
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}