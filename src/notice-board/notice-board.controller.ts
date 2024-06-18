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
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { PostService } from './notice-board.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CreatePostDto, CustomFile } from './dto/create-board.dto';
import { UpdatePostDto } from './dto/update-board.dto';
import { SearchPostsDto } from './dto/search-boards.dto';
import { UploadService } from '../upload/upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../upload/multer.config';

@Controller('posts')
export class PostController {
  private readonly logger = new Logger(PostController.name);
  constructor(
    private readonly postService: PostService,
    private readonly uploadService: UploadService,
  ) {
    this.logger.log('Initializing multer options');
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async createPost(
    @UploadedFile() file: CustomFile,
    @Body() createPostDto: CreatePostDto,
    @Request() req,
  ) {
    const imageUrl = file ? file.location : null;
    return this.postService.createPost(
      createPostDto,
      req.user.id,
      req.user.userRole,
      imageUrl,
    );
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postService.getPost(id);
  }

  @Get()
  async getPosts(@Query() searchPostsDto: SearchPostsDto) {
    return this.postService.getPosts(searchPostsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async updatePost(
    @Param('id') id: string,
    @UploadedFile() file: CustomFile,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    const post = await this.postService.getPost(id);
    if (req.user.id !== post.authorId) {
      throw new ForbiddenException('다른 사람의 글을 업데이트 할 수없습니다');
    }

    const newImageUrl = file ? file.location : null;
    return this.postService.updatePost(
      id,
      updatePostDto,
      req.user.userRole,
      newImageUrl,
    );
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
