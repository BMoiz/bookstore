/**
 * ملف middleware المصادقة - Authentication Middleware
 * 
 * الغرض: التحقق من صحة الدخول قبل الوصول للمسارات المحمية
 * المدخلات: طلب HTTP مع رمز المصادقة
 * المخرجات: السماح أو رفض الطلب
 * Responsibilities: حماية لوحة التحكم من الوصول غير المصرح به
 */

// كلمة مرور لوحة التحكم الافتراضية (تُقرأ من ملف .env)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * middleware التحقق من المصادقة
 * يتحقق من وجود كلمة المرور في الهيدر أو الكوكيز
 */
function authMiddleware(req, res, next) {
  // الحصول على رمز المصادقة من الهيدر
  const authHeader = req.headers.authorization;
  
  // التحقق من وجود الهيدر
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'غير مصرح بالدخول - يرجى تسجيل الدخول' 
    });
  }

  // استخراج كلمة المرور من الهيدر
  // الصيغة: "Bearer كلمة-المرور"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  // التحقق من صحة كلمة المرور
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ 
      success: false, 
      message: 'كلمة المرور غير صحيحة' 
    });
  }

  // المتابعة للمسار التالي
  next();
}

module.exports = authMiddleware;
