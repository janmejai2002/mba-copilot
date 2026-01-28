
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

async function fetchTimetable() {
    console.log('🚀 Launching Browser to fetch XLRI Timetable...');
    console.log('NOTE: You will need to login manually when the window opens.');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'] // Start maximized
    });

    const page = await browser.newPage();

    try {
        // 1. Go to Home to trigger Login
        await page.goto('https://erp.xlri.ac.in/home.htm', { waitUntil: 'networkidle2' });

        // 2. Wait for user to login
        // We check if we are redirected to login page, or if we are already in home
        // A simple check is waiting for a dashboard element or the URL strictly matching home.htm (after login)
        // or just giving the user 60 seconds to do their thing.

        console.log('⏳ Waiting for manual login... (Please login in the opened browser window)');

        // Wait until URL contains 'home.htm' AND we see a specific element that indicates logged in state
        // e.g. the "DASHBOARD" menu item or user profile.
        // Based on screenshot, "DASHBOARD" menu text is a good indicator.
        await page.waitForFunction(() => document.body.innerText.includes('Janmejai Singh'), { timeout: 120000 });

        console.log('✅ Login detected! Navigating to Schedule Report...');

        // 3. Navigate to Schedule Report
        await page.goto('https://erp.xlri.ac.in/stu_classScheduleSystemReport.htm', { waitUntil: 'networkidle2' });

        // 4. Handle Form Interaction
        // We need to select the batch. Usually the first option is "Select" and second is the active one.
        // Let's try to select the second option automatically.

        console.log('📋 Configuring report parameters...');

        // Wait for dropdown
        const programSelector = 'select[name="programId"]'; // Guessed selector based on common practices, might need adjustment
        // Actually, let's just inspect the page frames if needed. Assuming standard DOM.
        // We'll try to find any select element if the specific name isn't found.

        await page.waitForSelector('select');

        // Select the first valid option (index 1) which is usually the current active batch
        await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            if (selects.length > 0) {
                const batchSelect = selects[0]; // Assuming first dropdown is Batch
                if (batchSelect.options.length > 1) {
                    batchSelect.selectedIndex = 1; // Select first real option
                    batchSelect.dispatchEvent(new Event('change')); // Trigger change event
                }
            }
        });

        // Set Dates
        // Let's fetch for the next 30 days or current term
        // The inputs likely have specific IDs or names. Based on screenshot "From Date" and "To Date"
        // We can use the labels to find the inputs

        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        const formatDate = (date) => {
            // Format: Jan 05, 2026
            return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        };

        await page.evaluate((from, to) => {
            // Find inputs by scanning labels since we don't know IDs
            // Heuristic: Input following a label containing "From Date"
            // Or simple getElementsByTagName('input') filtering text/date types

            const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
            if (inputs.length >= 2) {
                // usually 0 is something else, 1 and 2 might be dates?
                // In the screenshot, there are 2 prominent date inputs.
                // Let's assume the LAST two visible text inputs are dates or inputs near "Date" label

                // Safer: Try to set value if empty
                inputs[inputs.length - 2].value = from;
                inputs[inputs.length - 1].value = to;
            }
        }, formatDate(today), formatDate(nextMonth));

        console.log('🖱️ Clicking Submit...');

        // Click Submit - Look for a button with text "Submit"
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
            const submitBtn = buttons.find(b => b.innerText.includes('Submit') || b.value.includes('Submit'));
            if (submitBtn) submitBtn.click();
        });

        // 5. Wait for Table
        console.log('⏳ Waiting for results...');
        await page.waitForSelector('table', { timeout: 10000 });

        // 6. Scrape Data
        const schedule = await page.evaluate(() => {
            // Find the main data table. It usually has many rows.
            const tables = Array.from(document.querySelectorAll('table'));
            // Sort by number of rows to find the biggest one (likely the schedule)
            const mainTable = tables.sort((a, b) => b.rows.length - a.rows.length)[0];

            if (!mainTable) return [];

            const data = [];
            const rows = Array.from(mainTable.rows); // skip header potentially

            // Naive header detection: assume row 0 is header
            // We'll scrape everything and clean up in the app
            for (let i = 1; i < rows.length; i++) {
                const cells = Array.from(rows[i].cells).map(c => c.innerText.trim());
                if (cells.length > 3) { // Valid row
                    data.push(cells);
                }
            }
            return data;
        });

        console.log(`✅ Extracted ${schedule.length} class entries.`);

        // 7. Save to JSON
        const outputPath = path.join(process.cwd(), 'public', 'timetable.json');
        await fs.writeFile(outputPath, JSON.stringify(schedule, null, 2));

        console.log(`💾 Saved to ${outputPath}`);
        console.log('Closing browser in 5 seconds...');

        await new Promise(r => setTimeout(r, 5000));
        await browser.close();

    } catch (error) {
        console.error('❌ Error:', error);
        // Keep browser open for debugging if failed
        // await browser.close();
    }
}

fetchTimetable();
