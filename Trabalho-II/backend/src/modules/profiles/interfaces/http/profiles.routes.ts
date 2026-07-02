import { Request, Response, Router } from "express";
import { z } from "zod";
import prisma from "../../../../config/prisma";
import { ensureAuthenticated } from "../../../../shared/http/middlewares/ensureAuthenticated";

const router = Router();

const buyerSchema = z.object({
  phone: z.string().trim().min(8, "Telefone inválido."),
  addressLine: z.string().trim().min(3, "Endereço inválido."),
  city: z.string().trim().min(2, "Cidade inválida."),
  state: z.string().trim().min(2, "Estado inválido."),
  zipCode: z.string().trim().min(5, "CEP inválido."),
  paymentMethod: z.string().trim().min(2, "Informe a forma de pagamento preferencial."),
});

const sellerSchema = z.object({
  storeName: z.string().trim().min(2, "Nome da loja inválido."),
  description: z.string().trim().min(5, "Descrição inválida."),
  contact: z.string().trim().min(5, "Contato inválido."),
  city: z.string().trim().min(2, "Cidade inválida."),
  state: z.string().trim().min(2, "Estado inválido."),
  categories: z.string().trim().min(2, "Informe ao menos uma categoria (separe por vírgula)."),
});

router.get("/me/buyer", ensureAuthenticated, async (req: Request, res: Response) => {
  if (req.auth!.role !== "buyer") return res.status(403).json({ message: "Perfil disponível apenas para compradores." });
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: req.auth!.userId } });
  return res.json(profile);
});

router.put("/me/buyer", ensureAuthenticated, async (req: Request, res: Response) => {
  if (req.auth!.role !== "buyer") return res.status(403).json({ message: "Perfil disponível apenas para compradores." });
  const parsed = buyerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues.map((i) => i.message).join(" ") });

  const profile = await prisma.buyerProfile.upsert({
    where: { userId: req.auth!.userId },
    create: { userId: req.auth!.userId, ...parsed.data },
    update: parsed.data,
  });
  return res.json(profile);
});

router.get("/me/seller", ensureAuthenticated, async (req: Request, res: Response) => {
  if (req.auth!.role !== "seller") return res.status(403).json({ message: "Perfil disponível apenas para vendedores." });
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.auth!.userId } });
  return res.json(profile);
});

router.put("/me/seller", ensureAuthenticated, async (req: Request, res: Response) => {
  if (req.auth!.role !== "seller") return res.status(403).json({ message: "Perfil disponível apenas para vendedores." });
  const parsed = sellerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues.map((i) => i.message).join(" ") });

  const profile = await prisma.sellerProfile.upsert({
    where: { userId: req.auth!.userId },
    create: { userId: req.auth!.userId, ...parsed.data },
    update: parsed.data,
  });
  return res.json(profile);
});

// perfil publico do vendedor: qualquer visitante pode consultar (nao requer auth)
router.get("/sellers/:userId", async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId)) return res.status(400).json({ message: "ID inválido." });

  const seller = await prisma.user.findFirst({
    where: { id: userId, role: "seller", active: true },
    include: { sellerProfile: true, products: { include: { images: true } } },
  });

  if (!seller) return res.status(404).json({ message: "Vendedor não encontrado." });

  return res.json({
    id: seller.id,
    name: seller.name,
    profile: seller.sellerProfile,
    products: seller.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      primaryImage: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null,
    })),
  });
});

export default router;
