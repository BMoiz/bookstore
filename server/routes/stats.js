/**
 * ملف مسارات الإحصائيات - Stats Routes
 * 
 * الغرض: جلب إحصائيات لوحة التحكم
 * المدخلات: لا توجد
 * المخرجات: إحصائيات النظام
 * Responsibilities: حساب وعرض إحصائيات الكتب والتصنيفات
 */

const express = require('express');
const router = express.Router();
const { readData } = require('../utils/dataStore');
const { PATHS, BOOK_STATUS, STATUS_CODES } = require('../../config/constants');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/stats
 * جلب إحصائيات النظام
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    // قراءة البيانات
    const books = readData(PATHS.books);
    const categories = readData(PATHS.categories);
    const authors = readData(PATHS.authors);
    
    // حساب الإحصائيات
    const stats = {
      // إجمالي الكتب
      totalBooks: books.length,
      
      // الكتب حسب الحالة
      availableBooks: books.filter(b => b.status === BOOK_STATUS.AVAILABLE).length,
      outOfStockBooks: books.filter(b => b.status === BOOK_STATUS.OUT_OF_STOCK).length,
      hiddenBooks: books.filter(b => b.status === BOOK_STATUS.HIDDEN).length,
      
      // إجمالي التصنيفات
      totalCategories: categories.length,
      
      // إجمالي المؤلفين
      totalAuthors: authors.length,
      
      // متوسط التقييم
      averageRating: books.length > 0 
        ? (books.reduce((sum, b) => sum + (b.rating || 0), 0) / books.length).toFixed(1)
        : 0,
      
      // إجمالي قيمة المخزون
      totalInventoryValue: books.reduce((sum, b) => sum + (b.price * (b.stockQuantity || 0)), 0)
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: 'خطأ في جلب الإحصائيات' 
    });
  }
});

module.exports = router;
