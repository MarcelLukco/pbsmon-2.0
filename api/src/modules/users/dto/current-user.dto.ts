import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserRole } from '@/common/types/user-context.types';

/**
 * Current User DTO
 */
export class CurrentUserDTO {
  @Expose()
  @ApiProperty({ description: 'Username' })
  username: string;

  @Expose()
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
  })
  role: UserRole;
}
