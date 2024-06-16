import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDTO } from './dto/response-user.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    return plainToClass(UserResponseDTO, user, {
      excludeExtraneousValues: true,
    });
  }

  async findOneEmail(email: string) {
    const user = this.prisma.user.findUnique({ where: { email } });

    return user;
  }

  async findById(id: string): Promise<UserResponseDTO> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return plainToClass(UserResponseDTO, user, {
      excludeExtraneousValues: true,
    });
  }

  async getAllUsers(): Promise<UserResponseDTO[]> {
    const users = await this.prisma.user.findMany();

    return plainToClass(UserResponseDTO, users, {
      excludeExtraneousValues: true,
    });
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDTO> {
    const { userName, email, password, role } = updateUserDto;
    const users = await this.prisma.user.update({
      where: { id },
      data: {
        userName,
        email,
        password,
        role,
      },
    });

    return plainToClass(UserResponseDTO, users, {
      excludeExtraneousValues: true,
    });
  }

  async deleteUser(id: string): Promise<UserResponseDTO> {
    const user = await this.prisma.user.delete({
      where: { id },
    });

    return plainToClass(UserResponseDTO, user, {
      excludeExtraneousValues: true,
    });
  }
}
