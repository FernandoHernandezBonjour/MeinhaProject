import { TransactionType } from '@/types/financial';

export const DEFAULT_CATEGORIES = {
  INCOME: [
    'Salário',
    'Renda extra',
    'Freelance',
    'Vendas',
    'Rendimentos / Juros',
    'Reembolso',
    'Outros',
  ],
  EXPENSE: [
    'Moradia',
    'Aluguel',
    'Condomínio',
    'Água',
    'Luz',
    'Internet',
    'Alimentação',
    'Supermercado',
    'Restaurante / Lanches',
    'Transporte',
    'Combustível',
    'Transporte público',
    'Aplicativos (Uber, etc.)',
    'Saúde',
    'Farmácia',
    'Consultas',
    'Plano de saúde',
    'Educação',
    'Cursos',
    'Faculdade',
    'Livros',
    'Lazer',
    'Viagens',
    'Streaming',
    'Eventos',
    'Assinaturas',
    'Streaming',
    'Softwares',
    'Compras',
    'Roupas',
    'Eletrônicos',
    'Impostos e taxas',
    'Pets',
    'Dívidas / Empréstimos',
    'Outros',
  ],
};

export function getInvoicePeriod(date: Date, closingDay: number, dueDay: number) {
  const transactionDate = new Date(date);
  let month = transactionDate.getMonth();
  let year = transactionDate.getFullYear();

  // Se a data da transação for após o fechamento, ela cai na fatura do próximo mês
  if (transactionDate.getDate() >= closingDay) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  // A data de vencimento é no dia 'dueDay' do mês/ano da fatura
  const dueDate = new Date(year, month, dueDay);
  
  // A data de fechamento é no dia 'closingDay' do mês/ano da fatura
  const closingDate = new Date(year, month, closingDay);

  return { month: month + 1, year, dueDate, closingDate };
}
