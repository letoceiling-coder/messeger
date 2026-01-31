import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { SavePublicKeyDto } from './dto/save-public-key.dto';

@Controller('encryption')
@UseGuards(JwtAuthGuard)
export class EncryptionController {
  constructor(private readonly encryptionService: EncryptionService) {}

  @Post('public-key')
  async savePublicKey(
    @CurrentUser() user: User,
    @Body() dto: SavePublicKeyDto,
  ) {
    await this.encryptionService.savePublicKey(user.id, dto.publicKey);
    return { success: true };
  }

  @Get('public-key/:userId')
  async getPublicKey(@Param('userId') userId: string) {
    const publicKey = await this.encryptionService.getPublicKey(userId);
    if (!publicKey) {
      return { publicKey: null };
    }
    return { publicKey };
  }
}
