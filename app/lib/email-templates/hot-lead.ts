interface HotLeadTemplateInput {
  customerName: string;
  phone: string;
  state: string;
  city: string;
  pincode: string;
  rtcDepotName?: string;
  rtcLandmark: string;
  customerNotes?: string | null;
  cartSummary: { variety: string; weightKg: number; quantity: number; price?: number }[];
  totalAmount: number;
  shippingFee?: number;
  packingFee?: number;
  scoreBadge: string;
  score: number;
  timestamp: string;
}

export function renderHotLeadTemplate(data: HotLeadTemplateInput): string {
  const cleanPhone = data.phone.replace(/\D/g, "");
  const waLink = `https://wa.me/91${cleanPhone.slice(-10)}`;
  const telLink = `tel:${data.phone}`;

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
      <!-- High Purchase Intent Alert Strip -->
      <div style="background-color: #FFF3E0; border-left: 4px solid #E65100; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <span style="font-size: 14px; font-weight: 800; color: #E65100; display: block; margin-bottom: 4px;">
          🔥 HIGH PURCHASE INTENT
        </span>
        <span style="font-size: 13px; line-height: 1.4; color: #5D4037; display: block;">
          Customer completed shipping verification and reached payment instructions, but has not submitted the 12-digit UTR yet.
        </span>
      </div>

      <!-- Lead Score Badge -->
      <div style="margin-bottom: 24px;">
        <span style="font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 4px; background-color: #f1efe6; color: #DE8A24; border: 1px solid #e1dfd7;">
          INTENT RATING: ${data.scoreBadge} (${data.score}/180 PTS)
        </span>
      </div>

      <!-- Customer Card -->
      <h3 class="section-title">Delivery & Contact Details</h3>
      <div class="card">
        <div class="card-row">
          <span class="card-label">👤 Name:</span>
          <strong>${data.customerName}</strong>
        </div>
        <div class="card-row">
          <span class="card-label">📞 Phone:</span>
          <span class="phone-highlight">${data.phone}</span>
        </div>
        <div class="card-row">
          <span class="card-label">📍 City:</span>
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

      <!-- Order Details -->
      <h3 class="section-title">Order Summary</h3>
      <table style="margin-bottom: 20px;">
        <thead>
          <tr class="table-header">
            <th class="table-cell">Variety (Weight)</th>
            <th class="table-cell" style="text-align: center; width: 80px;">Qty</th>
            <th class="table-cell" style="text-align: right; width: 100px;">Est. Price</th>
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
            <td colspan="2" class="table-cell" style="font-weight: 800; font-size: 15px; border-bottom: none; text-align: right; padding-top: 15px;">TOTAL AMOUNT:</td>
            <td class="table-cell" style="font-weight: 800; font-size: 18px; color: #DE8A24; border-bottom: none; text-align: right; padding-top: 15px;">₹${data.totalAmount.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      <!-- Action Buttons -->
      <h3 class="section-title">Sales Actions</h3>
      <div style="margin-bottom: 24px;">
        <a href="${telLink}" class="btn btn-green" style="background-color: #2E7D32; font-size: 16px;">
          📞 CALL CUSTOMER (${data.phone})
        </a>
        <a href="${waLink}" class="btn btn-orange" style="background-color: #DE8A24; color: #ffffff;">
          💬 CHAT ON WHATSAPP
        </a>
      </div>

      <div style="background-color: #E8F5E9; border: 1px solid #C8E6C9; padding: 14px; border-radius: 8px; font-size: 13px; color: #2E7D32; font-weight: 600; line-height: 1.4;">
        💡 <strong>Sales Conversion Pro Tip:</strong>
        Contact this customer within 10 minutes! Offer to assist with the UPI transfer or verify their shipment details to close this sale.
      </div>
      <div style="font-size: 10px; color: #888888; margin-top: 16px; text-align: right;">
        Captured on: ${data.timestamp}
      </div>
    </div>
  `;
}
