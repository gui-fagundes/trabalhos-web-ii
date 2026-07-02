import prisma from "../../../config/prisma";
import { AppError } from "../../../shared/errors/AppError";

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 20;

function generateCode(): string {
  return Math.floor(Math.random() * 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, "0");
}

export async function issueVerificationCode(userId: number, email: string): Promise<void> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await prisma.emailVerificationCode.create({
    data: { userId, code, expiresAt },
  });

  // Envio real de e-mail fica fora de escopo por ora; o código é "entregue"
  // via log para permitir validar o fluxo ponta a ponta em ambiente de aula.
  console.log(`[verify-email] código para ${email}: ${code} (expira em ${CODE_TTL_MINUTES} min)`);
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  if (!user) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  if (user.emailVerifiedAt) {
    throw new AppError("E-mail já verificado.", 409);
  }

  const verification = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id, code, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    throw new AppError("Código inválido.", 400);
  }

  if (verification.expiresAt < new Date()) {
    throw new AppError("Código expirado. Solicite o reenvio.", 400);
  }

  await prisma.$transaction([
    prisma.emailVerificationCode.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);
}

export async function resendVerificationCode(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  if (!user) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  if (user.emailVerifiedAt) {
    throw new AppError("E-mail já verificado.", 409);
  }

  await issueVerificationCode(user.id, user.email);
}
