import { Test, TestingModule } from '@nestjs/testing';
import { QsubService } from './qsub.service';

describe('QsubService', () => {
  let service: QsubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QsubService],
    }).compile();

    service = module.get<QsubService>(QsubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
