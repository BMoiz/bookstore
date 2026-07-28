/**
 * ملف مسارات التصنيفات - Categories Routes
 * 
 * الغرض: إدارة جميع عمليات CRUD للتصنيفات
 * المدخلات: طلبات HTTP مع بيانات التصنيفات
 * المخرجات: استجابة JSON مع البيانات أو رسائل الخطأ
 * Responsibilities: إضافة، تعديل، حذف، عرض التصنيفات مع منع التكرار
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/dataStore');
const { validateCategory, sanitizeInput } = require('../utils/validator');
const { PATHS, MESSAGES, STATUS_CODES } = require('../../config/constants');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/categories
 * جلب جميع التصنيفات
 */
router.get('/', (req, res) => {
  try {
    const categories = readData(PATHS.categories);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * GET /api/categories/:id
 * جلب تصنيف واحد بالـ ID
 */
router.get('/:id', (req, res) => {
  try {
    const categories = readData(PATHS.categories);
    const category = categories.find(c => c.id === req.params.id);
    
    if (!category) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: MESSAGES.CATEGORY_NOT_FOUND 
      });
    }
    
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * POST /api/categories
 * إضافة تصنيف جديد
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    // التحقق من صحة البيانات
    const validation = validateCategory(req.body);
    if (!validation.isValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        errors: validation.errors 
      });
    }
    
    // قراءة التصنيفات الحالية
    const categories = readData(PATHS.categories);
    
    // التحقق من عدم تكرار الاسم
    const normalizedName = req.body.name.trim().toLowerCase();
    const duplicate = categories.find(c => c.name.toLowerCase() === normalizedName);
    
    if (duplicate) {
      return res.status(STATUS_CODES.CONFLICT).json({ 
        success: false, 
        message: MESSAGES.DUPLICATE_NAME 
      });
    }
    
    // إنشاء كائن التصنيف الجديد
    const newCategory = {
      id: `cat-${uuidv4()}`,
      name: sanitizeInput(req.body.name),
      nameEn: sanitizeInput(req.body.nameEn || ''),
      description: sanitizeInput(req.body.description || ''),
      createdAt: new Date().toISOString()
    };
    
    // إضافة التصنيف
    categories.push(newCategory);
    
    // حفظ البيانات
    if (!writeData(PATHS.categories, categories)) {
      throw new Error('فشل حفظ البيانات');
    }
    
    res.status(STATUS_CODES.CREATED).json({ 
      success: true, 
      message: 'تم إضافة التصنيف بنجاح',
      data: newCategory 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * PUT /api/categories/:id
 * تعديل تصنيف
 */
router.put('/:id', authMiddleware, (req, res) => {
  try {
    // التحقق من صحة البيانات
    const validation = validateCategory(req.body);
    if (!validation.isValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        errors: validation.errors 
      });
    }
    
    // قراءة التصنيفات الحالية
    const categories = readData(PATHS.categories);
    const categoryIndex = categories.findIndex(c => c.id === req.params.id);
    
    // التحقق من وجود التصنيف
    if (categoryIndex === -1) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: MESSAGES.CATEGORY_NOT_FOUND 
      });
    }
    
    // التحقق من عدم تكرار الاسم (باستثناء التصنيف الحالي)
    const normalizedName = req.body.name.trim().toLowerCase();
    const duplicate = categories.find(c => 
      c.id !== req.params.id && c.name.toLowerCase() === normalizedName
    );
    
    if (duplicate) {
      return res.status(STATUS_CODES.CONFLICT).json({ 
        success: false, 
        message: MESSAGES.DUPLICATE_NAME 
      });
    }
    
    // تحديث بيانات التصنيف
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      name: sanitizeInput(req.body.name),
      nameEn: sanitizeInput(req.body.nameEn || ''),
      description: sanitizeInput(req.body.description || ''),
      updatedAt: new Date().toISOString()
    };
    
    // حفظ البيانات
    if (!writeData(PATHS.categories, categories)) {
      throw new Error('فشل حفظ البيانات');
    }
    
    res.json({ 
      success: true, 
      message: 'تم تعديل التصنيف بنجاح',
      data: categories[categoryIndex] 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * DELETE /api/categories/:id
 * حذف تصنيف
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    // قراءة التصنيفات الحالية
    const categories = readData(PATHS.categories);
    const categoryIndex = categories.findIndex(c => c.id === req.params.id);
    
    // التحقق من وجود التصنيف
    if (categoryIndex === -1) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: MESSAGES.CATEGORY_NOT_FOUND 
      });
    }
    
    // التحقق من عدم استخدام التصنيف في كتب
    const books = readData(PATHS.books);
    const categoryName = categories[categoryIndex].name;
    const isUsed = books.some(book => book.category === categoryName);
    
    if (isUsed) {
      return res.status(STATUS_CODES.CONFLICT).json({ 
        success: false, 
        message: MESSAGES.CATEGORY_IN_USE 
      });
    }
    
    // حذف التصنيف
    categories.splice(categoryIndex, 1);
    
    // حفظ البيانات
    if (!writeData(PATHS.categories, categories)) {
      throw new Error('فشل حفظ البيانات');
    }
    
    res.json({ 
      success: true, 
      message: 'تم حذف التصنيف بنجاح' 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || MESSAGES.SERVER_ERROR 
    });
  }
});

module.exports = router;
