import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Group member DTO - user information in a group
 */
export class GroupMemberDTO {
  @Expose()
  @ApiProperty({ description: 'User nickname (username)' })
  nickname: string;

  @Expose()
  @ApiProperty({
    description: 'User name (full name from Perun)',
    nullable: true,
  })
  name?: string | null;
}

/**
 * Group Detail DTO
 */
export class GroupDetailDTO {
  @Expose()
  @ApiProperty({ description: 'Group name' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'Group ID (GID)' })
  gid: string;

  @Expose()
  @Type(() => GroupMemberDTO)
  @ApiProperty({
    description: 'List of group members (only nickname and name)',
    type: [GroupMemberDTO],
  })
  members: GroupMemberDTO[];
}
