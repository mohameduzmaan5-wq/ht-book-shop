const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'bookshop.db');
const csvPath = path.join(__dirname, 'products.csv');

if (!fs.existsSync(csvPath)) {
  console.log('\n❌ Error: products.csv not found!');
  console.log('Please follow these steps to import your Aronium data:');
  console.log('1. Open Aronium, go to Management > Products.');
  console.log('2. Click the "Export" button and save it as a CSV file.');
  console.log('3. Copy the exported file into this project folder (bookshop-erp).');
  console.log('4. Rename the file to "products.csv".');
  console.log('5. Run the command "node import_aronium.js" in your terminal.\n');
  process.exit(1);
}

console.log('📖 Reading products.csv...');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Basic quote-aware CSV line parser
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
if (lines.length < 2) {
  console.error('❌ Error: The CSV file is empty or missing headers.');
  process.exit(1);
}

const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/["']/g, ''));
console.log('Detected CSV Headers:', headers);

// Find matching header columns automatically
const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('title') || h.includes('product'));
const barcodeIdx = headers.findIndex(h => h.includes('barcode') || h.includes('code') || h.includes('sku') || h.includes('isbn'));
const sellingPriceIdx = headers.findIndex(h => h.includes('selling') || h.includes('price') || h.includes('retail'));
const costPriceIdx = headers.findIndex(h => h.includes('cost') || h.includes('buy') || h.includes('purchase'));
const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('group') || h.includes('type'));

if (nameIdx === -1) {
  console.error('❌ Error: Could not find a product Name or Title column in your CSV.');
  process.exit(1);
}

const db = new Database(dbPath);
console.log('📂 Connected to database:', dbPath);

// Fetch branches to seed inventory
const branches = db.prepare('SELECT id FROM branches').all();
console.log(`🏢 Found ${branches.length} active branches for stock initialization.`);

const insertBook = db.prepare(`
  INSERT INTO books (id, isbn, barcode, title, author, publisher, category, description, cost_price, selling_price, image_url, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertInventory = db.prepare(`
  INSERT INTO branch_inventory (id, book_id, branch_id, quantity, reorder_level, last_restocked)
  VALUES (?, ?, ?, ?, ?, ?)
`);

try {
  const runTransaction = db.transaction(() => {
    let importedCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      if (row.length < headers.length) continue;

      const rawTitle = row[nameIdx] || 'Unnamed Product';
      const title = rawTitle.replace(/^"|"$/g, '');
      const barcode = barcodeIdx !== -1 && row[barcodeIdx] ? row[barcodeIdx].replace(/^"|"$/g, '') : `bar_${Date.now()}_${i}`;
      const isbn = barcode;
      const category = categoryIdx !== -1 && row[categoryIdx] ? (row[categoryIdx].replace(/^"|"$/g, '') || 'General') : 'General';
      const rawCost = costPriceIdx !== -1 ? parseFloat(row[costPriceIdx]) : 0;
      const cost_price = isNaN(rawCost) ? 0 : rawCost;
      const rawSelling = sellingPriceIdx !== -1 ? parseFloat(row[sellingPriceIdx]) : 0;
      const selling_price = isNaN(rawSelling) ? 0 : rawSelling;
      const id = `book_${Date.now()}_${i}`;
      const author = 'Imported';
      const publisher = 'Aronium POS';
      const description = 'Imported from Aronium POS data export.';
      const created_at = new Date().toISOString();
      const updated_at = created_at;

      // Insert Book record
      insertBook.run(id, isbn, barcode, title, author, publisher, category, description, cost_price, selling_price, '', created_at, updated_at);

      // Seed stock inventory levels for all active branches
      branches.forEach(branch => {
        const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        insertInventory.run(invId, id, branch.id, 50, 5, created_at); // Sets default stock of 50, reorder point of 5
      });

      importedCount++;
    }
    console.log(`\n🎉 Successfully imported ${importedCount} products into database!`);
  });

  runTransaction();
  console.log('✅ Stock levels successfully initialized at all branches.');
} catch (err) {
  console.error('❌ Database insertion failed:', err.message);
}
