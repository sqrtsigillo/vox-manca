
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

const API_KEY = process.env.OPENROUTER_API_KEY;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/ask", async (req, res) => {
  console.log("📥 Odebrano zapytanie:", req.body);

  const input = req.body.message || "";
  const model = req.body.model || "openai/gpt-3.5-turbo";

  if (!input.trim()) {
    console.warn("⚠️ Pusty prompt!");
    return res.status(400).json({ error: "Prompt cannot be empty." });
  }

  const payload = model.startsWith("anthropic/")
    ? { model: model, prompt: input }
    : { model: model, messages: [{ role: "user", content: input }] };

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📦 Odpowiedź z OpenRouter:", JSON.stringify(response.data, null, 2));

    const output =
      response.data?.choices?.[0]?.message?.content ||
      response.data?.choices?.[0]?.text;

    if (output) {
      res.json({ response: output });
    } else {
      console.error("⚠️ Brak danych w odpowiedzi:", response.data);
      res.status(500).json({ error: "Invalid response from OpenRouter", data: response.data });
    }
  } catch (error) {
    console.error("❌ Błąd OpenRouter:", error.response?.data || error.message);
    res.status(500).json({ error: "OpenRouter error", details: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
