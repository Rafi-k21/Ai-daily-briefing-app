import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const WEATHER_KEY = process.env.WEATHER_KEY;
const NEWS_KEY = process.env.NEWS_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;

if (!WEATHER_KEY || !NEWS_KEY || !GEMINI_KEY) {
  console.error("❌ Missing environment variables. Please check your .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// Weather API
app.get("/weather/:city", async (req, res) => {
  try {
    const city = req.params.city;
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_KEY}&units=metric`
    );
    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: `Weather fetch failed: ${err.message}` });
  }
});

// News API
app.get("/news", async (req, res) => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&apiKey=${NEWS_KEY}`
    );
    if (!response.ok) {
      throw new Error(`News API responded with status ${response.status}`);
    }
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: `News fetch failed: ${err.message}` });
  }
});

// Gemini AI Summary
app.post("/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      throw new Error("Prompt is required");
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ text });
  } catch (err) {
    // 🔍 This block has been updated for better debugging
    console.error("❌ An error occurred in the /ai route:", err);
    res.status(500).json({ error: "AI fetch failed", details: err.message, stack: err.stack });
  }
});

app.listen(3000, () =>
  console.log("✅ Backend running on http://localhost:3000")
);
