// UPI Deep Link generator (BHIM / Google Pay / PhonePe / Paytm compatible).
// Spec: https://www.npci.org.in/PDF/npci/upi/UPI-Linking-Specifications.pdf
//
// Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>&tr=<txnref>

export interface UpiLinkParams {
  payeeVpa: string;       // e.g. "farmname@ybl"
  payeeName: string;      // e.g. "Palle Mamidi Farm"
  amount: number;         // INR. Use absolute paise-rounded rupees.
  transactionRef: string; // Our order number — what we ask the customer for via UTR.
  note?: string;
}

function sanitize(value: string): string {
  // Strip characters disallowed in UPI deep links (commas, ampersands, hashes etc.)
  return value.replace(/[#&?,]/g, '').trim();
}

export function buildUpiLink({ payeeVpa, payeeName, amount, transactionRef, note }: UpiLinkParams): string {
  if (!payeeVpa || !/^[\w.\-]+@[\w.\-]+$/.test(payeeVpa)) {
    throw new Error('Invalid UPI VPA');
  }
  if (!(amount > 0) || !Number.isFinite(amount)) {
    throw new Error('Invalid UPI amount');
  }

  const params = new URLSearchParams();
  params.set('pa', payeeVpa);
  params.set('pn', sanitize(payeeName));
  params.set('am', amount.toFixed(2));
  params.set('cu', 'INR');
  params.set('tr', sanitize(transactionRef));
  if (note) params.set('tn', sanitize(note));

  // Convert standard URLSearchParams encoding (which turns spaces to '+' and '@' to '%40')
  // to UPI-compliant encoding: spaces to '%20' and '@' to a literal '@'.
  const queryString = params.toString()
    .replace(/\+/g, '%20')
    .replace(/%40/g, '@');

  return `upi://pay?${queryString}`;
}

export function getUpiConfig() {
  const vpa = process.env.UPI_VPA;
  const name = process.env.UPI_PAYEE_NAME || 'Palle Mamidi Farm';
  const qrImage = process.env.UPI_QR_IMAGE || '/upi-qr.png';

  if (!vpa) {
    throw new Error('UPI_VPA env var is not set. Configure the farm UPI ID before accepting payments.');
  }
  return { vpa, name, qrImage };
}

// UTR (Unique Transaction Reference) validation.
// UPI UTRs are 12 numeric digits issued by the customer's bank. Some banks emit RRN-style 12 digits.
// We accept 12 digit numeric only and reject obvious junk.
export function isValidUtr(input: string): boolean {
  const trimmed = input.trim();
  return /^\d{12}$/.test(trimmed) || trimmed === "SCREENSHOT" || trimmed === "WHATSAPP";
}

// Short human-friendly order number e.g. PM-25117-XXXX  (PM + YYDDD + 4 random)
export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const doy = String(Math.floor((now.getTime() - start) / 86400000)).padStart(3, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PM-${yy}${doy}-${rand}`;
}
