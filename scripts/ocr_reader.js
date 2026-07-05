const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// Configuration
const folderPath = path.join(__dirname, 'mentahan');
const csvOutputPath = path.join(__dirname, 'output_table.csv');

// Regex to find files like "2026-07-05 (2).png", "2026-07-05 (3).png", etc.
const filePattern = /^2026-07-05 \(\d+\)\.png$/;

async function processAllImages() {
    try {
        // 1. Get and sort matching files from the directory
        if (!fs.existsSync(folderPath)) {
            console.error(`Error: Folder '${folderPath}' does not exist.`);
            return;
        }

        const files = fs.readdirSync(folderPath)
            .filter(file => filePattern.test(file))
            .sort((a, b) => {
                // Extract the numbers inside parentheses to sort them correctly (e.g., 2, 3, 10)
                const numA = parseInt(a.match(/\((\d+)\)/)[1], 10);
                const numB = parseInt(b.match(/\((\d+)\)/)[1], 10);
                return numA - numB;
            });

        if (files.length === 0) {
            console.log("No matching images found in the 'mentahan' folder.");
            return;
        }

        console.log(`Found ${files.length} files to process:`, files);

        // Initialize or clear the CSV output file before appending fresh data
        // If you want to keep data from previous script runs, comment out the line below.
        fs.writeFileSync(csvOutputPath, '', 'utf8');

        // 2. Process each file sequentially
        for (const file of files) {
            const imagePath = path.join(folderPath, file);
            console.log(`\n========================================`);
            console.log(`Processing: ${file}...`);
            console.log(`========================================`);

            const result = await Tesseract.recognize(imagePath, 'eng');
            const fullText = result.data.text;

            // Parse text line by line
            const lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            let tableRows = [];
            let textBelowTable = [];
            let insideTable = false;
            let tableHeadersFound = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].toLowerCase();

                if (line.includes('hero') && (line.includes('pick') || line.includes('win'))) {
                    insideTable = true;
                    tableHeadersFound = true;
                    tableRows.push(lines[i]);
                    continue;
                }

                if (insideTable) {
                    const hasNumbers = /\d/.test(line);
                    if (!hasNumbers && tableRows.length > 1) {
                        insideTable = false;
                        textBelowTable.push(lines[i]);
                    } else {
                        tableRows.push(lines[i]);
                    }
                } else if (tableHeadersFound) {
                    textBelowTable.push(lines[i]);
                }
            }

            // 3. Format the data for this specific file
            let csvChunk = `\n"--- DATA FROM FILE: ${file} ---"\n`;

            tableRows.forEach(row => {
                const columns = row.split(/\s{2,}/).map(col => `"${col.trim()}"`);
                csvChunk += columns.join(',') + '\n';
            });

            if (textBelowTable.length > 0) {
                csvChunk += '"--- Text Below Table ---"\n';
                textBelowTable.forEach(line => {
                    csvChunk += `"${line}"\n`;
                });
            }

            // 4. Append this chunk to our master CSV file
            fs.appendFileSync(csvOutputPath, csvChunk, 'utf8');
            console.log(`Finished appending data from ${file}`);
        }

        console.log(`\nAll done! Consolidated output saved to: ${csvOutputPath}`);

    } catch (error) {
        console.error("An error occurred during batch processing:", error);
    }
}

processAllImages();