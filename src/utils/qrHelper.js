import crypto from 'crypto';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const qrDir = path.join(__dirname, '../../uploads/qr');

if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}

export const QR_PREFIX = 'SOCIETY-VIS:';

export function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

export function parseQRData(scanned) {
  const trimmed = (scanned || '').trim();
  if (trimmed.startsWith(QR_PREFIX)) {
    return trimmed.slice(QR_PREFIX.length);
  }
  return trimmed;
}

export async function generateVisitorQR(token, label = 'visitor') {
  const qrData = `${QR_PREFIX}${token}`;
  const filename = `${label}-${token}.png`;
  const filepath = path.join(qrDir, filename);
  await QRCode.toFile(filepath, qrData, { width: 320, margin: 2, errorCorrectionLevel: 'M' });
  return `/uploads/qr/${filename}`;
}

export function buildWhatsAppShareUrl(mobile, message) {
  const digits = (mobile || '').replace(/\D/g, '');
  const phone = digits.length === 10 ? `91${digits}` : digits;
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${text}`;
}
