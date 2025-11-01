import { IsString } from 'class-validator';

export class PbsConfig {
  @IsString()
  dataPath: string;
}

export const getPbsConfig = (): PbsConfig => ({
  dataPath: process.env.PBS_DATA_PATH || 'data/pbs',
});
