import fs from 'fs';
import puppeteer from 'puppeteer';
import { createWorker } from 'tesseract.js';

async function scrapeDenganMataOCR() {
    console.log("1. Membuka browser...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set ukuran layar agak lebar agar tulisan heronya jelas dan besar
    await page.setViewport({ width: 1280, height: 1000 });

    console.log("2. Menuju website...");
    await page.goto('https://www.mobilelegends.com/rank', { waitUntil: 'networkidle2' });

    // ====================================================================
    // WAKTU KLIK MANUAL
    // ====================================================================
    console.log("⚠️  SILAKAN CLOSE POP-UP / COOKIE SEKARANG!");
    console.log("⏳ Menunggu kamu merapikan layar (10 detik)...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    // ====================================================================

    console.log("📸 3. Cekrek! Mengambil screenshot halaman web...");
    // Puppeteer memoto layar dan menyimpannya jadi file 'halaman_rank.png'
    await page.screenshot({ path: 'halaman_rank.png', fullPage: false });
    console.log("📸 Screenshot berhasil disimpan ke './halaman_rank.png'");

    console.log("🔒 Menutup browser karena tugas matanya sudah selesai...");
    await browser.close();

    // ====================================================================
    // PROSES MEMBACA GAMBAR (OCR)
    // ====================================================================
    console.log("🧠 4. Memulai kecerdasan buatan (OCR) untuk membaca gambar...");

    try {
        // Inisialisasi Tesseract OCR dengan bahasa Inggris ('eng')
        const worker = await createWorker('eng');

        // Perintahkan OCR mengenali teks di dalam gambar hasil screenshot tadi
        const { data: { text } } = await worker.recognize('halaman_rank.png');
        await worker.terminate();

        console.log("\n====================================");
        console.log("👁️ HASIL BACAAN MATA OCR:");
        console.log("====================================");

        // Memecah hasil bacaan gambar per baris teks
        const barisTeks = text.split('\n');

        // Mari kita cari kata "HERO" dan print 5 baris di bawahnya (seperti mata manusia)
        const indexHero = barisTeks.findIndex(line => line.toUpperCase().includes('HERO'));

        if (indexHero !== -1) {
            console.log(`\nKetemu tulisan 'HERO' di baris ke-${indexHero}.`);
            console.log("Menggeser mata ke bawah untuk melihat nama-nama hero:\n");

            // Ambil 5 baris di bawah tulisan HERO
            for (let i = 1; i <= 6; i++) {
                if (barisTeks[indexHero + i]) {
                    console.log(`👉 Baris bawah ke-${i}: ${barisTeks[indexHero + i].trim()}`);
                }
            }
        } else {
            console.log("❌ Mata OCR tidak melihat tulisan 'HERO' di foto tersebut.");
            console.log("Coba kamu buka file 'halaman_rank.png', apakah tabelnya buram atau terpotong?");
        }
        console.log("====================================\n");

    } catch (ocrError) {
        console.error("❌ Gagal membaca gambar:", ocrError.message);
    }
}

scrapeDenganMataOCR();