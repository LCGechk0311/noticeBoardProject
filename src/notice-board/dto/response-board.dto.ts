import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDTO } from 'src/user/dto/response-user.dto';

@Exclude()
export class PostResponseDTO {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  authorId: string;

  @Expose()
  category: string;

  @Expose()
  views: number;

  @Expose()
  createdAt: Date;

  @Expose()
  imageUrl: string;

  @Expose()
  @Type(() => UserResponseDTO)
  author: UserResponseDTO;
}