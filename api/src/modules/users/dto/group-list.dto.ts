import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Group List DTO - summary information for list view
 */
export class GroupListDTO {
  @Expose()
  @ApiProperty({ description: 'Group name' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'Group ID (GID)' })
  gid: string;

  @Expose()
  @ApiProperty({ description: 'Number of members in the group' })
  memberCount: number;
}

/**
 * Groups List DTO
 */
export class GroupsListDTO {
  @Expose()
  @ApiProperty({
    description: 'List of groups',
    type: [GroupListDTO],
  })
  groups: GroupListDTO[];
}
