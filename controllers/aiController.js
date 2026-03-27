const axios = require("axios");
const User = require("../models/user");
const logActivity = require("../utils/logger");

const apiKey = process.env.GEMINI_API_KEY;
const apiKey2 = process.env.GEMINI_API_KEY_2; 
const tmdbToken = process.env.TMDB_TOKEN;
const tmdbBaseUrl = process.env.TMDB_BASE_URL;

exports.getAiRecommendation = async (req, res) => {
  try {
    const { task, data } = req.body;
    const model = "gemini-2.5-flash"; 
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const currentTask = task || "semantic_search";
    let promptText = "";

    switch (currentTask) {
      case "semantic_search":
       promptText = `You are the CineMood Neural Engine v2.5, a high-performance semantic movie discovery system.
        
        INPUT VIBE/CONTEXT: "${data}"

        CORE OBJECTIVE:
        Analyze the provided vibe for thematic depth, emotional resonance, and cinematic style. Identify 10 critically acclaimed or highly-rated motion pictures that align with these neural patterns.

        CRITICAL OPERATING RULES:
        1. REGIONAL LOCK: If a specific language or industry (e.g., "Malayalam", "Korean", "Anime") is mentioned or implied, STRICTLY filter results to that category only.
        2. GLOBAL TITLES: Provide titles in English or their primary international release name for TMDB compatibility.
        3. DATA INTEGRITY: Ensure all titles are real, existing films.
        4. OUTPUT STRUCTURE: Return ONLY a valid JSON object.

        JSON SCHEMA:
        {
            "movieTitles": ["Title 1", "Title 2", ...], 
            "reason": "Provide a high-level analytical explanation of the thematic connection.", 
            "suggestion": "Identify the 'North Star' film of this collection.",
            "aiInsight": "A short, 1-sentence observation on the sub-genre or hidden pattern found in this search."
        }`;
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid task" });
    }

    const aiRes = await axios.post(geminiUrl, {
      contents: [{ parts: [{ text: promptText }] }],
    });

    const rawOutput = aiRes.data.candidates[0].content.parts[0].text.trim();
    const cleanJsonString = rawOutput.replace(/```json|```/g, "").trim();
    const aiParsed = JSON.parse(cleanJsonString);

    if (currentTask === "semantic_search") {
      const titles = aiParsed.movieTitles;
      const moviePromises = titles.map(async (title) => {
        try {
          const tmdbRes = await axios.get(
            `${tmdbBaseUrl}/search/movie?query=${encodeURIComponent(title)}&include_adult=false`,
            { headers: { Authorization: `Bearer ${tmdbToken}` } }
          );
          return tmdbRes.data.results[0]; 
        } catch (err) {
          console.error(`TMDB error for ${title}:`, err.message);
          return null;
        }
      });

      const movieResults = await Promise.all(moviePromises);
      const finalMovies = movieResults.filter(movie => movie !== null);

      logActivity(req.user._id, `Nueral AI Search: ${data}`, "search")

      return res.status(200).json({
        success: true,
        reason: aiParsed.reason,
        suggestion: aiParsed.suggestion || null,
        movies: finalMovies,
      });
    }

  } catch (error) {
    console.error("AI Controller Error:", error.message);
    res.status(500).json({ success: false, error: "Failed to process AI recommendation" });
  }
};


exports.syncWeeklySpotlight = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (user.weeklySpotlight && 
        user.weeklySpotlight.movies?.length > 0 && 
        user.weeklySpotlight.generatedAt > sevenDaysAgo) {
      return res.status(200).json({ 
        success: true, 
        cached: true,
        themeTitle: user.weeklySpotlight.themeTitle,
        themeDescription: user.weeklySpotlight.themeDescription,
        aiInsight: user.weeklySpotlight.aiInsight, // ADDED THIS
        movies: user.weeklySpotlight.movies 
      });
    }

    if (!user.watchlist || user.watchlist.length === 0) {
      return res.status(200).json({ success: false, message: "Add movies to your watchlist first!" });
    }

    const titles = user.watchlist.map(movie => movie.title || movie.original_title).join(", ");

    const model = "gemini-2.5-flash"; // Note: gemini-2.5 doesn't exist yet, stick to 1.5-flash or pro
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey2}`;

    // UPDATED PROMPT to include aiInsight
    const promptText = `You are a cinematic genius. The user has these movies in their watchlist: "${titles}".
    TASK:
    1. Identify a trending aesthetic/genre in their taste.
    2. Create a high-end theme title and description (Max 20 words).
    3. Suggest 12 globally famous movie titles that define this trend.
    4. Provide a 1-sentence "aiInsight" about why these movies match.
    Return ONLY JSON: { "themeTitle": "string", "themeDescription": "string", "aiInsight": "string", "movieTitles": ["Title 1", ...] }`;

    const aiRes = await axios.post(geminiUrl, { contents: [{ parts: [{ text: promptText }] }] });
    const rawOutput = aiRes.data.candidates[0].content.parts[0].text.trim();
    const cleanJsonString = rawOutput.replace(/```json|```/g, "").trim();
    const aiParsed = JSON.parse(cleanJsonString);

    const moviePromises = aiParsed.movieTitles.map(async (title) => {
      try {
        const cleanTitle = title.replace(/^\d+\.\s*/, "").replace(/\s*\(\d{4}\)$/, "").trim();
        const tmdbRes = await axios.get(
          `${tmdbBaseUrl}/search/movie?query=${encodeURIComponent(cleanTitle)}&include_adult=false`,
          { headers: { Authorization: `Bearer ${tmdbToken}` } }
        );
        return tmdbRes.data.results[0]; 
      } catch (err) {
        return null;
      }
    });

    const movies = (await Promise.all(moviePromises)).filter(m => m != null);

    // Update and Save to MongoDB
    user.weeklySpotlight = {
      themeTitle: aiParsed.themeTitle,
      themeDescription: aiParsed.themeDescription,
      aiInsight: aiParsed.aiInsight, // ADDED THIS
      movies: movies,
      generatedAt: new Date()
    };

    user.markModified('weeklySpotlight'); 
    await user.save();

    return res.status(200).json({
      success: true,
      cached: false,
      themeTitle: user.weeklySpotlight.themeTitle,
      themeDescription: user.weeklySpotlight.themeDescription,
      aiInsight: user.weeklySpotlight.aiInsight, // ADDED THIS
      movies: user.weeklySpotlight.movies
    });

  } catch (error) {
    console.error("Weekly Spotlight Error:", error.message);
    res.status(500).json({ success: false, error: "AI Engine error." });
  }
};