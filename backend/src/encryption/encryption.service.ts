import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Генерация пары RSA ключей (2048 бит)
   * @returns {publicKey: string, privateKey: string}
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Сохранение публичного ключа пользователя
   */
  async savePublicKey(userId: string, publicKey: string): Promise<void> {
    await this.prisma.userKey.upsert({
      where: { userId },
      update: { publicKey, updatedAt: new Date() },
      create: {
        userId,
        publicKey,
      },
    });
  }

  /**
   * Получение публичного ключа пользователя
   */
  async getPublicKey(userId: string): Promise<string | null> {
    const userKey = await this.prisma.userKey.findUnique({
      where: { userId },
      select: { publicKey: true },
    });

    return userKey?.publicKey || null;
  }

  /**
   * Шифрование данных публичным ключом RSA
   */
  encryptWithPublicKey(data: string, publicKey: string): string {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer,
    );
    return encrypted.toString('base64');
  }

  /**
   * Дешифрование данных приватным ключом RSA
   */
  decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer,
    );
    return decrypted.toString('utf8');
  }

  /**
   * Генерация AES ключа (256 бит)
   */
  generateAESKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Шифрование данных AES-256-GCM
   */
  encryptAES(data: string, key: string): { encrypted: string; iv: string } {
    const keyBuffer = Buffer.from(key, 'base64');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Объединяем encrypted + authTag для проверки целостности
    const encryptedWithTag = encrypted + ':' + authTag.toString('base64');

    return {
      encrypted: encryptedWithTag,
      iv: iv.toString('base64'),
    };
  }

  /**
   * Дешифрование данных AES-256-GCM
   */
  decryptAES(encryptedData: string, key: string, iv: string): string {
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    const [encrypted, authTagBase64] = encryptedData.split(':');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Шифрование AES ключа публичным ключом получателя
   */
  async encryptAESKeyForUser(
    aesKey: string,
    recipientUserId: string,
  ): Promise<string | null> {
    const publicKey = await this.getPublicKey(recipientUserId);
    if (!publicKey) {
      return null;
    }
    return this.encryptWithPublicKey(aesKey, publicKey);
  }
}
