# Trabalho III - Backend de Controle Financeiro Pessoal

Backend em Node.js + TypeScript organizado em camadas (DDD/Clean Architecture),
guiado pela suite de testes fornecida na pasta-base do professor. **Todos os 27
testes (10 unitários + 2 arquivos de integração) passam.**

## Como executar

```bash
cd Trabalho-III
npm install
npm test          # roda unit + integracao
npm run test:unit
npm run test:integration
npm run dev       # inicia o servidor HTTP na porta 3000
```

## Estrutura (Clean Architecture)

```text
src/
  main/            composicao da aplicacao (app, container, routes, server)
  modules/
    auth/          register + login + services (hash, token)
    users/         entidade User + repositorio
    categories/    entidade Category + use cases + repositorio
    transactions/  entidade Transaction + use cases + repositorio
    reports/       use cases de saldo mensal e resumo por categoria
  shared/          middleware auth, tipos comuns, erros
tests/
  unit/            testes das entidades e casos de uso
  integration/     testes HTTP das rotas /auth e do fluxo financeiro
  support/         helper de servidor HTTP para os testes de integracao
```

Cada módulo segue:

- `domain/` — entidades e contratos (interfaces de repositório). Regras de negócio
  puras, sem dependência de framework.
- `application/` — casos de uso (`*UseCase`) e erros de negócio.
- `infrastructure/` — implementações concretas (repositórios em memória, hash
  scrypt, JWT).
- `interfaces/http/` — controllers HTTP.

## Regras de negócio implementadas

- **Cadastro/login**: e-mail normalizado (trim + lowercase), senha em hash
  (scrypt + salt), JWT como token de sessão.
- **Categorias**: cada usuário cria e lista as próprias; nome duplicado por
  usuário lança `CategoryAlreadyExistsError` (mesmo nome é permitido em usuários
  diferentes).
- **Lançamentos** (`Transaction`): tipo `income` ou `expense`, valor > 0
  obrigatoriamente, atrelado ao usuário autenticado. Só é possível criar
  lançamento em categoria do próprio usuário — caso contrário `CategoryNotFoundError`.
- **Status de despesa**: `expense` começa `pending`; `PATCH /transactions/:id/pay`
  altera para `paid` (checa autoria e evita repagamento).
- **Filtros**: `GET /transactions?month=&year=&categoryId=&type=` — filtragem no
  backend.
- **Relatórios calculados no backend**:
  - saldo mensal (`GET /reports/monthly-balance?month=&year=`): agrega receitas
    e despesas do usuário no mês/ano indicados.
  - resumo por categoria (`GET /reports/category-summary?month=&year=`): agrupa
    o total por categoria, preservando a ordem em que as categorias foram
    cadastradas.

## Decisões arquiteturais

- **Inversão de dependência**: os use cases dependem das *interfaces*
  `UserRepository`/`CategoryRepository`/`TransactionRepository` — quem escolhe a
  implementação concreta é o `container`. Isso permite trocar repositório em
  memória por Prisma/SQL sem tocar em regra de negócio.
- **Entidades imutáveis**: `User`, `Category` e `Transaction` têm construtor
  privado e método estático `create()` que valida os invariantes antes de
  instanciar; nunca existe entidade inválida em memória. `markAsPaid()` retorna
  uma nova `Transaction` em vez de mutar a original.
- **Erros de negócio tipados** (`EmailAlreadyInUseError`, `InvalidCredentialsError`,
  `CategoryAlreadyExistsError`, `CategoryNotFoundError`, `TransactionNotFoundError`,
  `ExpenseAlreadyPaidError`, `InvalidTokenError`) — os controllers só olham para
  o tipo do erro para escolher o status HTTP (409/401/404/400), mantendo a regra
  no domínio.
- **Persistência em memória** conforme permitido pelo enunciado (a arquitetura
  em camadas é o foco, não o SQL).

## Serviços de auth

- `ScryptPasswordHasher` (implementa `PasswordHasher`) — usa `scryptSync` +
  salt aleatório e `timingSafeEqual` para comparação segura.
- `JwtTokenService` (implementa `TokenService`) — assina/verifica JWT com
  `HS256`, expiração de 8 horas por padrão.

Os nomes `PlaceholderPasswordHasher`/`PlaceholderTokenService` foram mantidos
como aliases para preservar os imports esperados pelo container fornecido.

## Rotas

```
POST /auth/register
POST /auth/login

# Requerem Authorization: Bearer <token>
POST /categories
GET  /categories
POST /transactions
GET  /transactions?month=&year=&categoryId=&type=
PATCH /transactions/:id/pay

GET  /reports/monthly-balance?month=&year=
GET  /reports/category-summary?month=&year=
```
