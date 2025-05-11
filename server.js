
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
