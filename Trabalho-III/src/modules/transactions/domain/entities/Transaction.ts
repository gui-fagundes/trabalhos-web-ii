import { randomUUID } from "node:crypto";

export type TransactionType = "income" | "expense";
export type ExpenseStatus = "pending" | "paid";

export type TransactionProps = {
  id?: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  description: string;
  amount: number;
  occurredAt: Date;
  status?: ExpenseStatus | null;
  paidAt?: Date | null;
  createdAt?: Date;
};

export class Transaction {
  public readonly id: string;
  public readonly userId: string;
  public readonly categoryId: string;
  public readonly type: TransactionType;
  public readonly description: string;
  public readonly amount: number;
  public readonly occurredAt: Date;
  public readonly status: ExpenseStatus | null;
  public readonly paidAt: Date | null;
  public readonly createdAt: Date;

  private constructor(props: Required<TransactionProps>) {
    this.id = props.id;
    this.userId = props.userId;
    this.categoryId = props.categoryId;
    this.type = props.type;
    this.description = props.description;
    this.amount = props.amount;
    this.occurredAt = props.occurredAt;
    this.status = props.status;
    this.paidAt = props.paidAt;
    this.createdAt = props.createdAt;
  }

  public static create(props: TransactionProps): Transaction {
    if (props.type !== "income" && props.type !== "expense") {
      throw new Error("Transaction type must be 'income' or 'expense'.");
    }

    const description = props.description.trim();
    if (!description) {
      throw new Error("Transaction description is required.");
    }

    if (!Number.isFinite(props.amount) || props.amount <= 0) {
      throw new Error("Transaction amount must be greater than zero.");
    }

    if (!(props.occurredAt instanceof Date) || Number.isNaN(props.occurredAt.getTime())) {
      throw new Error("Transaction occurredAt must be a valid date.");
    }

    if (!props.userId || !props.categoryId) {
      throw new Error("Transaction userId and categoryId are required.");
    }

    const status: ExpenseStatus | null = props.type === "expense" ? (props.status ?? "pending") : null;
    const paidAt: Date | null = status === "paid" ? (props.paidAt ?? new Date()) : null;

    return new Transaction({
      id: props.id ?? randomUUID(),
      userId: props.userId,
      categoryId: props.categoryId,
      type: props.type,
      description,
      amount: props.amount,
      occurredAt: props.occurredAt,
      status,
      paidAt,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  public markAsPaid(paidAt?: Date): Transaction {
    if (this.type !== "expense") {
      throw new Error("Only expenses can be marked as paid.");
    }
    if (this.status === "paid") {
      throw new Error("Expense is already paid.");
    }

    return new Transaction({
      id: this.id,
      userId: this.userId,
      categoryId: this.categoryId,
      type: this.type,
      description: this.description,
      amount: this.amount,
      occurredAt: this.occurredAt,
      status: "paid",
      paidAt: paidAt ?? new Date(),
      createdAt: this.createdAt,
    });
  }
}
