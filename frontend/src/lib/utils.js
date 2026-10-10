// Format currency to Rp format
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
};

// Format date to Indonesian format
export const formatDate = (date, includeTime = false) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const options = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return d.toLocaleDateString('id-ID', options);
};

// Format date short
export const formatDateShort = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Get status badge class
export const getStatusBadgeClass = (status) => {
  const map = {
    'Ordered': 'status-ordered',
    'WH KR': 'status-wh-kr',
    'WH JP': 'status-wh-jp',
    'WH Taiwan': 'status-wh-taiwan',
    'WH Thai': 'status-wh-thai',
    'WH US': 'status-wh-us',
    'Arrived INA': 'status-arrived-ina',
    'Arrived Admin': 'status-arrived-admin',
    'Done CO': 'status-done-co',
    // Payment
    'Unpaid': 'status-unpaid',
    'DP': 'status-dp',
    'Paid': 'status-paid',
  };
  return map[status] || 'badge-gray';
};

// Get status color for badges
export const getPaymentBadgeClass = (status) => {
  const map = {
    'Unpaid': 'badge-danger',
    'DP': 'badge-warning',
    'Paid': 'badge-success',
  };
  return map[status] || 'badge-gray';
};

// Status order sequence
export const STATUS_ORDER = [
  'Ordered',
  'WH KR',
  'WH JP',
  'WH Taiwan',
  'WH Thai',
  'WH US',
  'Arrived INA',
  'Arrived Admin',
  'Done CO',
];

export const PAYMENT_STATUSES = ['Unpaid', 'DP', 'Paid'];

export const WAREHOUSES = ['WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US', 'Indonesia', 'Custom'];

export const PAYMENT_METHODS = ['QRIS', 'Bank Transfer', 'E-Wallet', 'Cash', 'Lainnya'];

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

// Truncate text
export const truncate = (text, length = 30) => {
  if (!text) return '-';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Calculate sisa tagihan
export const calcSisaTagihan = (hargaJual, dp, pelunasan) => {
  const total = (dp || 0) + (pelunasan || 0);
  return Math.max(0, (hargaJual || 0) - total);
};

// Get status index for timeline
export const getStatusIndex = (status) => {
  return STATUS_ORDER.indexOf(status);
};

// Format WhatsApp number for link
export const formatWALink = (number) => {
  if (!number) return '#';
  const cleaned = number.replace(/\D/g, '');
  const formatted = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;
  return `https://wa.me/${formatted}`;
};
