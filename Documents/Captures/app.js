function parseCurrencyToNumber(text) {
    if (!text) return 0;
    const cleaned = String(text)
        .replace(/[^0-9.,-]/g, '')
        .replace(/,(?=\d{3}(\D|$))/g, '')
        .replace(/,/g, '.');
    const value = parseFloat(cleaned);
    return Number.isFinite(value) ? value : 0;
}

function parseDailySalesLines(raw) {
    const lines = String(raw || '')
        .split(/\n|,\s*(?=\d+\s*\w)/g)
        .map(s => s.trim())
        .filter(Boolean);

    const items = [];
    for (const line of lines) {
        // Accept "200 burgers" or "200x burgers" or "200 - burgers"
        const match = line.match(/^(\d+(?:[.,]\d+)?)\s*(?:x|\*)?\s*[-–—:]?\s*(.+)$/i);
        if (match) {
            const qty = parseFloat(match[1].replace(',', '.'));
            const name = match[2].trim();
            if (Number.isFinite(qty) && name) {
                items.push({ name, dailyQty: qty });
            }
            continue;
        }

        // Accept "burgers: 200"
        const alt = line.match(/^(.+?)\s*[:–—-]\s*(\d+(?:[.,]\d+)?)$/);
        if (alt) {
            const name = alt[1].trim();
            const qty = parseFloat(alt[2].replace(',', '.'));
            if (Number.isFinite(qty) && name) {
                items.push({ name, dailyQty: qty });
            }
        }
    }
    return items;
}

function computeWeeklyWithBuffer(items, bufferRate = 0.10) {
    return items.map(item => {
        const weekly = item.dailyQty * 7;
        const withBuffer = Math.ceil(weekly * (1 + bufferRate));
        return { name: item.name, quantity: withBuffer };
    });
}

function formatListLines(items) {
    return items.map(i => `- ${i.name}: ${i.quantity}`).join('\n');
}

function generateList() {
    const businessType = document.getElementById('businessType').value.trim();
    const weeklyRevenue = document.getElementById('weeklyRevenue').value.trim();
    const dailySales = document.getElementById('dailySales').value.trim();

    // Parse but do not display extra text per requirement
    const _revenue = parseCurrencyToNumber(weeklyRevenue);
    const parsedDaily = parseDailySalesLines(dailySales);

    const weekly = computeWeeklyWithBuffer(parsedDaily, 0.10);
    const lines = formatListLines(weekly);

    const output = document.getElementById('output');
    output.textContent = lines;
}

function copyOutput() {
    const output = document.getElementById('output').textContent || '';
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = output;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateBtn').addEventListener('click', generateList);
    document.getElementById('copyBtn').addEventListener('click', copyOutput);

    // Keyboard shortcut: Ctrl+Enter on textarea
    document.getElementById('dailySales').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            generateList();
        }
    });

    // Seed example into inputs for quick test
    if (!location.search.includes('noexample')) {
        document.getElementById('businessType').value = 'Restaurant';
        document.getElementById('weeklyRevenue').value = '$3,000';
        document.getElementById('dailySales').value = '200 burgers, 100 buns, 50 sodas';
    }
});

