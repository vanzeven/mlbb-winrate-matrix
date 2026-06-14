import fs from 'fs';
import puppeteer from 'puppeteer';

async function scrapeRankVisible() {
    console.log("🚀 Meluncurkan browser visual (Selenium-style)...");

    // Konfigurasi Browser
    const browser = await puppeteer.launch({
        headless: false, // Menampilkan browser (PENTING!)
        slowMo: 100,      // Melambatkan operasi Puppeteer 100ms agar bisa diikuti mata
        devtools: false,   // Set true jika ingin otomatis membuka Inspect Element
        args: ['--start-maximized'] // Buka browser dalam kondisi full screen
    });

    const page = await browser.newPage();

    // Set viewport mengikuti ukuran layar maximized agar selector tidak meleset
    await page.setViewport({ width: 1920, height: 1080 });

    console.log("🌐 Membuka https://www.mobilelegends.com/rank ...");
    console.log("💡 Silakan perhatikan browser yang terbuka. Jangan ditutup manual.");

    try {
        // Buka websitenya
        await page.goto('https://www.mobilelegends.com/rank', {
            waitUntil: 'networkidle2', // Tunggu sampai jaringan tenang
            timeout: 90000            // Beri waktu muat lebih lama (90 detik)
        });

        // ====================================================================
// KHUSUS HANDLE POP-UP PRIVACY POLICY
// ====================================================================
        console.log("🛡️ Memeriksa apakah ada pop-up Privacy Policy...");

// Kita gunakan class yang kamu temukan tadi sebagai selector utama
        const popupButtonSelector = '.mt-cb-policy-close';

        try {
            // Tunggu sampai tombol silang/close pop-up muncul di layar (maksimal 5 detik)
            await page.waitForSelector(popupButtonSelector, { timeout: 5000 });

            // Klik tombol close tersebut
            await page.click(popupButtonSelector);
            console.log("✅ Pop-up Privacy Policy berhasil ditutup!");

            // Kasih jeda 1,5 detik agar animasi pop-up menghilang selesai sempurna
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (e) {
            // Jika tidak muncul dalam 5 detik, berasumsi pop-up sudah aman/tidak ada
            console.log("ℹ️ Pop-up tidak muncul. Lanjut ke proses scraping tabel...");
        }
// ====================================================================

        console.log("⏳ Memberi jeda agar konten tabel termuat...");

        // Tidak lagi menunggu selector .rank-list; cukup beri jeda agar
        // konten dan animasi loading internal selesai dimuat.
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log("🔍 Memulai ekstraksi data dari HTML DOM...");

        // Mengekstrak data langsung dari elemen HTML
        const heroRows = await page.evaluate(() => {
            // Selector untuk SETIAP BARIS HERO (tr di dalam tbody rank-list)
            const rows = document.querySelectorAll('.rank-list tbody tr');
            const data = [];

            rows.forEach(row => {
                // Selector berdasarkan inspect element di https://www.mobilelegends.com/rank
                const nameEl = row.querySelector('.hero-name p'); // Nama hero ada di dalam p

                // Di struktur tabel Moonton:
                // TD ke-1: Ranking
                // TD ke-2: Hero (Icon & Name)
                // TD ke-3: Win Rate
                // TD ke-4: Use Rate (Pick Rate)
                // TD ke-5: Ban Rate
                const stats = row.querySelectorAll('td');

                if (nameEl && stats.length >= 4) {
                    data.push({
                        name: nameEl.innerText.trim(),
                        win_rate: stats[2]?.innerText.trim() || '0%', // TD index 2
                        pick_rate: stats[3]?.innerText.trim() || '0%' // TD index 3
                    });
                }
            });
            return data;
        });

        console.log(`📦 Berhasil mengambil ${heroRows.length} hero.`);

        // Simpan ke CSV
        if (heroRows.length > 0) {
            saveToCSV(heroRows);
        } else {
            throw new Error("Gagal mengambil data dari HTML DOM. Selector mungkin salah.");
        }

    } catch (error) {
        console.error("❌ Terjadi kesalahan:", error.message);
        console.log("💡 Jika browser terbuka tapi gagal, kemungkinan ada pop-up/iklan yang menghalangi tabel atau selector .rank-list tbody tr sudah berubah.");
    } finally {
        // Beri waktu 5 detik sebelum menutup browser agar kamu bisa melihat hasil akhirnya
        console.log("⏳ Menutup browser dalam 5 detik...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        await browser.close();
        console.log("🔒 Browser ditutup.");
    }
}

function saveToCSV(heroes) {
    // Header CSV sesuai request: ID ditiadakan karena dari DOM HTML susah dapet ID murni
    let csvContent = "Hero Name,Win Rate,Pick Rate\n";

    heroes.forEach(hero => {
        // Escape names containing commas
        const cleanName = hero.name.includes(',') ? `"${hero.name}"` : hero.name;
        csvContent += `${cleanName},${hero.win_rate},${hero.pick_rate}\n`;
    });

    fs.writeFileSync('data_hero.csv', csvContent, 'utf8');
    console.log("✅ File data_hero.csv berhasil diperbarui!");
}

// Jalankan Scraper Visual
scrapeRankVisible();