# Trabalho II - Evolução do Marketplace (MarketMVP)

Extensão do Trabalho I. Mantém autenticação, controle de acesso por perfil,
verificação de e-mail e auditoria de ações, e adiciona:

- perfil detalhado de comprador e vendedor;
- cadastro de produtos com múltiplas fotos;
- tela de detalhes do produto com galeria e vendedor;
- sistema de comentários com foto opcional;
- sistema de curtidas em comentários sem duplicidade.

## Estrutura

```
Trabalho-II/
  backend/    Node.js + TypeScript + Express + Prisma (SQLite) + multer
  frontend/   Template-T1 estendido + JS puro (fetch) consumindo a API
```

O backend serve os arquivos do frontend em `express.static`, então um único
processo já disponibiliza a aplicação inteira. Arquivos enviados (fotos de produto
e comentários) são gravados em `backend/uploads/` e servidos em `/uploads`.

## Como rodar

```bash
cd Trabalho-II/backend
npm install
cp .env.example .env
npm run migrate       # cria dev.db + tabelas
npm run dev
```

Depois acesse http://localhost:3333.

## Usuários de teste

| Perfil | E-mail | Senha | Observação |
| - | - | - | - |
| Admin | admin@marketmvp.com | admin123 | Criado automaticamente |
| Comprador/Vendedor | (crie em `/signup.html`) | - | Verificar o e-mail antes do primeiro login |

## Funcionalidades novas (Trabalho II)

### Perfil do comprador (`/profile-buyer.html`)

- Endereço completo (logradouro, cidade, estado, CEP), telefone e forma de
  pagamento preferencial.
- Somente o próprio comprador acessa e edita — outro usuário nem sequer consegue
  invocar `PUT /profiles/me/buyer` (o backend responde 403).

### Perfil do vendedor

- Página de edição em `/profile-seller.html` (nome da loja, descrição, contato,
  cidade/estado, categorias).
- Página pública em `/seller-profile.html?id=X` — visível a qualquer visitante,
  autenticado ou não, listando os produtos cadastrados pelo vendedor.

### Produtos com múltiplas fotos

- `POST /products` (seller-only) aceita até 8 imagens em `multipart/form-data`. A
  primeira imagem é marcada como principal automaticamente.
- Listagem pública em `/categories.html` mostra a imagem principal e o nome do
  vendedor. Detalhes em `/product-details.html?id=X` mostram todas as fotos
  (thumbs clicáveis alteram a imagem principal).
- Validação: tipo (jpg/png/webp/gif), tamanho máx. 5MB por arquivo, preço e
  estoque não-negativos.

### Comentários

- Somente usuários autenticados podem criar; cada comentário fica associado ao
  autor e ao produto e registra data/hora.
- Foto opcional anexada via mesmo `multer` (`photo` no `multipart/form-data`).
- Autor pode editar ou excluir o próprio comentário; admin pode excluir qualquer.

### Curtidas (sem duplicidade)

- `POST /comments/:id/like` protegido por auth. A regra é garantida no banco
  pela constraint `@@unique([commentId, userId])` (Prisma) e checada também no
  use case — segunda curtida retorna **HTTP 409**.
- Remoção de curtida via `DELETE /comments/:id/like`. Total de curtidas do
  produto é exposto em `/products/:id`.

## Decisões de escopo

- Envio real de e-mail continua fora do escopo (código de verificação vai para o
  log do servidor).
- Estética do Template 1 preservada. As páginas novas (`profile-buyer.html`,
  `profile-seller.html`, `seller-profile.html`) seguem exatamente as mesmas
  cores/tipografia do template.
- Persistência local em SQLite via Prisma; uploads em disco local (`uploads/`).

## Novas rotas relevantes

```
GET    /products                           lista publica de produtos
GET    /products/:id                       detalhes (galeria + vendedor + total de curtidas)
POST   /products                           cadastra produto (seller, multipart)
DELETE /products/:id                       exclui (seller dono ou admin)

GET    /profiles/me/buyer                  perfil do proprio comprador
PUT    /profiles/me/buyer                  atualiza perfil do proprio comprador
GET    /profiles/me/seller                 perfil do proprio vendedor
PUT    /profiles/me/seller                 atualiza perfil do proprio vendedor
GET    /profiles/sellers/:userId           perfil publico do vendedor (nao requer auth)

GET    /products/:productId/comments       lista comentarios (com likedByMe se autenticado)
POST   /products/:productId/comments       cria comentario (auth, multipart c/ foto opcional)
PATCH  /comments/:id                       edita (autor)
DELETE /comments/:id                       exclui (autor ou admin)
POST   /comments/:id/like                  curte (409 se ja curtido)
DELETE /comments/:id/like                  remove curtida
```
