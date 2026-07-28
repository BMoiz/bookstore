/**
 * ملف middleware معالجة الأخطاء - Error Handler Middleware
 * 
 * الغرض: التقاط ومعالجة جميع الأخطاء في التطبيق
 * المدخلات: خطأ، طلب HTTP، استجابة HTTP
 * المخرجات: استجابة خطأ منسقة
 * Responsibilities: منع تسريب معلومات النظام وتقديم رسائل مفيدة
 */

/**
 * middleware معالجة الأخطاء العامة
 */
function errorHandler(err, req, res, next) {
  // تسجيل الخطأ في السيرفر (لل开发者)
  console.error('خطأ:', err.message);
  
  // تحديد حالة الخطأ
  const statusCode = err.statusCode || 500;
  
  // رسالة الخطأ للمستخدم
  const message = err.statusCode 
    ? err.message 
    : 'خطأ داخلي في الخادم';

  // إرسال استجابة الخطأ
  res.status(statusCode).json({
    success: false,
    message,
    // لا نُظهر تفاصيل الخطأ في بيئة الإنتاج
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * middleware التقاط المسارات غير الموجودة
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود'
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
