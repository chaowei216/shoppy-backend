import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from 'generated/prisma';
import * as ms from 'ms';
import { UsersService } from 'src/users/users.service';
import { TokenPayload } from './token-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: User, response: Response) {
    const jwtExpiration =
      this.configService.getOrThrow<string>('JWT_EXPIRATION') || '10h';
    const expiresIn: number = ms(jwtExpiration as ms.StringValue);

    const expires = new Date();
    expires.setMilliseconds(expires.getMilliseconds() + expiresIn);

    const tokenPayload: TokenPayload = {
      userId: user.id,
    };

    const token = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: jwtExpiration,
    });

    response.cookie('Authentication', token, {
      secure: true,
      httpOnly: true,
      expires,
    });

    return { tokenPayload };
  }

  async verify(email: string, password: string) {
    try {
      const user = await this.userService.getUser({ email });

      const authenticated = await bcrypt.compare(password, user.password);

      if (!authenticated) {
        throw new UnauthorizedException();
      }

      return user;
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Credentials are not valid');
    }
  }

  verifyToken(jwt: string) {
    this.jwtService.verify(jwt);
  }
}
