import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDTO {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  userName: string;

  @Expose()
  role: string;
}