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

// 🌍 Combined Briefing Endpoint
app.get("/briefing", async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) return res.status(400).json({ error: "City is required" });

    // 1️⃣ Weather
    const wRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_KEY}&units=metric`
    );
    if (!wRes.ok) throw new Error("Weather data unavailable");
    const wData = await wRes.json();
    const weatherInfo = `${wData.main.temp}°C with ${wData.weather[0].description}`;

    // 2️⃣ News
    const nRes = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_KEY}`
    );
    if (!nRes.ok) throw new Error("News unavailable");
    const nData = await nRes.json();
    const news = nData.articles.slice(0, 3).map(a => a.title);

    // 3️⃣ AI Summary
    const basePrompt = `Create a concise, professional daily briefing for ${city}.
Weather: ${weatherInfo}.
Top news: ${news.join(", ")}.
Keep it engaging and informative.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
    const result = await model.generateContent(basePrompt);
    const response = await result.response;
    const aiSummary = response.text();

    res.json({ weatherInfo, news, aiSummary });
  } catch (err) {
    console.error("❌ Briefing error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🌎 Location Reverse Geocode
app.get("/location", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat & lon are required" });

    const rRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!rRes.ok) throw new Error("Reverse geocode failed");
    const rData = await rRes.json();

    res.json({ city: rData.city || rData.locality || "" });
  } catch (err) {
    console.error("❌ Location error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5500, () =>
  console.log("✅ Backend running on http://localhost:5500")
);
