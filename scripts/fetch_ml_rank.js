const fs = require('fs');

// Moonton's official internal API configuration
const CONFIG = {
    // URL endpoint derived from network logs
    apiUrl: "https://sg-api.mobilelegends.com/api/v1/rank/data",
    // Standard headers to prevent the request from being blocked as a raw bot
    headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://www.mobilelegends.com",
        "Referer": "https://www.mobilelegends.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    // Moonton API Query parameters:
    // type 101 = ALL Ranks, type 5 = Epic, type 6 = Legend, type 7 = Mythic, type 8 = Mythical Honor, type 9 = Mythical Glory+
    params: {
        type: "101",
        language: "en"
    }
};

async function fetchRankDataToCSV() {
    try {
        console.log("🚀 Initializing fetch request to Moonton internal API...");

        // Construct URL with query parameters
        const urlWithParams = `${CONFIG.apiUrl}?type=${CONFIG.params.type}&language=${CONFIG.params.language}`;

        const response = await fetch(urlWithParams, {
            method: "GET",
            headers: CONFIG.headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonResult = await response.json();

        // Safety check to ensure data structure matches expectations
        if (!jsonResult || !jsonResult.data || !Array.isArray(jsonResult.data)) {
            throw new Error("Unexpected JSON format received from the server.");
        }

        const heroList = jsonResult.data;
        console.log(`📦 Successfully grabbed data for ${heroList.length} heroes.`);

        // 1. Initialize CSV Header Row
        let csvContent = "Hero ID,Hero Name,Win Rate,Pick Rate,Ban Rate\n";

        // 2. Iterate and append rows dynamically
        heroList.forEach(hero => {
            // Escape names containing commas to preserve proper CSV columns
            const cleanName = hero.name.includes(',') ? `"${hero.name}"` : hero.name;

            // Extract and cleanly format stats (Moonton uses string representations for percentages)
            const winRate = hero.win_rate || "0.00%";
            const pickRate = hero.appearance_rate || "0.00%"; // Moonton maps pick_rate to appearance_rate
            const banRate = hero.ban_rate || "0.00%";

            csvContent += `${hero.hero_id},${cleanName},${winRate},${pickRate},${banRate}\n`;
        });

        // 3. Write data to a local file
        const outputFilename = 'data_hero.csv';
        fs.writeFileSync(outputFilename, csvContent, 'utf8');

        console.log(`✅ Success! Data written neatly to: ./${outputFilename}`);

    } catch (error) {
        console.error("❌ An error occurred during execution:");
        console.error(error.message);
    }
}

// Execute the automation script
fetchRankDataToCSV();