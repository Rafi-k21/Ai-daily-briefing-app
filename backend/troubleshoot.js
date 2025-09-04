import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// Get your API key from the .env file
const apiKey = process.env.GEMINI_KEY;

if (!apiKey) {
  console.error("Error: GEMINI_KEY is not set in your .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function runTest() {
  try {
    console.log("Attempting to connect to the Gemini API...");
    // Use the model that is failing in your app
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = "What are the three most popular programming languages? Respond in a single paragraph.";

    console.log("Sending a test prompt to the model...");

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("Success! Here is the response:");
    console.log(text);
  } catch (error) {
    console.error("An error occurred during the API call. Please check the details below:");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
  }
}

runTest();
