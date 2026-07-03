import type { Transaction } from "../../domain/entities/Transaction.js";
import type { TransactionFilters, TransactionRepository } from "../../domain/repositories/TransactionRepository.js";

export class InMemoryTransactionRepository implements TransactionRepository {
  private readonly transactions: Transaction[] = [];

  public async findById(id: string): Promise<Transaction | null> {
    return this.transactions.find((t) => t.id === id) ?? null;
  }

  public async listByUserId(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    return this.transactions.filter((t) => {
      if (t.userId !== userId) return false;
      if (filters?.categoryId && t.categoryId !== filters.categoryId) return false;
      if (filters?.type && t.type !== filters.type) return false;
      if (filters?.month && t.occurredAt.getUTCMonth() + 1 !== filters.month) return false;
      if (filters?.year && t.occurredAt.getUTCFullYear() !== filters.year) return false;
      return true;
    });
  }

  public async create(transaction: Transaction): Promise<void> {
    this.transactions.push(transaction);
  }

  public async update(transaction: Transaction): Promise<void> {
    const idx = this.transactions.findIndex((t) => t.id === transaction.id);
    if (idx >= 0) this.transactions[idx] = transaction;
  }
}
