/**
 * ملف مسارات المصادقة - Auth Routes
 * 
 * الغرض: إدارة تسجيل الدخول للوحة التحكم
 * المدخلات: طلبات HTTP مع بيانات الدخول
 * المخرجات: استجابة JSON مع رمز المصادقة
 * Responsibilities: التحقق من بيانات الدخول وإصدار رمز المصادقة
 */

const express = require('express');
const router = express.Router();
const { validateLogin } = require('../utils/validator');
const { STATUS_CODES } = require('../../config/constants');

// كلمة المرور الحالية (تُقرأ من ملف .env)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * POST /api/auth/login
 * تسجيل الدخول إلى لوحة التحكم
 */
router.post('/login', (req, res) => {
  try {
    // التحقق من صحة البيانات
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        errors: validation.errors 
      });
    }
    
    // التحقق من بيانات الدخول
    // اسم المستخدم: admin
    // كلمة المرور: من ملف .env
    if (req.body.username !== 'admin' || req.body.password !== ADMIN_PASSWORD) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ 
        success: false, 
        message: 'بيانات الدخول غير صحيحة' 
      });
    }
    
    // إرجاع رمز المصادقة
    res.json({ 
      success: true, 
      message: 'تم تسجيل الدخول بنجاح',
      token: req.body.password // في نظام حقيقي، نستخدم JWT
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: 'خطأ في تسجيل الدخول' 
    });
  }
});

/**
 * POST /api/auth/verify
 * التحقق من صحة رمز المصادقة
 */
router.post('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ 
        success: false, 
        message: 'غير مصرح بالدخول' 
      });
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (token !== ADMIN_PASSWORD) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ 
        success: false, 
        message: 'رمز المصادقة غير صالح' 
      });
    }
    
    res.json({ success: true, message: 'الرمز صالح' });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: 'خطأ في التحقق' 
    });
  }
});

module.exports = router;
