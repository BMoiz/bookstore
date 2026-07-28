/**
 * ملف الثوابت - Constants Configuration
 * 
 * الغرض: تعريف جميع الثوابت المستخدمة في النظام
 * المدخلات: لا توجد
 * المخرجات: كائن يحتوي على جميع الثوابت
 * المسؤوليات: توحيد القيم الثابتة وتجنب القيم السحرية
 */

// مسار مجلد البيانات
const DATA_DIR = require('path').join(__dirname, '..', 'data');

// مسار ملفات البيانات
const PATHS = {
  books: require('path').join(DATA_DIR, 'books.json'),
  categories: require('path').join(DATA_DIR, 'categories.json'),
  authors: require('path').join(DATA_DIR, 'authors.json'),
  settings: require('path').join(DATA_DIR, 'settings.json'),
  admins: require('path').join(DATA_DIR, 'admins.json'),
  uploads: require('path').join(__dirname, '..', 'uploads')
};

// حالات الكتاب
const BOOK_STATUS = {
  AVAILABLE: 'available',    // متوفر
  OUT_OF_STOCK: 'out_of_stock', // نفد من المخزون
  HIDDEN: 'hidden'           // مخفي
};

// رسائل الخطأ
const MESSAGES = {
  BOOK_NOT_FOUND: 'الكتاب غير موجود',
  CATEGORY_NOT_FOUND: 'التصنيف غير موجود',
  AUTHOR_NOT_FOUND: 'المؤلف غير موجود',
  INVALID_INPUT: 'البيانات المدخلة غير صحيحة',
  DUPLICATE_NAME: 'الاسم موجود مسبقاً',
  CATEGORY_IN_USE: 'لا يمكن حذف التصنيف لأنه مستخدم في كتب',
  AUTHOR_IN_USE: 'لا يمكن حذف المؤلف لأنه مستخدم في كتب',
  UNAUTHORIZED: 'غير مصرح بالدخول',
  SERVER_ERROR: 'خطأ في الخادم'
};

// حالات HTTP
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
};

// إعدادات التصنيف الافتراضية
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'روايات', nameEn: 'Novels', createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'علوم', nameEn: 'Science', createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'تاريخ', nameEn: 'History', createdAt: new Date().toISOString() },
  { id: 'cat-4', name: 'فلسفة', nameEn: 'Philosophy', createdAt: new Date().toISOString() },
  { id: 'cat-5', name: 'أدب عربي', nameEn: 'Arabic Literature', createdAt: new Date().toISOString() },
  { id: 'cat-6', name: 'تطوير ذات', nameEn: 'Self Development', createdAt: new Date().toISOString() }
];

// إعدادات الموقع الافتراضية
const DEFAULT_SETTINGS = {
  storeName: 'مكتبة الكتاب',
  storeNameEn: 'Al-Kitab Bookstore',
  logo: '',
  phone: '+212 600 000 000',
  email: 'info@alkitab.ma',
  address: 'الدار البيضاء، المغرب',
  facebook: '',
  instagram: '',
  telegram: '',
  currency: 'MAD',
  workingHours: 'الإثنين - السبت: 9:00 - 21:00',
  updatedAt: new Date().toISOString()
};

module.exports = {
  DATA_DIR,
  PATHS,
  BOOK_STATUS,
  MESSAGES,
  STATUS_CODES,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS
};
