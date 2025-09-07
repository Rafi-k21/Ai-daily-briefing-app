document.addEventListener('DOMContentLoaded', () => {
  const briefingBtn = document.getElementById("briefingBtn");
  const cityInput = document.getElementById("cityInput");
  const outputDiv = document.getElementById("output");
  const actionsDiv = document.getElementById("actions");
  let voices = [];

  // Load voices for speech synthesis
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
  };

  // 🌌 Floating Particles Effect
  function generateParticles(mode) {
    const particlesContainer = document.querySelector(".particles");
    particlesContainer.innerHTML = "";

    if (mode === "day") {
      for (let i = 0; i < 15; i++) {
        const ray = document.createElement("div");
        ray.classList.add("sun-ray");
        const size = Math.random() * 60 + 40;
        ray.style.width = `${size}px`;
        ray.style.height = `${size}px`;
        ray.style.left = `${Math.random() * 100}%`;
        ray.style.top = `${Math.random() * 100}%`;
        ray.style.animationDuration = `${10 + Math.random() * 10}s`;
        particlesContainer.appendChild(ray);
      }
    } else {
      for (let i = 0; i < 40; i++) {
        const star = document.createElement("div");
        star.classList.add("star");
        const size = Math.random() * 3 + 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDuration = `${2 + Math.random() * 3}s`;
        particlesContainer.appendChild(star);
      }
    }
  }

  // 🌙 Theme persistence
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    generateParticles("night");
  } else {
    generateParticles("day");
  }

  document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const mode = document.body.classList.contains("dark-mode") ? "night" : "day";
    localStorage.setItem("theme", mode === "night" ? "dark" : "light");
    generateParticles(mode);
  });

  // 🌍 Auto-detect location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const res = await fetch(`/location?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        if (data.city) {
          cityInput.value = data.city;
        }
      } catch (e) {
        console.error("Location fetch failed", e);
      }
    }, (error) => {
      console.warn("Geolocation denied or failed:", error);
    });
  }

  // 🚀 Generate briefing (via backend)
  async function generateBriefing(city) {
    const res = await fetch(`http://localhost:5500/briefing?city=${encodeURIComponent(city)}`);

    if (!res.ok) throw new Error("Briefing fetch failed");
    return await res.json();
  }

  // 🎯 Button click
  briefingBtn.addEventListener("click", async () => {
    const city = cityInput.value.trim();
    if (!city) {
      outputDiv.innerHTML = `<p class="text-red-500">⚠️ Please enter a city.</p>`;
      return;
    }

    outputDiv.innerHTML = "<p>Loading your briefing...</p>";
    actionsDiv.classList.add("hidden");

    try {
      const { weatherInfo, news, aiSummary } = await generateBriefing(city);
      outputDiv.innerHTML = `
        <div class="card">
          <h3>☀️ Weather</h3>
          <p>The weather in ${city} is ${weatherInfo}.</p>
        </div>
        <div class="card">
          <h3>📰 Top News</h3>
          <ul>${news.map(n => `<li>${n}</li>`).join("")}</ul>
        </div>
        <div class="card">
          <h3>🤖 AI Summary</h3>
          <p id="summary">${aiSummary}</p>
        </div>
      `;
      actionsDiv.classList.remove("hidden");
    } catch (e) {
      outputDiv.innerHTML = `<p class="text-red-500">⚠️ ${e.message}</p>`;
    }
  });

  // 📋 Copy
  document.getElementById("copyBtn").addEventListener("click", () => {
    const text = document.getElementById("summary")?.innerText || "";
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard!");
      }).catch(err => {
        console.error("Copy failed", err);
      });
    }
  });

  // 📄 PDF
  document.getElementById("pdfBtn").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const outputText = document.getElementById("output").innerText;
    doc.setFontSize(12);
    doc.text(outputText.split('\n'), 10, 10);
    doc.setFontSize(10);
    doc.text("Built by Anamul Khan Rafi", 10, 280);
    doc.save("daily-briefing.pdf");
  });

  // 📤 Share
  document.getElementById("shareBtn").addEventListener("click", async () => {
    const text = document.getElementById("summary")?.innerText || "";
    if (text && navigator.share) {
      try {
        await navigator.share({ title: "AI Daily Briefing", text });
      } catch (err) {
        console.error("Share failed", err);
        alert("Sharing not supported or failed.");
      }
    } else {
      alert("Sharing not supported on this device.");
    }
  });

  // 🔊 Voice
  document.getElementById("voiceBtn").addEventListener("click", () => {
    const text = document.getElementById("summary")?.innerText || "";
    if (text && 'speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(text.replace(/[^\w\s.,!?]/g, ''));
      msg.rate = 0.8;
      msg.pitch = 1.1;
      msg.volume = 1;
      const casualVoice = voices.find(voice =>
        voice.name.includes('Casual') ||
        voice.name.includes('Informal') ||
        voice.name.includes('English')
      );
      if (casualVoice) msg.voice = casualVoice;
      window.speechSynthesis.speak(msg);
    } else {
      alert("Speech synthesis not supported.");
    }
  });
});
