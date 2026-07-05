const fs = require('fs');

const inputFile = 'output_table.csv';
const outputFile = 'cleaned_heroes.csv';

// Matches individual percentages like "0.46%" or "55%"
const pctRegex = /\d+(?:\.\d+)?%/g;

// Looks for a word containing at least 3 alphabetic characters in a row (case insensitive)
const threeLetterWordRegex = /[a-zA-Z]{3,}/;

try {
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split(/\r?\n/);
    const cleanedRows = [['hero', 'pick rate', 'winrate']];

    for (let line of lines) {
        line = line.trim().replace(/^"+|"+$/g, '');

        // 1. UPDATED: Line must contain AT LEAST 3 percent signs
        const percentCount = (line.match(/%/g) || []).length;

        if (percentCount >= 3) {
            const percentages = line.match(pctRegex);

            if (percentages && percentages.length >= 2) {
                const pickRate = percentages[0];
                const winRate = percentages[1];

                // 2. Isolate everything to the left of the pick rate
                const leftSide = line.split(pickRate)[0].trim();

                // 3. Split into words and search backwards for the hero name
                const words = leftSide.split(/\s+/);
                let heroName = '';

                // Loop through words starting from the one right next to the pick rate, moving left
                for (let i = words.length - 1; i >= 0; i--) {
                    const cleanWord = words[i].replace(/[^\w\s-]/g, ''); // strip punctuation first

                    if (threeLetterWordRegex.test(cleanWord)) {
                        heroName = cleanWord;
                        break; // Found our hero! Stop looking further left.
                    }
                }

                // 4. If we successfully found a valid hero name, save the data
                if (heroName) {
                    cleanedRows.push([heroName, pickRate, winRate]);
                }
            }
        }
    }

    // Convert array to CSV format
    const csvContent = cleanedRows
        .map(row => row.map(val => `"${val}"`).join(','))
        .join('\n');

    fs.writeFileSync(outputFile, csvContent, 'utf8');
    console.log(`Success! Extracted ${cleanedRows.length - 1} heroes into '${outputFile}'`);

} catch (err) {
    if (err.code === 'ENOENT') {
        console.error(`Error: Could not find the file '${inputFile}' in this folder.`);
    } else {
        console.error('An error occurred:', err.message);
    }
}