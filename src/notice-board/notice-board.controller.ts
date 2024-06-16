import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { PostService } from './notice-board.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostDto } from './dto/create-board.dto';
import { UpdatePostDto } from './dto/update-board.dto';
import { GetPostsDto } from './dto/get-boards.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postService.createPost(
      createPostDto,
      req.user.id,
      req.user.userRole,
    );
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postService.getPost(id);
  }

  @Get()
  async getPosts(@Query() getPostsDto: GetPostsDto) {
    return this.postService.getPosts(getPostsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    const post = await this.postService.getPost(id);
    if (req.user.id !== post.authorId) {
      throw new ForbiddenException('다른 사람의 글을 업데이트 할 수없습니다');
    }

    return this.postService.updatePost(id, updatePostDto, req.user.userRole);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Param('id') id: string, @Request() req) {
    const post = await this.postService.getPost(id);
    if (req.user.role !== 'admin' && req.user.id !== post.authorId) {
      throw new ForbiddenException('다른 사람의 정보를 업데이트 할 수없습니다');
    }

    return this.postService.deletePost(id, req.user.userRole);
  }
}
