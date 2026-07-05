import fs from "fs";
import { chromium } from 'playwright'; // Menggunakan Playwright
import { createWorker } from 'tesseract.js';

async function scrapeOCRKeCSV() {
    console.log("1. Membuka browser...");
    // Di Playwright, kita pakai chromium (atau firefox/webkit)
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1000 }
    });
    const page = await context.newPage();

    console.log("2. Menuju website...");
    // Di Playwright, 'networkidle2' diganti menjadi 'networkidle'
    await page.goto('https://www.mobilelegends.com/rank', { waitUntil: 'networkidle' });

    console.log("⚠️  SILAKAN CLOSE POP-UP / COOKIE SEKARANG!");
    console.log("⏳ Menunggu kamu merapikan layar (10 detik)...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log("📸 3. Cekrek! Mengambil screenshot...");
    await page.screenshot({ path: 'halaman_rank.png' });
    await browser.close();

    console.log("🧠 4. Memulai kecerdasan buatan (OCR)...");

    try {
        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize('halaman_rank.png');
        await worker.terminate();

        const barisTeks = text.split('\n');
        const indexHero = barisTeks.findIndex(line => line.toUpperCase().includes('HERO'));

        if (indexHero !== -1) {
            console.log("\n🔍 Menyaring data kotor dan membuat CSV...");

            let csvContent = "Raw Data\n";
            let totalHeroTerfilter = 0;

            const barisSetelahHero = barisTeks.slice(indexHero + 1);

            barisSetelahHero.forEach(baris => {
                const barisBersih = baris.trim();

                if (barisBersih.length > 10 && barisBersih.includes('%')) {
                    const dataAmanUntukCsv = barisBersih.replace(/,/g, ' ');
                    csvContent += `"${dataAmanUntukCsv}"\n`;
                    totalHeroTerfilter++;
                    console.log(`✅ Lolos Filter: ${dataAmanUntukCsv}`);
                }
            });

            const namaFileCsv = 'data_hero_ocr.csv';
            fs.writeFileSync(namaFileCsv, csvContent, 'utf8');

            console.log("\n====================================");
            console.log(`🎉 BERHASIL! Menemukan ${totalHeroTerfilter} baris valid.`);
            console.log(`📁 Data disimpan di: ./${namaFileCsv}`);
            console.log("====================================\n");

        } else {
            console.log("❌ Kata 'HERO' tidak ditemukan pada gambar.");
        }

    } catch (ocrError) {
        console.error("❌ Gagal membaca gambar:", ocrError.message);
    }
}

scrapeOCRKeCSV();