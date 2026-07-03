import type { TransactionRepository } from "../../../transactions/domain/repositories/TransactionRepository.js";

export type GetMonthlyBalanceInput = {
  userId: string;
  month: number;
  year: number;
};

export type GetMonthlyBalanceOutput = {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
};

export class GetMonthlyBalanceUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  public async execute(input: GetMonthlyBalanceInput): Promise<GetMonthlyBalanceOutput> {
    const transactions = await this.transactionRepository.listByUserId(input.userId, {
      month: input.month,
      year: input.year,
    });

    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }

    return {
      month: input.month,
      year: input.year,
      income,
      expense,
      balance: income - expense,
    };
  }
}
