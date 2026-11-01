/**
 * Format number to Vietnamese currency: 1.000.000 VNĐ
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 VNĐ';
  }
  const formatted = new Intl.NumberFormat('vi-VN').format(Math.round(amount));
  return `${formatted} VNĐ`;
}

/**
 * Format Date to DD/MM/YYYY
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format Date for input[type="date"]: YYYY-MM-DD
 */
export function toInputDateFormat(dateInput: string | Date = new Date()): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
