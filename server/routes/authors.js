/**
 * ملف مسارات المؤلفين - Authors Routes
 * 
 * الغرض: إدارة جميع عمليات CRUD للمؤلفين
 * المدخلات: طلبات HTTP مع بيانات المؤلفين
 * المخرجات: استجابة JSON مع البيانات أو رسائل الخطأ
 * Responsibilities: إضافة، تعديل، حذف، عرض المؤلفين مع منع التكرار
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/dataStore');
const { validateAuthor, sanitizeInput } = require('../utils/validator');
const { PATHS, MESSAGES, STATUS_CODES } = require('../../config/constants');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/authors
 * جلب جميع المؤلفين
 */
router.get('/', (req, res) => {
  try {
    const authors = readData(PATHS.authors);
    res.json({ success: true, data: authors });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * GET /api/authors/:id
 * جلب مؤلف واحد بالـ ID
 */
router.get('/:id', (req, res) => {
  try {
    const authors = readData(PATHS.authors);
    const author = authors.find(a => a.id === req.params.id);
    
    if (!author) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: MESSAGES.AUTHOR_NOT_FOUND 
      });
    }
    
    res.json({ success: true, data: author });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * POST /api/authors
 * إضافة مؤلف جديد
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    // التحقق من صحة البيانات
    const validation = validateAuthor(req.body);
    if (!validation.isValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        errors: validation.errors 
      });
    }
    
    // قراءة المؤلفين الحاليين
    const authors = readData(PATHS.authors);
    
    // التحقق من عدم تكرار الاسم
    const normalizedName = req.body.name.trim().toLowerCase();
    const duplicate = authors.find(a => a.name.toLowerCase() === normalizedName);
    
    if (duplicate) {
      return res.status(STATUS_CODES.CONFLICT).json({ 
        success: false, 
        message: MESSAGES.DUPLICATE_NAME 
      });
    }
    
    // إنشاء كائن المؤلف الجديد
    const newAuthor = {
      id: `author-${uuidv4()}`,
      name: sanitizeInput(req.body.name),
      bio: sanitizeInput(req.body.bio || ''),
      image: req.body.image || '',
      createdAt: new Date().toISOString()
    };
    
    // إضافة المؤلف
    authors.push(newAuthor);
    
    // حفظ البيانات
    if (!writeData(PATHS.authors, authors)) {
      throw new Error('فشل حفظ البيانات');
    }
    
    res.status(STATUS_CODES.CREATED).json({ 
      success: true, 
      message: 'تم إضافة المؤلف بنجاح',
      data: newAuthor 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * PUT /api/authors/:id
 * تعديل مؤلف
 */
router.put('/:id', authMiddleware, (req, res) => {
  try {
    // التحقق من صحة البيانات
    const validation = validateAuthor(req.body);
    if (!validation.isValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        errors: validation.errors 
      });
    }
    
    // قراءة المؤلفين الحاليين
    const authors = readData(PATHS.authors);
    const authorIndex = authors.findIndex(a => a.id === req.params.id);
    
    // التحقق من وجود المؤلف
    if (authorIndex === -1) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: MESSAGES.AUTHOR_NOT_FOUND 
      });
    }
    
    // التحقق من عدم تكرار الاسم (باستثناء المؤلف الحالي)
    const normalizedName = req.body.name.trim().toLowerCase();
    const duplicate = authors.find(a => 
      a.id !== req.params.id && a.name.toLowerCase() === normalizedName
    );
    
    if (duplicate) {
      return res.status(STATUS_CODES.CONFLICT).json({ 
        success: false, 
        message: MESSAGES.DUPLICATE_NAME 
      });
    }
    
    // تحديث بيانات المؤلف
    authors[authorIndex] = {
      ...authors[authorIndex],
      name: sanitizeInput(req.body.name),
      bio: sanitizeInput(req.body.bio || ''),
      image: req.body.image || authors[authorIndex].image,
      updatedAt: new Date().toISOString()
    };
    
    // حفظ البيانات
    if (!writeData(PATHS.authors, authors)) {
      throw new Error('فشل حفظ البيانات');
    }
    
    res.json({ 
      success: true, 
      message: 'تم تعديل المؤلف بنجاح',
      data: authors[authorIndex] 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * DELETE /api/authors/:id
 * حذف مؤلف
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    // قراءة المؤلفين الحاليين
    const authors = readData(PATHS.authors);
    const authorIndex = authors.findIndex(a => a.id === req.params.id);
    
    // التحقق من وجود المؤلف
    if (authorIndex === -1) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: MESSAGES.AUTHOR_NOT_FOUND 
      });
    }
    
    // التحقق من عدم استخدام المؤلف في كتب
    const books = readData(PATHS.books);
    const authorName = authors[authorIndex].name;
    const isUsed = books.some(book => book.author === authorName);
    
    if (isUsed) {
      return res.status(STATUS_CODES.CONFLICT).json({ 
        success: false, 
        message: MESSAGES.AUTHOR_IN_USE 
      });
    }
    
    // حذف المؤلف
    authors.splice(authorIndex, 1);
    
    // حفظ البيانات
    if (!writeData(PATHS.authors, authors)) {
      throw new Error('فشل حفظ البيانات');
    }
    
    res.json({ 
      success: true, 
      message: 'تم حذف المؤلف بنجاح' 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || MESSAGES.SERVER_ERROR 
    });
  }
});

module.exports = router;
