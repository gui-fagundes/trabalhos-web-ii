import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../../../../config/prisma";
import { ensureAuthenticated } from "../../../../shared/http/middlewares/ensureAuthenticated";
import { upload } from "../../../../shared/http/upload";

const router = Router();

const upsertSchema = z.object({ text: z.string().trim().min(1, "Comentário vazio.") });

async function commentPayload(commentId: number, viewerUserId?: number) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: { select: { id: true, name: true, role: true } },
      likes: { select: { userId: true } },
    },
  });
  if (!comment) return null;
  return {
    id: comment.id,
    productId: comment.productId,
    text: comment.text,
    photoUrl: comment.photoUrl,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: comment.author,
    likesCount: comment.likes.length,
    likedByMe: viewerUserId ? comment.likes.some((l) => l.userId === viewerUserId) : false,
  };
}

function optionalViewer(authHeader?: string): number | undefined {
  if (!authHeader?.startsWith("Bearer ")) return undefined;
  try {
    const decoded = jwt.verify(authHeader.slice("Bearer ".length), process.env.JWT_SECRET || "dev-jwt-secret") as { sub: string };
    return Number(decoded.sub);
  } catch {
    return undefined;
  }
}

router.get("/products/:productId/comments", async (req: Request, res: Response) => {
  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ message: "ID inválido." });

  const viewerUserId = optionalViewer(req.headers.authorization);

  const comments = await prisma.comment.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, role: true } },
      likes: { select: { userId: true } },
    },
  });

  return res.json(
    comments.map((c) => ({
      id: c.id,
      productId: c.productId,
      text: c.text,
      photoUrl: c.photoUrl,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: c.author,
      likesCount: c.likes.length,
      likedByMe: viewerUserId ? c.likes.some((l) => l.userId === viewerUserId) : false,
    })),
  );
});

router.post(
  "/products/:productId/comments",
  ensureAuthenticated,
  upload.single("photo"),
  async (req: Request, res: Response) => {
    const productId = Number(req.params.productId);
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Comentário inválido." });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: "Produto não encontrado." });

    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const created = await prisma.comment.create({
      data: {
        productId,
        authorId: req.auth!.userId,
        text: parsed.data.text,
        photoUrl: photo,
      },
    });

    return res.status(201).json(await commentPayload(created.id, req.auth!.userId));
  },
);

router.patch("/comments/:id", ensureAuthenticated, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Comentário inválido." });

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return res.status(404).json({ message: "Comentário não encontrado." });
  if (comment.authorId !== req.auth!.userId) {
    return res.status(403).json({ message: "Apenas o autor pode editar o comentário." });
  }

  await prisma.comment.update({ where: { id }, data: { text: parsed.data.text } });
  return res.json(await commentPayload(id, req.auth!.userId));
});

router.delete("/comments/:id", ensureAuthenticated, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return res.status(404).json({ message: "Comentário não encontrado." });

  const isAuthor = comment.authorId === req.auth!.userId;
  const isAdmin = req.auth!.role === "admin";
  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ message: "Você não pode excluir este comentário." });
  }

  await prisma.comment.delete({ where: { id } });
  return res.status(204).send();
});

router.post("/comments/:id/like", ensureAuthenticated, async (req: Request, res: Response) => {
  const commentId = Number(req.params.id);
  const exists = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId: req.auth!.userId } },
  });
  if (exists) return res.status(409).json({ message: "Você já curtiu este comentário." });

  await prisma.commentLike.create({ data: { commentId, userId: req.auth!.userId } });
  return res.status(201).json(await commentPayload(commentId, req.auth!.userId));
});

router.delete("/comments/:id/like", ensureAuthenticated, async (req: Request, res: Response) => {
  const commentId = Number(req.params.id);
  await prisma.commentLike.deleteMany({ where: { commentId, userId: req.auth!.userId } });
  return res.json(await commentPayload(commentId, req.auth!.userId));
});

export default router;
