import { Request, Response, Router } from "express";
import prisma from "../../../../config/prisma";
import { ensureAuthenticated } from "../../../../shared/http/middlewares/ensureAuthenticated";

const router = Router();

router.get("/", ensureAuthenticated, async (req: Request, res: Response) => {
  if (req.auth!.role !== "admin") {
    return res.status(403).json({ message: "Apenas admin pode consultar os logs de auditoria." });
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return res.json(logs);
});

export default router;
