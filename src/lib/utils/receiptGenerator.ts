import type { Sale, SaleItem, Book, Branch } from '@/types';

interface ReceiptGeneratorOptions {
  saleId: string;
  customer: { name: string; email: string; phone: string };
  paymentMethod: 'cash' | 'card' | 'mobile' | 'credit';
  summary: { subtotal: number; discount: number; tax: number; total: number };
  items: any[];
  branchName: string;
  settings: Record<string, any>;
}

export function generateReceiptHtml({
  saleId,
  customer,
  paymentMethod,
  summary,
  items,
  branchName,
  settings,
}: ReceiptGeneratorOptions): string {
  const template = settings.receiptTemplate || 'classic';
  const fontFace = settings.receiptFont || 'monospace';
  const fontSize = settings.receiptFontSize || '12';
  const headerMessage = settings.receiptHeader || 'BookShop ERP - Your Reading Destination';
  const footerMessage = settings.receiptFooter || 'Thank you for shopping with us!';
  const showLogo = settings.showLogo !== false;
  const showBarcode = settings.receiptShowBarcode !== false;
  const showCashier = settings.receiptShowCashier !== false;

  const fontStyle = 
    fontFace === 'sans' ? "font-family: 'Inter', 'Helvetica Neue', sans-serif;" :
    fontFace === 'serif' ? "font-family: 'Georgia', 'Times New Roman', serif;" :
    "font-family: 'Courier New', Courier, monospace;";

  // Layout templates style mapping
  let layoutStyles = '';
  let logoHtml = '';
  let borderStyle = 'border-top: 1px dashed #000;';
  
  if (template === 'modern') {
    layoutStyles = `
      body { color: #1e293b; background: #fff; padding: 20px; max-width: 380px; margin: 0 auto; line-height: 1.5; }
      h2 { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; text-align: center; }
      .separator { border-top: 1px solid #e2e8f0; margin: 12px 0; }
      .row { display: flex; justify-content: space-between; margin: 4px 0; }
      .total-row { font-size: 16px; font-weight: 800; color: #4f46e5; border-top: 2px solid #e2e8f0; padding-top: 8px; margin-top: 8px; }
      .small { font-size: 11px; color: #64748b; }
      .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #64748b; }
    `;
    borderStyle = 'border-top: 1px solid #e2e8f0;';
    if (showLogo) {
      logoHtml = `
        <div style="text-align: center; margin-bottom: 12px;">
          <div style="display: inline-block; width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; line-height: 44px; font-size: 20px; font-weight: 800; font-family: 'Inter', sans-serif;">B</div>
        </div>
      `;
    }
  } else if (template === 'elegant') {
    layoutStyles = `
      body { color: #2d3748; background: #fff; padding: 24px; max-width: 400px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
      h2 { font-size: 22px; font-weight: 600; font-style: italic; color: #1a202c; text-align: center; margin-bottom: 6px; }
      .separator { border-top: 1px double #cbd5e1; margin: 12px 0; }
      .row { display: flex; justify-content: space-between; margin: 5px 0; }
      .total-row { font-size: 16px; font-weight: 700; border-top: 1px double #000; border-bottom: 1px double #000; padding: 6px 0; margin-top: 8px; }
      .small { font-size: 11px; color: #4a5568; }
      .footer { text-align: center; margin-top: 30px; font-size: 11px; font-style: italic; color: #718096; }
    `;
    borderStyle = 'border-top: 1px double #cbd5e1;';
    if (showLogo) {
      logoHtml = `
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="font-size: 28px; font-style: italic; font-weight: 300; border-bottom: 1px solid #2d3748; padding-bottom: 4px;">~ B ~</span>
        </div>
      `;
    }
  } else if (template === 'retro') {
    layoutStyles = `
      body { color: #3b2314; background: #fdfaf7; padding: 18px; max-width: 320px; margin: 0 auto; }
      h2 { font-size: 20px; font-weight: bold; color: #5c3e21; text-align: center; letter-spacing: -0.5px; }
      .separator { border-top: 1px dashed #b8a38d; margin: 10px 0; }
      .row { display: flex; justify-content: space-between; margin: 4px 0; }
      .total-row { font-size: 15px; font-weight: bold; color: #8c2d19; }
      .small { font-size: 10px; color: #8c7355; }
      .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #8c7355; border-top: 1px dashed #b8a38d; padding-top: 8px; }
    `;
    borderStyle = 'border-top: 1px dashed #b8a38d;';
    if (showLogo) {
      logoHtml = `
        <div style="text-align: center; margin-bottom: 8px; font-size: 18px;">📖</div>
      `;
    }
  } else {
    // Default Classic Thermal
    layoutStyles = `
      body { font-size: ${fontSize}px; color: #000; padding: 12px; max-width: 300px; margin: 0 auto; line-height: 1.3; }
      h2 { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 4px; }
      .center { text-align: center; }
      .separator { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; margin: 3px 0; }
      .row .left { max-width: 170px; }
      .row .right { text-align: right; white-space: nowrap; }
      .total-row { font-size: 14px; font-weight: bold; }
      .small { font-size: 10px; color: #444; }
      .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #444; }
    `;
    if (showLogo) {
      logoHtml = `
        <div style="text-align: center; font-size: 20px; margin-bottom: 4px;">[B]</div>
      `;
    }
  }

  const barcodeHtml = showBarcode 
    ? `<div style="text-align: center; margin-top: 16px; margin-bottom: 8px;">
         <div style="font-family: 'Libre Barcode 39', 'Courier New', monospace; font-size: 32px; letter-spacing: 2px;">*${saleId.slice(-8).toUpperCase()}*</div>
         <div style="font-size: 9px; color: #777;">* ${saleId.toUpperCase()} *</div>
       </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt #${saleId.slice(-8).toUpperCase()}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Libre+Barcode+39&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ${layoutStyles}
        body { ${fontStyle} font-size: ${fontSize}px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .text-right { text-align: right; }
      </style>
    </head>
    <body>
      ${logoHtml}
      <h2>${settings.storeName || 'BookShop ERP'}</h2>
      <p class="center small">${headerMessage}</p>
      <p class="center small">${branchName}</p>
      <p class="center small">${new Date().toLocaleString()}</p>
      
      <div class="separator"></div>
      
      <div class="row"><span>Invoice #</span><strong style="text-transform: uppercase;">${saleId.slice(-8).toUpperCase()}</strong></div>
      ${customer.name ? `<div class="row"><span>Customer</span><span>${customer.name}</span></div>` : ''}
      ${customer.phone ? `<div class="row"><span>Phone</span><span>${customer.phone}</span></div>` : ''}
      <div class="row"><span>Payment</span><span style="text-transform: capitalize;">${paymentMethod}</span></div>
      ${showCashier ? `<div class="row"><span>Cashier</span><span>Active Terminal</span></div>` : ''}
      
      <div class="separator"></div>
      
      <div class="row bold small">
        <span>ITEM</span>
        <span>QTY x PRICE = TOTAL</span>
      </div>
      <div class="separator"></div>
      
      ${items.map(item => {
        const title = item.book?.title || 'Unknown Book';
        const truncatedTitle = title.substring(0, 22) + (title.length > 22 ? '...' : '');
        const qtyString = `${item.quantity} x Rs. ${item.unit_price.toFixed(2)}`;
        const lineTotal = (item.quantity * item.unit_price) - item.discount;
        return `
          <div class="row">
            <span style="font-weight: 500;">${truncatedTitle}</span>
            <span>Rs. ${lineTotal.toFixed(2)}</span>
          </div>
          <div class="row small" style="margin-top: -2px; margin-bottom: 4px; padding-left: 8px;">
            <span>${qtyString}</span>
            ${item.discount > 0 ? `<span style="color: #ef4444;">(Disc: -Rs. ${item.discount.toFixed(2)})</span>` : ''}
          </div>
        `;
      }).join('')}
      
      <div class="separator"></div>
      
      <div class="row"><span>Subtotal</span><span>Rs. ${summary.subtotal.toFixed(2)}</span></div>
      ${summary.discount > 0 ? `<div class="row" style="color: #ef4444;"><span>Discount</span><span>-Rs. ${summary.discount.toFixed(2)}</span></div>` : ''}
      <div class="row"><span>Tax (5%)</span><span>Rs. ${summary.tax.toFixed(2)}</span></div>
      
      <div class="separator"></div>
      
      <div class="row total-row">
        <span>TOTAL</span>
        <span>Rs. ${summary.total.toFixed(2)}</span>
      </div>
      
      ${barcodeHtml}
      
      <div class="footer">
        <p>${footerMessage}</p>
      </div>
    </body>
    </html>
  `;
}
export default generateReceiptHtml;
