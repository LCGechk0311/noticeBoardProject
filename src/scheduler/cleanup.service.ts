import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 0 * * *') // 매일 자정에 실행
  async handleCron() {
    this.logger.debug('Running cleanup task');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 게시글 삭제
    await this.prisma.board.deleteMany({
      where: {
        deletedAt: {
          not: null,
          lte: thirtyDaysAgo,
        },
      },
    });

    // 댓글 삭제
    await this.prisma.comment.deleteMany({
      where: {
        deletedAt: {
          not: null,
          lte: thirtyDaysAgo,
        },
      },
    });

    this.logger.debug('Cleanup task completed');
  }
}
