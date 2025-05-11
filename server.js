
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

const API_KEY = "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";  // Replace this string with your actual OpenRouter key

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/ask", async (req, res) => {
  const input = req.body.prompt || "";

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: input }],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.error("❌ Błąd OpenRouter:", error.response?.data || error.message);
    res.status(500).json({ error: "OpenRouter error", details: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
