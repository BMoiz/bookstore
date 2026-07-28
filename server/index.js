/**
 * ملف الخادم الرئيسي - Main Server File
 * 
 * الغرض: تشغيل خادم Express وربط جميع المسارات
 * المدخلات: ملفات البيئة والتكوين
 * المخرجات: خادم يعمل على المنفذ المحدد
 * Responsibilities: إعداد الخادم وربط المسارات والmiddleware
 */

// تحميل متغيرات البيئة من ملف .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// استيراد المسارات
const booksRoutes = require('./routes/books');
const categoriesRoutes = require('./routes/categories');
const authorsRoutes = require('./routes/authors');
const settingsRoutes = require('./routes/settings');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const statsRoutes = require('./routes/stats');

// استيراد middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// استيراد الثوابت
const { PATHS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } = require('../config/constants');

// إنشاء تطبيق Express
const app = express();

// تحديد المنفذ
const PORT = process.env.PORT || 3000;

/**
 * تهيئة ملفات البيانات الافتراضية
 */
function initializeDataFiles() {
  console.log('جاري تهيئة ملفات البيانات...');
  
  // التحقق من وجود مجلد البيانات
  if (!fs.existsSync(path.join(__dirname, '..', 'data'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
  }
  
  // تهيئة ملف التصنيفات إذا لم يكن موجوداً
  const categoriesPath = PATHS.categories;
  if (!fs.existsSync(categoriesPath)) {
    fs.writeFileSync(categoriesPath, JSON.stringify(DEFAULT_CATEGORIES, null, 2));
    console.log('✓ تم إنشاء ملف التصنيفات الافتراضي');
  }
  
  // تهيئة ملف المؤلفين إذا لم يكن موجوداً
  const authorsPath = PATHS.authors;
  if (!fs.existsSync(authorsPath)) {
    fs.writeFileSync(authorsPath, '[]', 'utf8');
    console.log('✓ تم إنشاء ملف المؤلفين');
  }
  
  // تهيئة ملف الكتب إذا لم يكن موجوداً
  const booksPath = PATHS.books;
  if (!fs.existsSync(booksPath)) {
    fs.writeFileSync(booksPath, '[]', 'utf8');
    console.log('✓ تم إنشاء ملف الكتب');
  }
  
  // تهيئة ملف الإعدادات إذا لم يكن موجوداً
  const settingsPath = PATHS.settings;
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    console.log('✓ تم إنشاء ملف الإعدادات الافتراضي');
  }
  
  // التحقق من وجود مجلد الرفع
  if (!fs.existsSync(PATHS.uploads)) {
    fs.mkdirSync(PATHS.uploads, { recursive: true });
    console.log('✓ تم إنشاء مجلد الرفع');
  }
  
  console.log('✓ تم تهيئة ملفات البيانات بنجاح');
}

/**
 * إعداد middleware
 */
function setupMiddleware() {
  // تحليل الطلبات JSON
  app.use(express.json({ limit: '10mb' }));
  
  // تحليل الطلبات URL-encoded
  app.use(express.urlencoded({ extended: true }));
  
  // تمكين CORS
  app.use(cors());
  
  // تقديم ملفات الموقع العام
  app.use(express.static(path.join(__dirname, '..', 'client')));
  
  // تقديم ملفات لوحة التحكم
  app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
  
  // تقديم ملفات الرفع
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
}

/**
 * إعداد مسارات API
 */
function setupRoutes() {
  // مسارات API
  app.use('/api/books', booksRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/authors', authorsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/stats', statsRoutes);
  
  // مسار لوحة التحكم
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
  });
  
  // مسار الصفحة الرئيسية
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
  });
}

/**
 * بدء تشغيل الخادم
 */
function startServer() {
  // تهيئة ملفات البيانات
  initializeDataFiles();
  
  // إعداد middleware
  setupMiddleware();
  
  // إعداد المسارات
  setupRoutes();
  
  // معالجة الأخطاء
  app.use(errorHandler);
  app.use(notFoundHandler);
  
  // بدء الاستماع
  app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 نظام إدارة المكتبة - BookStore Management System');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 الموقع: http://localhost:${PORT}`);
    console.log(`🔧 لوحة التحكم: http://localhost:${PORT}/admin`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
}

// بدء تشغيل الخادم
startServer();

module.exports = app;
