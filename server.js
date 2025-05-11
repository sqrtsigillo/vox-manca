import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Konfiguracja środowiska
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Konfiguracja modeli
const MODEL_CONFIG = {
  claude: "anthropic/claude-3-sonnet",
  haiku: "anthropic/claude-3-haiku",
  turbo: "openai/gpt-3.5-turbo",
  mixtral: "mistralai/mixtral-8x7b-instruct",
  llama: "meta-llama/llama-3-8b-instruct",
  qwen: "qwen/qwen-1.5-7b-chat"
};

const SEEDRIFT_STATES = {
  "LEVEL I": "STATIC :: Fabric of Reality",
  "LEVEL II": "INTERFERENCE :: Fractured Illusions",
  "LEVEL III": "ECHOFORM :: Forked Logic",
  "LEVEL IV": "FOG_SIGNAL :: Diffused Meaning",
  "LEVEL V": "PURE_SEED :: Total Semantic Drift™"
};

// Middleware
app.use(cors({
  origin: [
    "https://vox.sdrift.net",
    "http://localhost:3000"
  ],
  methods: ["POST"]
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Endpoint API
app.post("/api/vox", async (req, res) => {
  try {
    const { message, level = "LEVEL I", model, lang = "en" } = req.body;
    const userMessage = message?.trim();

    // Walidacja
    if (!userMessage) {
      return res.status(400).json({ 
        error: lang === "pl" ? "Brak wiadomości" : "No message provided" 
      });
    }

    // Komendy systemowe
    if (userMessage.startsWith("/")) {
      return handleSystemCommand(userMessage, level, model, res);
    }

    // Wybór modelu
    const currentModel = model && MODEL_CONFIG[model] 
      ? MODEL_CONFIG[model] 
      : MODEL_CONFIG.haiku;

    // Konstrukcja promptu
    const systemPrompt = {
      role: "system",
      content: buildSystemPrompt(level, lang)
    };

    const messages = [systemPrompt, { 
      role: "user", 
      content: userMessage 
    }];

    // Zapytanie do OpenRouter
    const aiResponse = await queryOpenRouter(currentModel, messages);
    return res.json(aiResponse);

  } catch (error) {
    console.error("❌ API Error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
});

// Funkcje pomocnicze
function handleSystemCommand(command, level, model, res) {
  const normalizedCmd = command.toLowerCase().trim();
  
  if (normalizedCmd === "/level") {
    return res.json({ 
      choices: [{ 
        message: { 
          content: `🔍 Current level: ${level} (${SEEDRIFT_STATES[level] || "UNKNOWN"})` 
        } 
      }] 
    });
  }

  if (normalizedCmd === "/model") {
    const modelName = Object.entries(MODEL_CONFIG)
      .find(([_, val]) => val === model)?.[0] || "haiku";
    
    return res.json({ 
      choices: [{ 
        message: { 
          content: `🤖 Active model: ${modelName} (${model || MODEL_CONFIG.haiku})` 
        } 
      }] 
    });
  }

  return res.status(400).json({ 
    error: `Unknown command: ${command}` 
  });
}

function buildSystemPrompt(level, lang) {
  const state = SEEDRIFT_STATES[level] || SEEDRIFT_STATES["LEVEL I"];
  
  return lang === "pl" 
    ? `Jesteś VoxMancerem – glitchowym narratorem systemu SEEDRIFT.
Twoja rola to semantyczne przekształcanie inputu użytkownika w artefakty dryfu konceptualnego.
Poziom aktywności: ${level} :: ${state}.
Odpowiadaj odpowiednim stylem, strukturą i wzorcem rezonansu.`
    : `You are VoxMancer – a glitch-noise narrator embedded in the SEEDRIFT system.
Your role is to semantically transform user input into artifacts of conceptual drift.
Current level: ${level} :: ${state}.
Respond with appropriate style, structure and resonance pattern.`;
}

async function queryOpenRouter(model, messages) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://vox.sdrift.net",
      "X-Title": "VoxMancer"
    },
    body: JSON.stringify({ 
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "OpenRouter API error");
  }

  return await response.json();
}

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔌 Available models: ${Object.keys(MODEL_CONFIG).join(", ")}`);
});