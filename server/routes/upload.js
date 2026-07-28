/**
 * ملف مسارات رفع الصور - Upload Routes
 * 
 * الغرض: رفع وحذف صور الكتب
 * المدخلات: ملفات الصور
 * المخرجات: رابط الصورة المرفوعة
 * Responsibilities: رفع الصور والتحقق من نوعها وحجمها
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { PATHS, STATUS_CODES } = require('../../config/constants');
const authMiddleware = require('../middleware/auth');

// إعداد التخزين المؤقت للملفات
const storage = multer.diskStorage({
  // تحديد مجلد الحفظ
  destination: (req, file, cb) => {
    const uploadDir = PATHS.uploads;
    // إنشاء المجلد إذا لم يكن موجوداً
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  // تحديد اسم الملف
  filename: (req, file, cb) => {
    // إنشاء اسم فريد للملف
    const ext = path.extname(file.originalname);
    const filename = `cover-${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// فلتر أنواع الملفات المسموحة
const fileFilter = (req, file, cb) => {
  // الأنواع المسموحة
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مسموح. يرجى استخدام JPG أو PNG أو WebP'), false);
  }
};

// إعداد multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // الحد الأقصى 5 ميجابايت
  }
});

/**
 * POST /api/upload
 * رفع صورة جديدة
 */
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  try {
    // التحقق من وجود ملف
    if (!req.file) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        message: 'لم يتم اختيار ملف' 
      });
    }
    
    // إنشاء رابط الصورة
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      message: 'تم رفع الصورة بنجاح',
      data: { url: imageUrl, filename: req.file.filename } 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || 'خطأ في رفع الصورة' 
    });
  }
});

/**
 * DELETE /api/upload/:filename
 * حذف صورة
 */
router.delete('/:filename', authMiddleware, (req, res) => {
  try {
    const filePath = path.join(PATHS.uploads, req.params.filename);
    
    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: 'الملف غير موجود' 
      });
    }
    
    // حذف الملف
    fs.unlinkSync(filePath);
    
    res.json({ 
      success: true, 
      message: 'تم حذف الصورة بنجاح' 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: 'خطأ في حذف الصورة' 
    });
  }
});

module.exports = router;
