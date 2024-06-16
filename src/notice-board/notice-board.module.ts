import { Module } from '@nestjs/common';
import { PostController } from './notice-board.controller';
import { PostService } from './notice-board.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [PostController],
  providers: [PostService, JwtAuthGuard, PrismaService],
})
export class NoticeBoardModule {}
