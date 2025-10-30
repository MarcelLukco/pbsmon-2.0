import { Test, TestingModule } from '@nestjs/testing';
import { StorageSpacesService } from './storage-spaces.service';

describe('StorageSpacesService', () => {
  let service: StorageSpacesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageSpacesService],
    }).compile();

    service = module.get<StorageSpacesService>(StorageSpacesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
