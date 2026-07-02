# Trabalho I - Sistema de Usuários (MarketMVP)

Aplicação com autenticação, perfis de usuário (admin/comprador/vendedor), validação de
e-mail por código único e auditoria de ações, usando o Template 1 como base visual.

## Estrutura

```
Trabalho-I/
  backend/    API Node.js + TypeScript + Express + Prisma (SQLite)
  frontend/   HTML estático (Template-T1) + JS puro (fetch) consumindo a API
```

O próprio backend serve os arquivos do frontend (`express.static`), então só é
necessário rodar um processo.

## Como rodar

```bash
cd Trabalho-I/backend
npm install
cp .env.example .env   # já vem com valores padrão de dev
npm run migrate        # aplica as migrations do Prisma (gera dev.db)
npm run dev
```

Acesse http://localhost:3333 (a página inicial é `index.html`; para login use
`/login.html`, para cadastro `/signup.html`).

## Usuários de teste

| Perfil | E-mail | Senha | Observação |
| - | - | - | - |
| Admin | admin@marketmvp.com | admin123 | Criado automaticamente ao subir o servidor (ver `.env`) |
| Comprador/Vendedor | (crie pelo `/signup.html`) | - | Precisa verificar o e-mail antes do primeiro login |

## Funcionalidades implementadas

- **Cadastro e login** com senha em hash (scrypt + salt), rotas protegidas por JWT.
- **3 perfis**: admin, comprador (`buyer`) e vendedor (`seller`), com acesso restrito
  por perfil (ex.: apenas admin lista usuários e acessa os logs).
- **Validação de e-mail por código único**: no cadastro é gerado um código de 6
  dígitos com expiração de 20 minutos. Login só é permitido após a verificação.
  Existe rota de reenvio (`/auth/resend-code`) para código expirado.
- **Gestão de usuários pelo admin**: listagem com status (ativo/inativo, e-mail
  verificado) e ação de ativar/desativar conta (não é possível desativar a própria
  conta do admin logado).
- **Auditoria de logs**: toda requisição não-GET é registrada (data/hora, usuário
  quando autenticado, método HTTP, rota e um resumo da ação), inclusive quando a
  operação falha (ex.: tentativa de login inválida). Consulta restrita ao admin em
  `GET /audit-logs`, com uma tela dedicada no painel administrativo.

## Decisão de escopo

- **Envio real de e-mail não foi implementado nesta etapa.** O código de verificação
  é registrado no console/log do servidor (`[verify-email] código para ...`), o que
  permite validar o fluxo ponta a ponta em ambiente de aula. Fica como próximo passo
  plugar um serviço real (Nodemailer + Ethereal/SMTP) se necessário.
- **Estética do Template 1 foi mantida como veio** — apenas foi adicionado
  comportamento (fetch para a API) aos formulários e às telas; nenhum estilo/CSS foi
  alterado além do necessário para renderizar dados reais nas tabelas.

## Rotas principais da API

```
POST   /auth/register        cria usuário (buyer/seller) e dispara verificação
POST   /auth/verify-email    confirma o código de verificação
POST   /auth/resend-code     reenvia um novo código
POST   /auth/login           autentica (bloqueia se não verificado/desativado)
GET    /auth/me              dados do usuário autenticado
GET    /users                lista usuários (admin)
PATCH  /users/:id/status     ativa/desativa usuário (admin)
PATCH  /users/:id/permissions  atualiza permissões por módulo (admin)
GET    /audit-logs           consulta o log de auditoria (admin)
```
