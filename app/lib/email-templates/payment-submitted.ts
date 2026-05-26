interface PaymentSubmittedTemplateInput {
  orderNumber: string;
  orderId: string;
  customerName: string;
  phone: string;
  state: string;
  city: string;
  pincode: string;
  rtcDepotName?: string;
  rtcLandmark: string;
  customerNotes?: string | null;
  utr: string;
  submittedAt: string;
  cartSummary: { variety: string; weightKg: number; quantity: number; price?: number }[];
  totalAmount: number;
  shippingFee?: number;
  packingFee?: number;
  scoreBadge: string;
  score: number;
  timestamp: string;
}

export function renderPaymentSubmittedTemplate(data: PaymentSubmittedTemplateInput): string {
  const cleanPhone = data.phone.replace(/\D/g, "");
  const waLink = `https://wa.me/91${cleanPhone.slice(-10)}`;
  const telLink = `tel:${data.phone}`;

  // Build links to admin panel for order verification
  const domain = process.env.NEXT_PUBLIC_APP_URL || "https://pallemamidi.vercel.app";
  // The admin path is /admin in this project.
  const adminVerifyLink = `${domain}/admin`; 
  const adminOrderLink = `${domain}/admin`; 

  const tableRows = data.cartSummary && data.cartSummary.length > 0
    ? data.cartSummary.map(item => {
        const itemPrice = item.price ? `₹${item.price}` : "—";
        return `
          <tr>
            <td class="table-cell" style="font-weight: 600;">${item.variety} (${item.weightKg}KG)</td>
            <td class="table-cell" style="text-align: center;">${item.quantity}</td>
            <td class="table-cell" style="text-align: right;">${itemPrice}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="3" class="table-cell" style="text-align: center; color: #666666;">No items</td></tr>`;

  return `
    <div>
      <!-- Success / Verification Pending Strip -->
      <div style="background-color: #E8F5E9; border-left: 4px solid #2E7D32; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <span style="font-size: 14px; font-weight: 800; color: #2E7D32; display: block; margin-bottom: 4px;">
          🟢 PAYMENT PROOF SUBMITTED
        </span>
        <span style="font-size: 13px; line-height: 1.4; color: #1B5E20; display: block;">
          Customer completed checkout and submitted their UTR. Please verify the transaction in your bank account before dispatching the cargo.
        </span>
      </div>

      <!-- Lead Score Badge -->
      <div style="margin-bottom: 24px;">
        <span style="font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 4px; background-color: #f1efe6; color: #2E7D32; border: 1px solid #e1dfd7;">
          INTENT RATING: ${data.scoreBadge} (${data.score}/180 PTS)
        </span>
      </div>

      <!-- Payment Reference Card -->
      <h3 class="section-title">Payment Information</h3>
      <div class="card" style="border: 2px solid #C8E6C9; background-color: #F1F8E9;">
        <div class="card-row">
          <span class="card-label">🎫 Order No:</span>
          <strong>${data.orderNumber}</strong>
        </div>
        <div class="card-row">
          <span class="card-label">🔢 UTR Number:</span>
          <span style="font-family: monospace; font-size: 18px; font-weight: 800; color: #2E7D32; background-color: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #C8E6C9;">
            ${data.utr}
          </span>
        </div>
        ${data.packingFee !== undefined || data.shippingFee !== undefined ? `
          <div class="card-row" style="font-size: 12px; color: #666666;">
            <span class="card-label">Items Subtotal:</span>
            <span>₹${(data.totalAmount - (data.shippingFee || 0) - (data.packingFee || 0)).toLocaleString("en-IN")}</span>
          </div>
          ${data.packingFee ? `
            <div class="card-row" style="font-size: 12px; color: #666666;">
              <span class="card-label">Packing Fee:</span>
              <span>₹${data.packingFee.toLocaleString("en-IN")}</span>
            </div>
          ` : ""}
          ${data.shippingFee ? `
            <div class="card-row" style="font-size: 12px; color: #666666;">
              <span class="card-label">RTC Cargo Shipping:</span>
              <span>₹${data.shippingFee.toLocaleString("en-IN")}</span>
            </div>
          ` : ""}
        ` : ""}
        <div class="card-row">
          <span class="card-label">💰 Amount Paid:</span>
          <strong style="font-size: 18px; color: #1B330F;">₹${data.totalAmount.toLocaleString("en-IN")}</strong>
        </div>
        <div class="card-row">
          <span class="card-label">⏰ Paid At:</span>
          <span>${data.submittedAt}</span>
        </div>
      </div>

      <!-- Customer Details Card -->
      <h3 class="section-title">Customer Shipping Address</h3>
      <div class="card">
        <div class="card-row">
          <span class="card-label">👤 Buyer:</span>
          <strong>${data.customerName}</strong>
        </div>
        <div class="card-row">
          <span class="card-label">📞 Phone:</span>
          <span class="phone-highlight">${data.phone}</span>
        </div>
        <div class="card-row">
          <span class="card-label">📍 Destination:</span>
          ${data.city}, ${data.state} (PIN: ${data.pincode})
        </div>
        <div class="card-row">
          <span class="card-label">🚌 Depot:</span>
          <strong>${data.rtcDepotName || "Other Depot"}</strong>
        </div>
        <div class="card-row">
          <span class="card-label">🏠 Landmark:</span>
          <em style="color: #666666;">"${data.rtcLandmark}"</em>
        </div>
        ${data.customerNotes ? `
          <div class="card-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e1dfd7;">
            <span class="card-label">📝 Notes:</span>
            <span style="color: #DE8A24; font-weight: 600;">"${data.customerNotes}"</span>
          </div>
        ` : ""}
      </div>

      <!-- Order Table -->
      <h3 class="section-title">Purchased Items</h3>
      <table style="margin-bottom: 32px;">
        <thead>
          <tr class="table-header">
            <th class="table-cell">Variety (Weight)</th>
            <th class="table-cell" style="text-align: center; width: 80px;">Qty</th>
            <th class="table-cell" style="text-align: right; width: 100px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          ${data.packingFee !== undefined || data.shippingFee !== undefined ? `
            <tr>
              <td colspan="2" class="table-cell" style="font-size: 13px; color: #666666; border-bottom: none; text-align: right; padding-top: 10px;">Items Subtotal:</td>
              <td class="table-cell" style="font-size: 13px; color: #666666; border-bottom: none; text-align: right; padding-top: 10px;">₹${(data.totalAmount - (data.shippingFee || 0) - (data.packingFee || 0)).toLocaleString("en-IN")}</td>
            </tr>
            ${data.packingFee ? `
              <tr>
                <td colspan="2" class="table-cell" style="font-size: 13px; color: #666666; border-bottom: none; text-align: right; padding-top: 4px;">Packing Fee:</td>
                <td class="table-cell" style="font-size: 13px; color: #666666; border-bottom: none; text-align: right; padding-top: 4px;">₹${data.packingFee.toLocaleString("en-IN")}</td>
              </tr>
            ` : ""}
            ${data.shippingFee ? `
              <tr>
                <td colspan="2" class="table-cell" style="font-size: 13px; color: #666666; border-bottom: none; text-align: right; padding-top: 4px;">RTC Cargo Shipping:</td>
                <td class="table-cell" style="font-size: 13px; color: #666666; border-bottom: none; text-align: right; padding-top: 4px;">₹${data.shippingFee.toLocaleString("en-IN")}</td>
              </tr>
            ` : ""}
          ` : ""}
          <tr>
            <td colspan="2" class="table-cell" style="font-weight: 800; font-size: 15px; border-bottom: none; text-align: right; padding-top: 15px;">TOTAL AMOUNT PAID:</td>
            <td class="table-cell" style="font-weight: 800; font-size: 18px; color: #2E7D32; border-bottom: none; text-align: right; padding-top: 15px;">₹${data.totalAmount.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      <!-- Admin Actions -->
      <h3 class="section-title">Admin Operational Actions</h3>
      <div style="margin-bottom: 24px;">
        <a href="${adminVerifyLink}" class="btn btn-green" style="background-color: #2E7D32;">
          ✅ VERIFY PAYMENT IN ADMIN PANEL
        </a>
        <a href="${telLink}" class="btn btn-orange" style="background-color: #DE8A24; color: #ffffff;">
          📞 CALL CUSTOMER (${data.phone})
        </a>
        <a href="${waLink}" class="btn" style="background-color: #3F6322; color: #ffffff;">
          💬 WHATSAPP CHAT
        </a>
      </div>

      <div style="font-size: 10px; color: #888888; margin-top: 24px; text-align: right;">
        Submitted on: ${data.timestamp}
      </div>
    </div>
  `;
}
