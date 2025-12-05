import { IsString, IsOptional } from 'class-validator';

export class AccountingConfig {
  @IsOptional()
  @IsString()
  connectionString?: string;
}

export const getAccountingConfig = (): AccountingConfig => ({
  connectionString: process.env.ACCOUNTING_CONNECTION_STRING,
});
