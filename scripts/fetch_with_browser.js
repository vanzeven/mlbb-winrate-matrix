import fs from 'fs';
import puppeteer from 'puppeteer';
import { createWorker } from 'tesseract.js';

async function scrapeOCRKeCSV() {
    console.log("1. Membuka browser...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });

    console.log("2. Menuju website...");
    await page.goto('https://www.mobilelegends.com/rank', { waitUntil: 'networkidle2' });

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

            // 1. Siapkan Header untuk file CSV
            let csvContent = "Raw Data\n";
            let totalHeroTerfilter = 0;

            // Kita ambil baris-baris setelah tulisan "HERO"
            const barisSetelahHero = barisTeks.slice(indexHero + 1);

            barisSetelahHero.forEach(baris => {
                const barisBersih = baris.trim();

                // TRICK FILTER: Kita hanya ambil baris yang panjangnya > 10 karakter
                // DAN mengandung minimal satu tanda persen (%)
                if (barisBersih.length > 10 && barisBersih.includes('%')) {

                    // Ganti tanda koma (,) bawaan teks menjadi spasi agar tidak merusak kolom CSV
                    const dataAmanUntukCsv = barisBersih.replace(/,/g, ' ');

                    // Masukkan ke baris CSV
                    csvContent += `"${dataAmanUntukCsv}"\n`;

                    totalHeroTerfilter++;
                    console.log(`✅ Lolos Filter: ${dataAmanUntukCsv}`);
                }
            });

            // 2. Simpan string CSV di atas menjadi file nyata (.csv)
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