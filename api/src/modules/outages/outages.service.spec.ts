import { Test, TestingModule } from '@nestjs/testing';
import { OutagesService } from './outages.service';

describe('OutagesService', () => {
  let service: OutagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutagesService],
    }).compile();

    service = module.get<OutagesService>(OutagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
