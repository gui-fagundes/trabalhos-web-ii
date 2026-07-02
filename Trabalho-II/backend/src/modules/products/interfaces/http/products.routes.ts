import { Request, Response, Router } from "express";
import { z } from "zod";
import prisma from "../../../../config/prisma";
import { ensureAuthenticated } from "../../../../shared/http/middlewares/ensureAuthenticated";
import { upload } from "../../../../shared/http/upload";

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(2, "Nome do produto muito curto."),
  description: z.string().trim().min(3, "Descrição muito curta."),
  category: z.string().trim().min(2, "Categoria inválida."),
  price: z.coerce.number().nonnegative("Preço não pode ser negativo."),
  stock: z.coerce.number().int().nonnegative().default(0),
});

router.get("/", async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: true,
      seller: { select: { id: true, name: true, sellerProfile: { select: { storeName: true } } } },
    },
  });

  return res.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      stock: p.stock,
      seller: { id: p.seller.id, name: p.seller.name, storeName: p.seller.sellerProfile?.storeName ?? null },
      primaryImage: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
    })),
  );
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "ID inválido." });

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      seller: { include: { sellerProfile: true } },
    },
  });

  if (!product) return res.status(404).json({ message: "Produto não encontrado." });

  const totalLikes = await prisma.commentLike.count({
    where: { comment: { productId: id } },
  });

  return res.json({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    stock: product.stock,
    images: product.images,
    seller: {
      id: product.seller.id,
      name: product.seller.name,
      profile: product.seller.sellerProfile,
    },
    totalLikes,
  });
});

router.post(
  "/",
  ensureAuthenticated,
  upload.array("images", 8),
  async (req: Request, res: Response) => {
    if (req.auth!.role !== "seller") {
      return res.status(403).json({ message: "Apenas vendedores podem cadastrar produtos." });
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues.map((i) => i.message).join(" ") });
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    const product = await prisma.product.create({
      data: {
        sellerId: req.auth!.userId,
        ...parsed.data,
        images: {
          create: files.map((file, index) => ({
            url: `/uploads/${file.filename}`,
            isPrimary: index === 0,
          })),
        },
      },
      include: { images: true },
    });

    return res.status(201).json(product);
  },
);

router.delete("/:id", ensureAuthenticated, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return res.status(404).json({ message: "Produto não encontrado." });

  const isOwner = product.sellerId === req.auth!.userId;
  const isAdmin = req.auth!.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Você não pode excluir este produto." });
  }

  await prisma.product.delete({ where: { id } });
  return res.status(204).send();
});

export default router;
