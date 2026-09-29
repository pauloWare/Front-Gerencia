// ============================================================================
// Formatação de números e valores monetários (Real - BRL).
// ============================================================================

/**
 * Formata um valor numérico como moeda brasileira, ex.: R$ 1.500,00.
 * Aceita string ou número. Não lança erro para valores inválidos.
 */
export function formatCurrency(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 'R$ 0,00';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata um CPF (11 dígitos) para 000.000.000-00.
 * O backend grava o CPF apenas com dígitos; a máscara é aplicada na exibição.
 * Valores com tamanho diferente são devolvidos como estão (não inventamos dado).
 */
export function formatCpf(value) {
  const digitos = String(value ?? '').replace(/\D/g, '');
  if (digitos.length !== 11) return value ? String(value) : '';
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

/**
 * Formata um número com separador de milhar e casas decimais, ex.: 1.500,00.
 * Sem o símbolo da moeda.
 */
export function formatNumber(value, decimals = 2) {
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
