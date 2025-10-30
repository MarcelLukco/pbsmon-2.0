import { Test, TestingModule } from '@nestjs/testing';
import { QsubController } from './qsub.controller';

describe('QsubController', () => {
  let controller: QsubController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QsubController],
    }).compile();

    controller = module.get<QsubController>(QsubController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
