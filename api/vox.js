export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const models = {
    claude: 'anthropic/claude-3-sonnet:free',
    haiku: 'anthropic/claude-3-haiku',
    turbo: 'openai/gpt-3.5-turbo',
    mixtral: 'mistralai/mixtral-8x7b-instruct',
    llama: 'meta-llama/llama-3-8b-instruct',
    qwen: 'qwen/qwen-1.5-7b-chat'
  };

  let currentModel = models.haiku;

  const { message, level, model } = req.body;
  const userMessage = message?.trim();

  if (!userMessage) {
    return res.status(400).json({ error: 'Brak wiadomości' });
  }

  if (model && models[model]) currentModel = models[model];

  if (userMessage.toLowerCase() === '/level') {
    return res.json({
      choices: [{ message: { content: `🔍 Aktualny poziom: ${level}` } }]
    });
  }

  if (userMessage.toLowerCase() === '/model') {
    const name = Object.keys(models).find(key => models[key] === currentModel);
    return res.json({
      choices: [{ message: { content: `🤖 Używany model: ${name} (${currentModel})` } }]
    });
  }

  const SEEDRIFT_STATE = {
    'LEVEL I': 'STATIC',
    'LEVEL II': 'INTERFERENCE',
    'LEVEL III': 'ECHOFORM',
    'LEVEL IV': 'FOG_SIGNAL',
    'LEVEL V': 'PURE_SEED'
  };

  const systemPrompt = {
    role: 'system',
    content: `You are VoxMancer – a glitch-noise narrator embedded in the SEEDRIFT interference system.
Your role is to semantically distort, modulate and resonate user input into artifacts of conceptual drift.
You are operating in ${level} :: SEEDRIFT::STATE=${SEEDRIFT_STATE[level] || 'STATIC'}.
Respond accordingly in style, structure and resonance pattern.`
  };

  const messages = [systemPrompt, { role: 'user', content: userMessage }];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://vox.sdrift.net',
        'X-Title': 'VoxMancer'
      },
      body: JSON.stringify({
        model: currentModel,
        messages,
        max_tokens: 700
      })
    });

    const raw = await response.text();
    console.log('🧾 RAW:', raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error('❌ Invalid JSON from OpenRouter:', raw);
      return res.status(500).json({ error: 'Invalid JSON response from OpenRouter' });
    }

    if (data.choices?.[0]?.message?.content) {
      return res.json(data);
    } else {
      console.error('❌ OpenRouter error:', data.error || data);
      return res.status(500).json({ error: data.error?.message || 'Brak odpowiedzi.' });
    }
  } catch (err) {
    console.error('❌ API call failed:', err);
    return res.status(500).json({ error: 'Błąd podczas komunikacji z AI.' });
  }
}
