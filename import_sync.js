const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'bookshop.db');
// Support both product.csv and products.csv names
let csvPath = path.join(__dirname, 'products.csv');
if (!fs.existsSync(csvPath)) {
  csvPath = path.join(__dirname, 'product.csv');
}

if (!fs.existsSync(csvPath)) {
  console.log('\n❌ Error: Neither product.csv nor products.csv was found!');
  console.log('Please copy your product CSV file into the bookshop-erp folder and name it "product.csv".\n');
  process.exit(1);
}

console.log(`📖 Reading CSV file: ${path.basename(csvPath)}...`);
const csvContent = fs.readFileSync(csvPath, 'utf8');

// basic quote-aware CSV line parser
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

const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('title') || h.includes('product'));
const barcodeIdx = headers.findIndex(h => h.includes('barcode') || h.includes('code') || h.includes('sku') || h.includes('isbn'));
const sellingPriceIdx = headers.findIndex(h => h.includes('selling') || h.includes('price') || h.includes('retail'));
const costPriceIdx = headers.findIndex(h => h.includes('cost') || h.includes('buy') || h.includes('purchase'));
const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('group') || h.includes('type'));
const quantityIdx = headers.findIndex(h => h.includes('quantity') || h.includes('stock') || h.includes('qty'));

if (nameIdx === -1) {
  console.error('❌ Error: Could not find a product Name or Title column in your CSV.');
  process.exit(1);
}

const db = new Database(dbPath);
console.log('📂 Connected to database:', dbPath);

// Fetch branches to seed inventory
const branches = db.prepare('SELECT id FROM branches').all();
console.log(`🏢 Found ${branches.length} active branches for stock initialization.`);

// Prepare statements
const getBookByBarcode = db.prepare('SELECT id, barcode FROM books WHERE barcode = ?');
const getBookByIsbn = db.prepare('SELECT id, isbn FROM books WHERE isbn = ?');

const insertBook = db.prepare(`
  INSERT INTO books (id, isbn, barcode, title, author, publisher, category, description, cost_price, selling_price, image_url, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateBook = db.prepare(`
  UPDATE books 
  SET title = ?, category = ?, cost_price = ?, selling_price = ?, updated_at = ?
  WHERE id = ?
`);

const deleteBook = db.prepare('DELETE FROM books WHERE id = ?');
const deleteInventoryByBookId = db.prepare('DELETE FROM branch_inventory WHERE book_id = ?');

const insertInventory = db.prepare(`
  INSERT INTO branch_inventory (id, book_id, branch_id, quantity, reorder_level, last_restocked)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const updateInventory = db.prepare(`
  UPDATE branch_inventory 
  SET quantity = ?, last_restocked = ?
  WHERE book_id = ? AND branch_id = ?
`);

const checkInventoryExists = db.prepare(`
  SELECT id FROM branch_inventory WHERE book_id = ? AND branch_id = ?
`);

try {
  const csvBarcodes = new Set();
  let insertedCount = 0;
  let updatedCount = 0;

  db.transaction(() => {
    // 1. Process all products from CSV
    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      if (row.length < headers.length) continue;

      const rawTitle = row[nameIdx] || 'Unnamed Product';
      const title = rawTitle.replace(/^"|"$/g, '');
      const barcode = barcodeIdx !== -1 && row[barcodeIdx] ? row[barcodeIdx].replace(/^"|"$/g, '') : '';
      
      if (!barcode) {
        // Skip rows without barcode
        continue;
      }
      
      csvBarcodes.add(barcode);

      const category = categoryIdx !== -1 && row[categoryIdx] ? (row[categoryIdx].replace(/^"|"$/g, '') || 'General') : 'General';
      
      const rawCost = costPriceIdx !== -1 ? parseFloat(row[costPriceIdx]) : 0;
      const cost_price = isNaN(rawCost) ? 0 : rawCost;
      
      const rawSelling = sellingPriceIdx !== -1 ? parseFloat(row[sellingPriceIdx]) : 0;
      const selling_price = isNaN(rawSelling) ? 0 : rawSelling;
      
      const rawQty = quantityIdx !== -1 ? parseFloat(row[quantityIdx]) : 0;
      const quantity = isNaN(rawQty) ? 0 : Math.round(rawQty);

      const now = new Date().toISOString();

      // Check if book already exists in DB
      let existingBook = getBookByBarcode.get(barcode);
      if (!existingBook) {
        existingBook = getBookByIsbn.get(barcode);
      }

      let bookId;
      if (existingBook) {
        // Book exists, update details
        bookId = existingBook.id;
        updateBook.run(title, category, cost_price, selling_price, now, bookId);
        updatedCount++;
      } else {
        // Book does not exist, insert new book
        bookId = `book_${Date.now()}_${i}`;
        insertBook.run(bookId, barcode, barcode, title, 'Imported', 'Aronium POS', category, 'Imported from Aronium CSV.', cost_price, selling_price, '', now, now);
        insertedCount++;
      }

      // Update or insert inventory stock counts for all branches
      branches.forEach(branch => {
        const invExists = checkInventoryExists.get(bookId, branch.id);
        if (invExists) {
          // Update actual count
          updateInventory.run(quantity, now, bookId, branch.id);
        } else {
          // Insert new inventory record
          const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          insertInventory.run(invId, bookId, branch.id, quantity, 5, now);
        }
      });
    }

    // 2. Identify and delete books NOT in CSV
    console.log('🧹 Scanning database for products to remove...');
    const allDbBooks = db.prepare('SELECT id, barcode, title FROM books').all();
    let deletedCount = 0;

    allDbBooks.forEach(dbBook => {
      // If the book barcode/ISBN from DB is not in the CSV barcodes set, delete it
      if (!csvBarcodes.has(dbBook.barcode) && !csvBarcodes.has(dbBook.id)) {
        deleteInventoryByBookId.run(dbBook.id);
        deleteBook.run(dbBook.id);
        deletedCount++;
      }
    });

    console.log('\n--- Sync Results ---');
    console.log(`🆕 New products added: ${insertedCount}`);
    console.log(`🔄 Existing products updated: ${updatedCount}`);
    console.log(`🗑️ Old products removed: ${deletedCount}`);
    console.log('--------------------');
  })();

  console.log('✅ Synchronization completed successfully.');
} catch (err) {
  console.error('❌ Sync transaction failed:', err.message);
}
