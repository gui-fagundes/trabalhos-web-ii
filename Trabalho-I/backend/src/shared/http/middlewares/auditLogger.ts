import { NextFunction, Request, Response } from "express";
import prisma from "../../../config/prisma";
import { verifyAccessToken } from "../../security/jwt";

function describeAction(method: string, path: string): string {
  if (path.startsWith("/auth/register")) return "Cadastro de usuário";
  if (path.startsWith("/auth/login")) return "Tentativa de login";
  if (path.startsWith("/auth/verify-email")) return "Verificação de e-mail";
  if (path.startsWith("/auth/resend-code")) return "Reenvio de código de verificação";
  if (path.match(/^\/users\/\d+\/status/)) return "Alteração de status de usuário (ativar/desativar)";
  if (path.match(/^\/users\/\d+\/permissions/)) return "Alteração de permissões de usuário";
  if (path.startsWith("/users")) return "Criação de usuário pelo admin";
  return `Ação ${method} em ${path}`;
}

/**
 * Registra toda requisição não-GET, mesmo quando a operação falha
 * (regra de negócio ou erro), pois o log cobre a tentativa, não só o sucesso.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET") {
    return next();
  }

  let userId: number | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(authHeader.slice("Bearer ".length));
      userId = Number(payload.sub);
    } catch {
      // token inválido/ausente: log segue sem usuário identificado
    }
  }

  const method = req.method;
  const originalUrl = req.originalUrl;

  res.on("finish", () => {
    prisma.auditLog
      .create({
        data: {
          userId,
          method,
          path: originalUrl,
          statusCode: res.statusCode,
          summary: describeAction(method, originalUrl),
        },
      })
      .catch((error) => {
        console.error("Falha ao gravar audit log:", error);
      });
  });

  next();
}
