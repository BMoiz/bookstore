/**
 * ملف مسارات الطلبات - Orders Routes
 * 
 * الغرض: معالجة طلبات العملاء وإرسالها للتليجرام
 * المدخلات: طلبات HTTP مع بيانات الطلب
 * المخرجات: استجابة JSON مع نتيجة الإرسال
 * Responsibilities: استقبال الطلبات والتحقق منها وإرسالها للتليجرام
 */

const express = require('express');
const router = express.Router();
const { readData } = require('../utils/dataStore');
const { validateOrder } = require('../utils/validator');
const { sendTelegramMessage, formatOrderMessage } = require('../utils/telegram');
const { PATHS, STATUS_CODES } = require('../../config/constants');

/**
 * POST /api/orders
 * إرسال طلب جديد
 */
router.post('/', async (req, res) => {
  try {
    // التحقق من صحة بيانات الطلب
    const validation = validateOrder(req.body);
    if (!validation.isValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        errors: validation.errors 
      });
    }
    
    // جلب بيانات الكتب للتحقق من الأسعار
    const books = readData(PATHS.books);
    
    // التحقق من صحة الكتب في الطلب
    for (const item of req.body.items) {
      const book = books.find(b => b.id === item.bookId);
      if (!book) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
          success: false, 
          message: `الكتاب ${item.bookId} غير موجود` 
        });
      }
      
      // التحقق من توفر الكمية
      if (book.status === 'out_of_stock') {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
          success: false, 
          message: `الكتاب "${book.title}" غير متوفر حالياً` 
        });
      }
    }
    
    // جلب الإعدادات للحصول على العملة
    const settings = readData(PATHS.settings);
    const currency = settings.currency || 'MAD';
    
    // تجهيز بيانات الطلب
    const orderData = {
      ...req.body,
      currency,
      createdAt: new Date().toISOString()
    };
    
    // تنسيق رسالة الطلب
    const message = formatOrderMessage(orderData, books);
    
    // إرسال الطلب إلى التليجرام
    await sendTelegramMessage(message);
    
    res.json({ 
      success: true, 
      message: 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.' 
    });
  } catch (error) {
    console.error('خطأ في معالجة الطلب:', error.message);
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: `فشل إرسال الطلب: ${error.message}` 
    });
  }
});

module.exports = router;
