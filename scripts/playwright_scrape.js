const { chromium } = require('playwright');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to Mobile Legends Rank page...');
        // Using a networkidle wait state ensures data grids are populated
        await page.goto('https://www.mobilelegends.com/rank', { waitUntil: 'networkidle' });

        // The official MLBB rank page has tabs/tables. We locate the row corresponding to Rank 1.
        // Usually, rows are enclosed in <tr> or specific components. We ensure the first row is visible.
        const firstRowLocator = page.locator('.rank-table tbody tr').first();

        // Fallback locator strategy: target by the numerical rank "1" block if class layouts change
        const rowExists = await firstRowLocator.count();
        const finalLocator = rowExists > 0 ? firstRowLocator : page.locator('.rank-list-item').first();

        await finalLocator.waitFor({ state: 'visible', timeout: 15000 });
        console.log('Rank 1 row detected. Capturing screenshot for OCR parsing...');

        // Take a screenshot snippet of only the Rank 1 row element
        const imagePath = path.join(__dirname, 'rank1_snippet.png');
        await finalLocator.screenshot({ path: imagePath });

        console.log('Running OCR processing with Tesseract.js...');
        const worker = await Tesseract.createWorker('eng');
        const { data: { text } } = await worker.recognize(imagePath);
        await worker.terminate();

        console.log('\n--- Raw OCR Text Output ---');
        console.log(text.trim());
        console.log('---------------------------\n');

        // Parse out text lines. Clean extra whitespace or empty lines.
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Dynamic extraction logic based on the text layout returned by OCR
        let heroName = "Unknown";
        let winRate = "N/A";
        let pickRate = "N/A";

        // Regex to match typical percentage tokens (e.g., "54.15%")
        const percentRegex = /\d+(?:\.\d+)?%/;

        // Filter elements containing numbers/percentages vs alphabetical characters
        const percentages = lines.filter(l => percentRegex.test(l));
        const textNames = lines.filter(l => !percentRegex.test(l) && isNaN(parseInt(l)));

        if (textNames.length > 0) {
            // The hero name is usually the prominent text field found inside the row line array
            heroName = textNames[0];
        }

        if (percentages.length >= 2) {
            // The first percentage indicator usually maps to Pick/Win Rate depending on the table order
            winRate = percentages[0];
            pickRate = percentages[1];
        }

        // Prepare CSV formatting layout
        const csvPath = path.join(__dirname, 'mlbb_rank1_hero.csv');
        const csvHeader = 'Hero Name,Win Rate,Pick Rate\n';
        const csvRow = `"${heroName}","${winRate}","${pickRate}"\n`;

        // Write file. Creates header if it does not exist, otherwise appends data.
        if (!fs.existsSync(csvPath)) {
            fs.writeFileSync(csvPath, csvHeader + csvRow);
        } else {
            fs.appendFileSync(csvPath, csvRow);
        }

        console.log(`Success! Data successfully saved to: ${csvPath}`);

        // Cleanup screenshot asset
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

    } catch (error) {
        console.error('An error occurred during execution:', error);
    } finally {
        await browser.close();
        console.log('Browser session closed.');
    }
})();