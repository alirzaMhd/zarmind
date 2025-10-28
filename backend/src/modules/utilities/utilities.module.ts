import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { QrCodeController } from './qr-code.controller';
import { OcrService } from './ocr.service';
import { QrCodeService } from './qr-code.service';
import { DatabaseModule } from '../../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MediaController, QrCodeController],
  providers: [OcrService, QrCodeService],
  exports: [OcrService, QrCodeService],
})
export class UtilitiesModule {}