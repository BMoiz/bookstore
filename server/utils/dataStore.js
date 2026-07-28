/**
 * ملف إدارة البيانات - Data Store Utility
 * 
 * الغرض: قراءة وكتابة البيانات في ملفات JSON
 * المدخلات: مسار الملف، البيانات المراد حفظها
 * المخرجات: البيانات المقروءة أو نجاح الكتابة
 * المسؤوليات: إدارة ملفات JSON بشكل آمن مع دعم التعامل المتزامن
 */

const fs = require('fs');
const path = require('path');
const { PATHS } = require('../../config/constants');

/**
 * قراءة البيانات من ملف JSON
 * @param {string} filePath - مسار الملف
 * @returns {Array} مصفوفة البيانات
 */
function readData(filePath) {
  try {
    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      // إنشاء الملف بمصفوفة فارغة إذا لم يكن موجوداً
      fs.writeFileSync(filePath, '[]', 'utf8');
      return [];
    }
    
    // قراءة محتوى الملف
    const content = fs.readFileSync(filePath, 'utf8').trim();
    
    // التحقق من أن الملف ليس فارغاً
    if (!content) {
      return [];
    }
    
    // تحليل البيانات و.returnها
    return JSON.parse(content);
  } catch (error) {
    console.error(`خطأ في قراءة الملف ${filePath}:`, error.message);
    return [];
  }
}

/**
 * كتابة البيانات في ملف JSON
 * @param {string} filePath - مسار الملف
 * @param {Array} data - البيانات المراد حفظها
 * @returns {boolean} نجاح العملية
 */
function writeData(filePath, data) {
  try {
    // إنشاء المجلد إذا لم يكن موجوداً
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // كتابة البيانات بصيغة JSON منسقة
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`خطأ في كتابة الملف ${filePath}:`, error.message);
    return false;
  }
}

/**
 * قراءة الإعدادات من ملف الإعدادات
 * @returns {Object} كائن الإعدادات
 */
function readSettings() {
  try {
    const filePath = PATHS.settings;
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
      return {};
    }
    return JSON.parse(content);
  } catch (error) {
    console.error('خطأ في قراءة الإعدادات:', error.message);
    return {};
  }
}

/**
 * كتابة الإعدادات في ملف الإعدادات
 * @param {Object} settings - الإعدادات المراد حفظها
 * @returns {boolean} نجاح العملية
 */
function writeSettings(settings) {
  try {
    const filePath = PATHS.settings;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('خطأ في كتابة الإعدادات:', error.message);
    return false;
  }
}

/**
 * حذف ملف
 * @param {string} filePath - مسار الملف المراد حذفه
 * @returns {boolean} نجاح العملية
 */
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`خطأ في حذف الملف ${filePath}:`, error.message);
    return false;
  }
}

/**
 * التحقق من وجود ملف
 * @param {string} filePath - مسار الملف
 * @returns {boolean} هل الملف موجود
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = {
  readData,
  writeData,
  readSettings,
  writeSettings,
  deleteFile,
  fileExists
};
