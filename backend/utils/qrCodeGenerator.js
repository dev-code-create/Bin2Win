import crypto from 'crypto';

class QRCodeGenerator {
  
  // Generate a unique user QR code
  static generateUserQRCode(userId, username) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const hash = crypto.createHash('sha256')
      .update(`${userId}_${username}_${timestamp}_${process.env.JWT_SECRET || 'default-secret'}_${randomString}`)
      .digest('hex')
      .substring(0, 16);
    
    return `SIMHASTHA_USER_${hash.toUpperCase()}`;
  }

  // Generate booth QR code
  static generateBoothQRCode(boothId, boothName) {
    const timestamp = Date.now();
    const hash = crypto.createHash('sha256')
      .update(`${boothId}_${boothName}_${timestamp}_${process.env.JWT_SECRET || 'default-secret'}`)
      .digest('hex')
      .substring(0, 16);
    
    return `SIMHASTHA_BOOTH_${hash.toUpperCase()}`;
  }

  // Validate QR code format
  static validateQRCodeFormat(qrCode, type = 'user') {
    const prefix = type === 'user' ? 'SIMHASTHA_USER_' : 'SIMHASTHA_BOOTH_';
    
    if (!qrCode || typeof qrCode !== 'string') {
      return false;
    }

    return qrCode.startsWith(prefix) && qrCode.length === (prefix.length + 16);
  }

  // Extract QR code information
  static parseQRCode(qrCode) {
    if (qrCode.startsWith('SIMHASTHA_USER_')) {
      return {
        type: 'user',
        code: qrCode.substring(15), // Remove prefix
        isValid: this.validateQRCodeFormat(qrCode, 'user')
      };
    } else if (qrCode.startsWith('SIMHASTHA_BOOTH_')) {
      return {
        type: 'booth',
        code: qrCode.substring(16), // Remove prefix
        isValid: this.validateQRCodeFormat(qrCode, 'booth')
      };
    }

    return {
      type: 'unknown',
      code: qrCode,
      isValid: false
    };
  }

  // Generate QR code data for display (includes additional metadata)
  static generateQRData(user) {
    const qrCode = this.generateUserQRCode(user._id, user.username);
    
    return {
      qrCode,
      displayData: {
        userId: user._id.toString(),
        username: user.username,
        name: user.name,
        greenCredits: user.greenCredits,
        memberSince: user.registrationDate,
        qrVersion: '1.0',
        generatedAt: new Date().toISOString()
      },
      // For QR scanner apps that support structured data
      structuredData: JSON.stringify({
        type: 'SIMHASTHA_USER',
        version: '1.0',
        userId: user._id.toString(),
        username: user.username,
        name: user.name,
        code: qrCode,
        timestamp: Date.now()
      })
    };
  }

  // Generate booth QR data
  static generateBoothQRData(booth) {
    const qrCode = this.generateBoothQRCode(booth._id, booth.name);
    
    return {
      qrCode,
      displayData: {
        boothId: booth._id.toString(),
        name: booth.name,
        location: booth.location,
        acceptedWasteTypes: booth.acceptedWasteTypes,
        operatingHours: booth.operatingHours,
        qrVersion: '1.0',
        generatedAt: new Date().toISOString()
      },
      structuredData: JSON.stringify({
        type: 'SIMHASTHA_BOOTH',
        version: '1.0',
        boothId: booth._id.toString(),
        name: booth.name,
        code: qrCode,
        timestamp: Date.now()
      })
    };
  }

  // Generate a simple alphanumeric code for backup/manual entry
  static generateBackupCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validate backup code format
  static validateBackupCode(code) {
    return /^[A-Z0-9]{8}$/.test(code);
  }
}

export default QRCodeGenerator;
