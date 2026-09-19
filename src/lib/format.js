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
