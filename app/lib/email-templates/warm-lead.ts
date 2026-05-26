interface WarmLeadTemplateInput {
  customerName: string;
  phone: string;
  state?: string;
  city?: string;
  cartSummary: { variety: string; weightKg: number; quantity: number }[];
  totalAmount: number;
  shippingFee?: number;
  packingFee?: number;
  scoreBadge: string;
  score: number;
  timestamp: string;
}

export function renderWarmLeadTemplate(data: WarmLeadTemplateInput): string {
  const cleanPhone = data.phone.replace(/\D/g, "");
  const waLink = `https://wa.me/91${cleanPhone.slice(-10)}`; // Indian mobile number WhatsApp format
  const telLink = `tel:${data.phone}`;

  const itemsHtml = data.cartSummary && data.cartSummary.length > 0
    ? data.cartSummary.map(item => `
        <div style="padding: 6px 0; border-bottom: 1px dashed #e1dfd7; font-size: 14px;">
          <strong>${item.variety} (${item.weightKg}KG)</strong> &times; ${item.quantity}
        </div>
      `).join("")
    : `<div style="font-size: 14px; color: #666666;">No items in cart</div>`;

  return `
    <div>
      <p style="font-size: 16px; line-height: 1.5; margin-top: 0;">
        A potential customer started checkout but closed the form before the payment step.
      </p>

      <!-- Lead Score Badge -->
      <div style="margin-bottom: 24px;">
        <span style="font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 4px; background-color: #f1efe6; color: #E65100; border: 1px solid #e1dfd7;">
          INTENT RATING: ${data.scoreBadge} (${data.score}/180 PTS)
        </span>
      </div>

      <!-- Customer Card -->
      <h3 class="section-title">Customer Contact Details</h3>
      <div class="card">
        <div class="card-row">
          <span class="card-label">👤 Name:</span>
          <strong>${data.customerName || "Anonymous Lead"}</strong>
        </div>
        <div class="card-row">
          <span class="card-label">📞 Phone:</span>
          <span class="phone-highlight">${data.phone}</span>
        </div>
        <div class="card-row">
          <span class="card-label">📍 Location:</span>
          ${data.city || "Not Provided"}${data.state ? `, ${data.state}` : ""}
        </div>
      </div>

      <!-- Order Snapshot -->
      <h3 class="section-title">Cart Contents</h3>
      <div class="card" style="margin-bottom: 32px;">
        ${itemsHtml}
        ${data.packingFee !== undefined || data.shippingFee !== undefined ? `
          <div style="padding-top: 8px; font-size: 12px; color: #666666; text-align: right;">
            Items Subtotal: <strong>₹${(data.totalAmount - (data.shippingFee || 0) - (data.packingFee || 0)).toLocaleString("en-IN")}</strong>
          </div>
          ${data.packingFee ? `
            <div style="padding-top: 4px; font-size: 12px; color: #666666; text-align: right;">
              Packing Fee: <strong>₹${data.packingFee.toLocaleString("en-IN")}</strong>
            </div>
          ` : ""}
          ${data.shippingFee ? `
            <div style="padding-top: 4px; font-size: 12px; color: #666666; text-align: right;">
              RTC Cargo Shipping: <strong>₹${data.shippingFee.toLocaleString("en-IN")}</strong>
            </div>
          ` : ""}
        ` : ""}
        <div style="padding-top: 12px; font-size: 16px; font-weight: 800; color: #1B330F; text-align: right;">
          Total Amount: <span style="font-size: 20px; color: #DE8A24;">₹${data.totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <h3 class="section-title">Contact Customer Immediately</h3>
      <div style="margin-bottom: 24px;">
        <a href="${telLink}" class="btn btn-green" style="background-color: #2E7D32;">
          📞 CALL CUSTOMER (${data.phone})
        </a>
        <a href="${waLink}" class="btn btn-orange" style="background-color: #DE8A24; color: #ffffff;">
          💬 OPEN WHATSAPP CHAT
        </a>
      </div>

      <div style="font-size: 11px; color: #888888; background-color: #F8F7F2; padding: 12px; border-radius: 8px; border: 1px solid #e1dfd7; margin-top: 24px;">
        <strong>System Note:</strong> Customer closed the modal. This represents medium interest. Follow up quickly to secure the order.
        <br>Captured on: ${data.timestamp}
      </div>
    </div>
  `;
}
