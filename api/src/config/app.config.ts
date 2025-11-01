import { IsInt, IsOptional, Min } from 'class-validator';

export class AppConfig {
  @IsOptional()
  @IsInt()
  @Min(1)
  port?: number;
}

export const getAppConfig = (): AppConfig => ({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
});
