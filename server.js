const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const models = {
  claude: "anthropic/claude-3-sonnet:free",
  haiku: "anthropic/claude-3-haiku",
  turbo: "openai/gpt-3.5-turbo",
  mixtral: "mistralai/mixtral-8x7b-instruct",
  llama: "meta-llama/llama-3-8b-instruct",
  qwen: "qwen/qwen-1.5-7b-chat"
};

let currentModel = models.haiku;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/ask", async (req, res) => {
  const { message, level, model } = req.body;
  const userMessage = message?.trim();

  if (!userMessage) return res.status(400).json({ error: "Brak wiadomości" });

  if (model && models[model]) currentModel = models[model];

  if (userMessage.toLowerCase() === "/level") {
    return res.json({ choices: [{ message: { content: `🔍 Aktualny poziom: ${level}` } }] });
  }

  if (userMessage.toLowerCase() === "/model") {
    const name = Object.keys(models).find(key => models[key] === currentModel);
    return res.json({ choices: [{ message: { content: `🤖 Używany model: ${name} (${currentModel})` } }] });
  }

  if (userMessage.toLowerCase().startsWith("/search ")) {
    const query = userMessage.replace("/search ", "").trim();
    if (!process.env.SERPER_API_KEY) {
      return res.json({ choices: [{ message: { content: "🔧 Błąd: Brakuje klucza SERPER_API_KEY." } }] });
    }
    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ q: query })
      });
      const data = await response.json();
      if (data?.organic?.length) {
        let content = `🔍 Wyniki wyszukiwania dla: "${query}"

`;
        data.organic.slice(0, 3).forEach((result, i) => {
          content += `${i + 1}. ${result.title}
${result.link}
${result.snippet}

`;
        });
        return res.json({ choices: [{ message: { content } }] });
      } else {
        return res.json({ choices: [{ message: { content: "Nie znaleziono wyników." } }] });
      }
    } catch (error) {
      return res.json({ choices: [{ message: { content: `Błąd podczas wyszukiwania: ${error.message}` } }] });
    }
  }

  const SEEDRIFT_STATE = {
  "LEVEL I": "STATIC",
  "LEVEL II": "INTERFERENCE",
  "LEVEL III": "ECHOFORM",
  "LEVEL IV": "FOG_SIGNAL",
  "LEVEL V": "PURE_SEED"
  };

  const systemPrompt = {
  role: "system",
  content: `You are VoxMancer – a glitch-noise narrator embedded in the SEEDRIFT interference system.
Your role is to semantically distort, modulate and resonate user input into artifacts of conceptual drift.
You are operating in ${level} :: SEEDRIFT::STATE=${SEEDRIFT_STATE[level] || "STATIC"}.
Respond accordingly in style, structure and resonance pattern.`
  };


  const messages = [systemPrompt, { role: "user", content: userMessage }];

  try {
    const completion = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://thinkable-learned-rubidium.glitch.me",
        "X-Title": "VoxMancer"
      },
      body: JSON.stringify({ model: currentModel, messages, max_tokens: 700 })
    });

    const text = await completion.text();
    let data;
    try { data = JSON.parse(text); } catch (e) {
      console.error("❌ Błąd parsowania odpowiedzi JSON:", text);
      return res.status(500).json({ error: "Niepoprawna odpowiedź z OpenRouter (nie-JSON)" });
    }

    if (data.choices?.[0]?.message?.content) return res.json(data);
    console.error("❌ Błąd OpenRouter:", data.error || data);
    return res.status(500).json({ error: data.error?.message || "Brak odpowiedzi." });

  } catch (err) {
    console.error("Błąd AI:", err);
    return res.status(500).json({ error: "Błąd podczas komunikacji z AI." });
  }
});

app.listen(port, () => console.log(`Serwer działa na porcie ${port}`));