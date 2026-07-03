import type { Transaction } from "../../domain/entities/Transaction.js";
import type { TransactionRepository } from "../../domain/repositories/TransactionRepository.js";
import { TransactionNotFoundError } from "../errors/TransactionNotFoundError.js";

export type MarkExpenseAsPaidInput = {
  userId: string;
  transactionId: string;
  paidAt?: Date;
};

export class MarkExpenseAsPaidUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  public async execute(input: MarkExpenseAsPaidInput): Promise<Transaction> {
    const found = await this.transactionRepository.findById(input.transactionId);
    if (!found || found.userId !== input.userId) {
      throw new TransactionNotFoundError();
    }

    const updated = found.markAsPaid(input.paidAt);
    await this.transactionRepository.update(updated);
    return updated;
  }
}
