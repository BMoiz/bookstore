/**
 * ملف مسارات الإعدادات - Settings Routes
 * 
 * الغرض: إدارة إعدادات الموقع من لوحة التحكم
 * المدخلات: طلبات HTTP مع إعدادات الموقع
 * المخرجات: استجابة JSON مع الإعدادات
 * Responsibilities: قراءة وحفظ إعدادات الموقع
 */

const express = require('express');
const router = express.Router();
const { readSettings, writeSettings } = require('../utils/dataStore');
const { sanitizeInput } = require('../utils/validator');
const { DEFAULT_SETTINGS, STATUS_CODES } = require('../../config/constants');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/settings
 * جلب إعدادات الموقع
 */
router.get('/', (req, res) => {
  try {
    const settings = readSettings();
    
    // دمج الإعدادات مع الافتراضية
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
    
    res.json({ success: true, data: mergedSettings });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: 'خطأ في جلب الإعدادات' 
    });
  }
});

/**
 * PUT /api/settings
 * تحديث إعدادات الموقع
 */
router.put('/', authMiddleware, (req, res) => {
  try {
    // قراءة الإعدادات الحالية
    const currentSettings = readSettings();
    
    // تحديث الإعدادات
    const updatedSettings = {
      ...currentSettings,
      storeName: sanitizeInput(req.body.storeName || currentSettings.storeName),
      storeNameEn: sanitizeInput(req.body.storeNameEn || currentSettings.storeNameEn),
      logo: req.body.logo !== undefined ? req.body.logo : currentSettings.logo,
      phone: sanitizeInput(req.body.phone || currentSettings.phone),
      email: sanitizeInput(req.body.email || currentSettings.email),
      address: sanitizeInput(req.body.address || currentSettings.address),
      facebook: sanitizeInput(req.body.facebook || currentSettings.facebook),
      instagram: sanitizeInput(req.body.instagram || currentSettings.instagram),
      telegram: sanitizeInput(req.body.telegram || currentSettings.telegram),
      currency: sanitizeInput(req.body.currency || currentSettings.currency),
      workingHours: sanitizeInput(req.body.workingHours || currentSettings.workingHours),
      updatedAt: new Date().toISOString()
    };
    
    // حفظ الإعدادات
    if (!writeSettings(updatedSettings)) {
      throw new Error('فشل حفظ الإعدادات');
    }
    
    res.json({ 
      success: true, 
      message: 'تم تحديث الإعدادات بنجاح',
      data: updatedSettings 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || 'خطأ في تحديث الإعدادات' 
    });
  }
});

module.exports = router;
