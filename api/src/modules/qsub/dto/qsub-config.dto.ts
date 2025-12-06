import { ApiProperty } from '@nestjs/swagger';

export class MultilingualTextDto {
  @ApiProperty()
  en: string;

  @ApiProperty()
  cs: string;
}

export class QsubFieldConfigDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  label: MultilingualTextDto;

  @ApiProperty({ required: false })
  description?: MultilingualTextDto;

  @ApiProperty({ required: false })
  required?: boolean;

  @ApiProperty({ required: false })
  default?: any;

  @ApiProperty()
  category: 'basic' | 'advanced';

  @ApiProperty({ required: false, type: [String] })
  dependsOn?: string[];

  @ApiProperty({ required: false, type: [Object] })
  options?: any[];
}

export class QsubConfigResponseDto {
  @ApiProperty({ type: [QsubFieldConfigDto] })
  fields: QsubFieldConfigDto[];
}
