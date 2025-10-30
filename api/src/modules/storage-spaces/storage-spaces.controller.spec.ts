import { Test, TestingModule } from '@nestjs/testing';
import { StorageSpacesController } from './storage-spaces.controller';

describe('StorageSpacesController', () => {
  let controller: StorageSpacesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageSpacesController],
    }).compile();

    controller = module.get<StorageSpacesController>(StorageSpacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
