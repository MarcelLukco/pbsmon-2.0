import { IsString } from 'class-validator';

export class PerunConfig {
  @IsString()
  dataPath: string;
}

export const getPerunConfig = (): PerunConfig => ({
  dataPath: process.env.PERUN_DATA_PATH || 'data/perun',
});
