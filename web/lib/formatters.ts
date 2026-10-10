
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr || dateStr === "-") return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone || phone === "-") return "-";
  // Convert standard E.164 +919876543210 to +91 98765 43210
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return cleaned.replace(/(\+91)(\d{5})(\d{5})/, "$1 $2 $3");
  }
  return phone;
}

export function formatName(name: string | null | undefined): string {
  if (!name) return "Unknown";
  return name.trim();
}

export function formatOrg(name: string | null | undefined, city: string | null | undefined): string {
  if (!name) return "Unknown Org";
  if (!city) return name;
  return `${name}, ${city}`;
}

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatUnit(value: number | string, unit: string): string {
  if (value == null || value === "") return "-";
  return `${value} ${unit}`;
}
