import type { Category } from "../../domain/entities/Category.js";
import type { CategoryRepository } from "../../domain/repositories/CategoryRepository.js";

export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly categories: Category[] = [];

  public async findById(id: string): Promise<Category | null> {
    return this.categories.find((c) => c.id === id) ?? null;
  }

  public async findByUserIdAndName(userId: string, name: string): Promise<Category | null> {
    const normalized = name.trim().toLowerCase();
    return (
      this.categories.find(
        (c) => c.userId === userId && c.name.toLowerCase() === normalized,
      ) ?? null
    );
  }

  public async listByUserId(userId: string): Promise<Category[]> {
    return this.categories.filter((c) => c.userId === userId);
  }

  public async create(category: Category): Promise<void> {
    this.categories.push(category);
  }
}
