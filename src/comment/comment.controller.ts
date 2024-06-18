import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':boardId')
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @Param('boardId') boardId: string,
    @Request() req,
  ) {
    return this.commentService.createComment(
      createCommentDto,
      boardId,
      req.user.id,
    );
  }

  @Get('board/:boardId')
  async getCommentsByPost(@Param('boardId') boardId: string) {
    return this.commentService.getCommentsByPost(boardId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ) {
    return this.commentService.updateComment(id, updateCommentDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteComment(@Param('id') id: string, @Request() req) {
    return this.commentService.deleteComment(id, req.user.id);
  }
}
