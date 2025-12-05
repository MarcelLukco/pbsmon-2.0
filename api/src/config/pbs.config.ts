import { IsBoolean, IsString } from 'class-validator';

export class PbsConfig {
  @IsString()
  dataPath: string;

  @IsString()
  serverName: string;

  @IsBoolean()
  mockData: boolean;
}

export const getPbsConfig = (): PbsConfig => ({
  dataPath: process.env.PBS_DATA_PATH || 'data/pbs',
  serverName: 'pbs-m1',
  mockData: process.env.MOCK_PBS_DATA === 'true',
});
