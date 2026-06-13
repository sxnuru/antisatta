import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MarketsModule } from '../markets/markets.module';

@Module({
  imports: [MarketsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
