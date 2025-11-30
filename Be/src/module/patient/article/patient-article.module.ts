import { Module } from '@nestjs/common';
import { PatientArticleController } from './patient-article.controller';
import { AdminArticleModule } from '../../admin/article/admin-article.module';

@Module({
  imports: [AdminArticleModule],
  controllers: [PatientArticleController],
})
export class PatientArticleModule {}