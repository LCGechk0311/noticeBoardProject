import { IsString, IsEmail, MinLength, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  userName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsIn(['admin', 'user'])
  role: 'admin' | 'user';
}
