import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserRequest } from './dto/create-user.request';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(data: CreateUserRequest) {
    try {
      return await this.prismaService.user.create({
        data: {
          email: data.email,
          password: await bcrypt.hash(data.password, 10),
        },
        select: {
          email: true,
          id: true,
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw new UnprocessableEntityException('Email already exists');
      }

      throw err;
    }
  }

  async getUser(filter: Prisma.UserWhereUniqueInput) {
    return this.prismaService.user.findUniqueOrThrow({
      where: filter,
    });
  }
}
