/** Mantém só dígitos (máx. 8) e aplica a máscara 00000-000. */
export function formatCep(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/** CEP válido = exatamente 8 dígitos. */
export function isValidCep(input: string): boolean {
  return /^\d{8}$/.test(input.replace(/\D/g, ''));
}
