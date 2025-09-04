document.addEventListener('DOMContentLoaded', () => {
    const briefingBtn = document.getElementById("briefingBtn");
    const cityInput = document.getElementById("cityInput");
    const outputDiv = document.getElementById("output");
    const loadingDiv = document.getElementById("loading");

    // You must use an API Key for these APIs. Replace with your actual key
    const OPENWEATHER_API_KEY = "58926e7114151c66a8c43b58c99d427f";
    const NEWSAPI_API_KEY = "894f924a593e410cb4385c867ff2def7";

    async function getWeatherData(city) {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            throw new Error('City not found or weather data unavailable.');
        }
        const data = await response.json();
        return data;
    }

    async function getNewsData(country) {
        const newsUrl = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${NEWSAPI_API_KEY}`;
        const response = await fetch(newsUrl);
        if (!response.ok) {
            throw new Error('News data unavailable.');
        }
        const data = await response.json();
        return data.articles.slice(0, 3).map(n => n.title);
    }

    async function generateSummary(weather, news) {
        // This is the API key you need to add for the AI model
        const apiKey = "AIzaSyChvcctBP5a9JYizTTnQVXrdISNT0Sh9Fk"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const prompt = `Create a very concise and engaging daily briefing. The briefing should have an energetic and encouraging tone.
        
        Weather: ${weather}
        Top News: ${news.join('. ')}
        
        Structure the briefing in a single paragraph, starting with a friendly greeting, followed by the weather, and then a summary of the top news. Do not use headings or bullet points.`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: "You are a world-class AI daily briefing generator." }]
            },
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!summary) throw new Error("AI summary generation failed.");
            return summary;
        } catch (error) {
            console.error("AI summary error:", error);
            return "AI summary unavailable.";
        }
    }

    briefingBtn.addEventListener("click", async () => {
        const city = cityInput.value.trim();
        if (!city) {
            outputDiv.innerHTML = '<p class="text-red-500 text-center font-medium">Please enter a city.</p>';
            return;
        }

        outputDiv.style.opacity = '0';
        outputDiv.style.transform = 'translateY(20px)';
        loadingDiv.classList.remove("hidden");
        briefingBtn.disabled = true;

        try {
            // Fetch weather data
            const weatherData = await getWeatherData(city);
            const weatherInfo = `The weather in ${city} is ${weatherData.main.temp}°C with ${weatherData.weather[0].description}.`;
            
            // Fetch news data (using a hardcoded country for simplicity, can be improved with geocoding)
            const countryCode = "us"; // Example: US news. You could add logic here to determine country from city.
            const newsTitles = await getNewsData(countryCode);

            // Generate AI summary
            const aiSummary = await generateSummary(weatherInfo, newsTitles);

            // Render output
            outputDiv.innerHTML = `
                <h3 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span role="img" aria-label="sun">☀️</span> Weather
                </h3>
                <p class="mb-6 text-gray-700">${weatherInfo}</p>
                
                <h3 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span role="img" aria-label="newspaper">📰</span> Top News
                </h3>
                <ul class="list-disc pl-5 mb-6 text-gray-700">
                    ${newsTitles.map(title => `<li class="mb-1">${title}</li>`).join('')}
                </ul>
                
                <h3 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span role="img" aria-label="robot">🤖</span> AI Summary
                </h3>
                <p class="text-gray-700 font-light leading-relaxed">${aiSummary}</p>
            `;
            
            // Animate the output section
            setTimeout(() => {
                outputDiv.style.opacity = '1';
                outputDiv.style.transform = 'translateY(0)';
            }, 100);

        } catch (error) {
            outputDiv.innerHTML = `<p class="text-red-500 font-medium text-center">Error: ${error.message}. Please check your city name or API keys.</p>`;
            console.error("Failed to generate briefing:", error);
        } finally {
            loadingDiv.classList.add("hidden");
            briefingBtn.disabled = false;
        }
    });
});
