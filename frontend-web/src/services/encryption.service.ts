import { api } from './api';

/**
 * Сервис для E2EE шифрования сообщений
 * Использует RSA для обмена ключами и AES-256-GCM для шифрования сообщений
 */
class EncryptionService {
  private privateKey: CryptoKey | null = null;
  private chatKeys: Map<string, string> = new Map(); // chatId -> AES key (base64)

  /**
   * Генерация пары RSA ключей (2048 бит)
   * Требует безопасный контекст (HTTPS или localhost) — иначе crypto.subtle недоступен.
   */
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: CryptoKey }> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('Шифрование недоступно: откройте сайт по HTTPS');
    }
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );

    // Экспорт публичного ключа в PEM формат
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyArray = Array.from(new Uint8Array(publicKeyBuffer));
    const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyArray));
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;

    this.privateKey = keyPair.privateKey;

    // Сохранение приватного ключа в localStorage
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyArray = Array.from(new Uint8Array(privateKeyBuffer));
    const privateKeyBase64 = btoa(String.fromCharCode(...privateKeyArray));
    localStorage.setItem('privateKey', privateKeyBase64);

    return {
      publicKey: publicKeyPem,
      privateKey: keyPair.privateKey,
    };
  }

  /**
   * Загрузка приватного ключа из localStorage
   */
  async loadPrivateKey(): Promise<boolean> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return false;
    }
    const privateKeyBase64 = localStorage.getItem('privateKey');
    if (!privateKeyBase64) {
      return false;
    }

    try {
      const privateKeyArray = Uint8Array.from(
        atob(privateKeyBase64),
        (c) => c.charCodeAt(0),
      );
      this.privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyArray,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['decrypt'],
      );
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
   */
  async encryptWithPublicKey(data: string, publicKeyPem: string): Promise<string> {
    // Конвертация PEM в ArrayBuffer
    const publicKeyBase64 = publicKeyPem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');
    const publicKeyArray = Uint8Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0));

    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyArray,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt'],
    );

    const dataBuffer = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      dataBuffer,
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  /**
   * Дешифрование данных приватным ключом RSA
   */
  async decryptWithPrivateKey(encryptedData: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Приватный ключ не загружен');
    }

    const encryptedArray = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      this.privateKey,
      encryptedArray,
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Генерация AES ключа (256 бит)
   */
  async generateAESKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    );

    const keyBuffer = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));
  }

  /**
   * Шифрование данных AES-256-GCM (используя Web Crypto API)
   */
  async encryptAES(data: string, keyBase64: string): Promise<{ encrypted: string; iv: string }> {
    const keyArray = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'raw',
      keyArray,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt'],
    );

    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 бит для GCM
    const dataBuffer = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBuffer,
    );

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  }

  /**
   * Дешифрование данных AES-256-GCM (используя Web Crypto API)
   */
  async decryptAES(encryptedData: string, keyBase64: string, ivBase64: string): Promise<string> {
    const keyArray = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'raw',
      keyArray,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['decrypt'],
    );

    const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
    const encryptedArray = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedArray,
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Инициализация E2EE для чата
   * Обмен AES ключом с другим пользователем
   */
  async initializeChatEncryption(chatId: string, otherUserId: string): Promise<boolean> {
    try {
      // Получить публичный ключ другого пользователя
      const otherPublicKey = await this.getPublicKey(otherUserId);
      if (!otherPublicKey) {
        console.warn('Публичный ключ другого пользователя не найден');
        return false;
      }

      // Сгенерировать AES ключ для чата
      const aesKey = await this.generateAESKey();

      // Зашифровать AES ключ публичным ключом другого пользователя
      await this.encryptWithPublicKey(aesKey, otherPublicKey);

      // Сохранить AES ключ локально
      this.chatKeys.set(chatId, aesKey);

      // Отправить зашифрованный ключ другому пользователю через WebSocket
      // (это можно сделать через специальное событие или при первом сообщении)

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
   * Сохранить AES ключ для чата (после получения зашифрованного ключа)
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
      return null; // Шифрование не инициализировано для этого чата
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
      return null; // Шифрование не инициализировано для этого чата
    }

    try {
      return this.decryptAES(encryptedContent, aesKey, iv);
    } catch (error) {
      console.error('Ошибка дешифрования сообщения:', error);
      return null;
    }
  }
}

export const encryptionService = new EncryptionService();
