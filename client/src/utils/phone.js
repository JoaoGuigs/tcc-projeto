export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 13);
  // Com DDI (12-13 dígitos, ex.: 5548999990000) → +55 (48) 99999-0000
  if (digits.length > 11) {
    const ddi = digits.length === 13 ? digits.slice(0, 2) : digits.slice(0, digits.length - 11);
    const resto = digits.slice(ddi.length);
    if (resto.length <= 2) return `+${ddi} (${resto}`;
    if (resto.length <= 6) return `+${ddi} (${resto.slice(0, 2)}) ${resto.slice(2)}`;
    if (resto.length <= 10) return `+${ddi} (${resto.slice(0, 2)}) ${resto.slice(2, 6)}-${resto.slice(6)}`;
    return `+${ddi} (${resto.slice(0, 2)}) ${resto.slice(2, 7)}-${resto.slice(7)}`;
  }
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
