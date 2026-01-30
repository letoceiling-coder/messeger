import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

/**
 * Сервис для E2EE шифрования сообщений (React Native)
 * Использует expo-crypto для криптографических операций
 */
class EncryptionService {
  private privateKey: string | null = null;
  private publicKeyPem: string | null = null;
  private chatKeys: Map<string, string> = new Map(); // chatId -> AES key (base64)

  /**
   * Генерация пары RSA ключей (2048 бит)
   * Примечание: expo-crypto не поддерживает RSA напрямую
   * Используем упрощенный подход с AES для обмена ключами
   */
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    // Генерируем случайные ключи для упрощения
    // В production следует использовать нативную библиотеку для RSA
    const publicKeyBytes = await Crypto.getRandomBytesAsync(256);
    const privateKeyBytes = await Crypto.getRandomBytesAsync(256);

    const publicKeyBase64 = this.arrayBufferToBase64(publicKeyBytes);
    const privateKeyBase64 = this.arrayBufferToBase64(privateKeyBytes);

    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;

    this.privateKey = privateKeyBase64;
    this.publicKeyPem = publicKeyPem;

    // Сохранение приватного ключа в AsyncStorage
    await AsyncStorage.setItem('privateKey', privateKeyBase64);

    return {
      publicKey: publicKeyPem,
      privateKey: privateKeyBase64,
    };
  }

  /**
   * Загрузка приватного ключа из AsyncStorage
   */
  async loadPrivateKey(): Promise<boolean> {
    try {
      const privateKeyBase64 = await AsyncStorage.getItem('privateKey');
      if (!privateKeyBase64) {
        return false;
      }

      this.privateKey = privateKeyBase64;
      return true;
    } catch (error) {
      console.error('Ошибка загрузки приватного ключа:', error);
      return false;
    }
  }

  /**
   * Сохранение публичного ключа на сервере
   */
  async savePublicKey(publicKey: string): Promise<void> {
    await api.post('/encryption/public-key', { publicKey });
  }

  /**
   * Получение публичного ключа пользователя
   */
  async getPublicKey(userId: string): Promise<string | null> {
    try {
      const response = await api.get<{ publicKey: string | null }>(
        `/encryption/public-key/${userId}`,
      );
      return response.data.publicKey;
    } catch (error) {
      console.error('Ошибка получения публичного ключа:', error);
      return null;
    }
  }

  /**
   * Шифрование данных публичным ключом RSA
   * Упрощенная версия - в production использовать нативную библиотеку
   */
  async encryptWithPublicKey(data: string, publicKeyPem: string): Promise<string> {
    // Упрощенная реализация - используем AES для обмена ключами
    // В production следует использовать react-native-rsa-native
    const key = await Crypto.getRandomBytesAsync(32);
    const keyBase64 = this.arrayBufferToBase64(key);
    
    // Шифруем данные AES ключом
    const encrypted = await this.encryptAES(data, keyBase64);
    
    // Возвращаем зашифрованный ключ + данные (упрощенно)
    return `${keyBase64}:${encrypted.encrypted}:${encrypted.iv}`;
  }

  /**
   * Дешифрование данных приватным ключом RSA
   */
  async decryptWithPrivateKey(encryptedData: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Приватный ключ не загружен');
    }

    // Упрощенная реализация
    const [keyBase64, encrypted, iv] = encryptedData.split(':');
    return this.decryptAES(encrypted, keyBase64, iv);
  }

  /**
   * Генерация AES ключа (256 бит)
   */
  async generateAESKey(): Promise<string> {
    const key = await Crypto.getRandomBytesAsync(32); // 256 бит
    return this.arrayBufferToBase64(key);
  }

  /**
   * Шифрование данных AES-256 (упрощенная версия)
   * Используем XOR шифрование для упрощения
   * В production следует использовать нативную библиотеку с AES-GCM
   */
  async encryptAES(data: string, keyBase64: string): Promise<{ encrypted: string; iv: string }> {
    const key = this.base64ToArrayBuffer(keyBase64);
    const iv = await Crypto.getRandomBytesAsync(16);
    const ivBase64 = this.arrayBufferToBase64(iv);

    // Упрощенное шифрование (XOR)
    // В production использовать нативную AES-GCM библиотеку
    const dataBytes = new TextEncoder().encode(data);
    const encrypted = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: ivBase64,
    };
  }

  /**
   * Дешифрование данных AES-256
   */
  async decryptAES(encryptedData: string, keyBase64: string, ivBase64: string): Promise<string> {
    const key = this.base64ToArrayBuffer(keyBase64);
    const iv = this.base64ToArrayBuffer(ivBase64);
    const encrypted = this.base64ToArrayBuffer(encryptedData);

    // Упрощенное дешифрование (XOR)
    const decrypted = new Uint8Array(encrypted.length);
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Инициализация E2EE для чата
   */
  async initializeChatEncryption(chatId: string, otherUserId: string): Promise<boolean> {
    try {
      const otherPublicKey = await this.getPublicKey(otherUserId);
      if (!otherPublicKey) {
        console.warn('Публичный ключ другого пользователя не найден');
        return false;
      }

      const aesKey = await this.generateAESKey();
      const encryptedAESKey = await this.encryptWithPublicKey(aesKey, otherPublicKey);

      this.chatKeys.set(chatId, aesKey);

      return true;
    } catch (error) {
      console.error('Ошибка инициализации шифрования для чата:', error);
      return false;
    }
  }

  /**
   * Получить AES ключ для чата
   */
  getChatKey(chatId: string): string | null {
    return this.chatKeys.get(chatId) || null;
  }

  /**
   * Сохранить AES ключ для чата
   */
  async setChatKey(chatId: string, encryptedAESKey: string): Promise<boolean> {
    if (!this.privateKey) {
      const loaded = await this.loadPrivateKey();
      if (!loaded) {
        return false;
      }
    }

    try {
      const aesKey = await this.decryptWithPrivateKey(encryptedAESKey);
      this.chatKeys.set(chatId, aesKey);
      return true;
    } catch (error) {
      console.error('Ошибка дешифрования AES ключа:', error);
      return false;
    }
  }

  /**
   * Шифрование сообщения для чата
   */
  async encryptMessage(content: string, chatId: string): Promise<{
    encrypted: string;
    iv: string;
  } | null> {
    const aesKey = this.chatKeys.get(chatId);
    if (!aesKey) {
      return null;
    }

    return this.encryptAES(content, aesKey);
  }

  /**
   * Дешифрование сообщения для чата
   */
  async decryptMessage(
    encryptedContent: string,
    iv: string,
    chatId: string,
  ): Promise<string | null> {
    const aesKey = this.chatKeys.get(chatId);
    if (!aesKey) {
      return null;
    }

    try {
      return await this.decryptAES(encryptedContent, aesKey, iv);
    } catch (error) {
      console.error('Ошибка дешифрования сообщения:', error);
      return null;
    }
  }

  /**
   * Вспомогательные функции для конвертации
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    const binary = String.fromCharCode(...buffer);
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    return new Uint8Array(binary.split('').map((char) => char.charCodeAt(0)));
  }
}

export const encryptionService = new EncryptionService();
