import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('status', () => {
    it('reports missing database configuration without exposing credentials', async () => {
      const result = await appController.getStatus();
      expect(result.status).toBe('degraded');
      expect(result.databases.postgres).toEqual({ configured: false, reachable: false });
      expect(result.databases.mongodb).toEqual({ configured: false, reachable: false });
      expect(result.databases.redis).toEqual({ configured: false, reachable: false });
      expect(result.databases.mysql).toEqual({ configured: false, reachable: false });
      expect(JSON.stringify(result)).not.toContain('password');
    });
  });
});
