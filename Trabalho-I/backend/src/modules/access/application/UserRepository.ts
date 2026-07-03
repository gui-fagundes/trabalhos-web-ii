import { ModuleAccess, Role, UserEntity } from "../domain/User";

export type CreateUserInput = {
  name: string;
  email: string;
  cpf: string;
  passwordHash: string;
  role?: Role;
  permissions?: ModuleAccess[];
  emailVerifiedAt?: Date | null;
};

export type UserCredentials = {
  id: number;
  role: Role;
  passwordHash: string;
  permissions: ModuleAccess[];
  name: string;
  email: string;
  active: boolean;
  emailVerifiedAt: Date | null;
};

export interface UserRepository {
  create(input: CreateUserInput): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  findById(id: number): Promise<UserEntity | null>;
  replacePermissions(userId: number, permissions: ModuleAccess[]): Promise<UserEntity>;
  setActiveStatus(userId: number, active: boolean): Promise<UserEntity>;
}
