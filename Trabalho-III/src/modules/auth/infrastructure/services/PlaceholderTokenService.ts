import jwt from "jsonwebtoken";
import { InvalidTokenError } from "../../application/errors/InvalidTokenError.js";
import type { AuthTokenPayload, TokenService } from "../../application/services/TokenService.js";

export type JwtTokenServiceOptions = {
  secret: string;
  expiresInSeconds?: number;
};

export class JwtTokenService implements TokenService {
  private readonly secret: string;
  private readonly expiresInSeconds: number;

  constructor(options: JwtTokenServiceOptions) {
    this.secret = options.secret;
    this.expiresInSeconds = options.expiresInSeconds ?? 60 * 60 * 8;
  }

  public async sign(payload: AuthTokenPayload): Promise<string> {
    return jwt.sign({ sub: payload.userId }, this.secret, { expiresIn: this.expiresInSeconds });
  }

  public async verify(token: string): Promise<AuthTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.secret) as { sub?: string };
      if (!decoded.sub) throw new InvalidTokenError();
      return { userId: decoded.sub };
    } catch {
      throw new InvalidTokenError();
    }
  }
}

export const PlaceholderTokenService = JwtTokenService;
