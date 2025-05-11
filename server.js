// server.js (dla lokalnego uruchomienia np. z Glitcha lub Render)

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// === Główna trasa ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// === Endpoint VoxMancera ===
app.post("/ask", async (req, res) => {
  const { message, level, model } = req.body;
  const userMessage = message?.trim();
  const currentModel = model || "qwen/qwen-1.5-7b-chat";

  if (!userMessage) {
    return res.status(400).json({ error: "Brak wiadomości" });
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

  const messages = [
    systemPrompt,
    { role: "user", content: userMessage }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://vox.sdrift.net",
        "X-Title": "VoxMancer"
      },
      body: JSON.stringify({
        model: currentModel,
        messages,
        max_tokens: 700
      })
    });

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Nie udało się sparsować JSON-a z OpenRoutera:", raw);
      return res.status(500).json({ error: "Niepoprawny JSON z OpenRoutera." });
    }

    if (data.choices?.[0]?.message?.content) {
      return res.json({
        choices: [
          {
            message: {
              content: data.choices[0].message.content
            }
          }
        ]
      });
    } else if (data.error) {
      console.error("❌ Błąd OpenRouter:", data.error);
      return res.status(500).json({ error: data.error.message });
    } else {
      return res.status(500).json({ error: "Brak odpowiedzi z modelu." });
    }

  } catch (err) {
    console.error("❌ Błąd po stronie serwera:", err);
    return res.status(500).json({ error: "Błąd podczas komunikacji z OpenRouter." });
  }
});

app.listen(port, () => {
  console.log(`🟢 Serwer VoxMancera działa na porcie ${port}`);
});
