import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticación',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Datos del usuario autenticado',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

