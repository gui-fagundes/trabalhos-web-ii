import type { CategoryRepository } from "../../../categories/domain/repositories/CategoryRepository.js";
import type { TransactionRepository } from "../../../transactions/domain/repositories/TransactionRepository.js";

export type GetCategorySummaryInput = {
  userId: string;
  month: number;
  year: number;
};

export type CategorySummaryItem = {
  categoryId: string;
  categoryName: string;
  total: number;
};

export class GetCategorySummaryUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  public async execute(input: GetCategorySummaryInput): Promise<CategorySummaryItem[]> {
    const [transactions, categories] = await Promise.all([
      this.transactionRepository.listByUserId(input.userId, { month: input.month, year: input.year }),
      this.categoryRepository.listByUserId(input.userId),
    ]);

    const totals = new Map<string, number>();
    for (const t of transactions) {
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
    }

    // Preserva a ordem em que as categorias foram cadastradas pelo usuário,
    // que é a mesma ordem retornada pelo repositório.
    return categories
      .filter((c) => totals.has(c.id))
      .map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        total: totals.get(c.id) as number,
      }));
  }
}
