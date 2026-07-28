/**
 * ملف التحقق من صحة البيانات - Validation Utility
 * 
 * الغرض: التحقق من صحة البيانات المدخلة قبل حفظها
 * المدخلات: البيانات المراد التحقق منها
 * المخرجات: كائن يحتوي على صحة البيانات وأي أخطاء
 * المسؤوليات: منع حفظ البيانات غير الصالحة وحماية النظام
 */

/**
 * التحقق من بيانات الكتاب
 * @param {Object} book - بيانات الكتاب
 * @returns {Object} نتيجة التحقق
 */
function validateBook(book) {
  const errors = [];

  // التحقق من العنوان
  if (!book.title || typeof book.title !== 'string' || book.title.trim().length < 1) {
    errors.push('عنوان الكتاب مطلوب');
  } else if (book.title.length > 200) {
    errors.push('عنوان الكتاب طويل جداً (الحد الأقصى 200 حرف)');
  }

  // التحقق من المؤلف
  if (!book.author || typeof book.author !== 'string' || book.author.trim().length < 1) {
    errors.push('اسم المؤلف مطلوب');
  }

  // التحقق من التصنيف
  if (!book.category || typeof book.category !== 'string' || book.category.trim().length < 1) {
    errors.push('التصنيف مطلوب');
  }

  // التحقق من السعر
  if (book.price === undefined || book.price === null) {
    errors.push('السعر مطلوب');
  } else if (isNaN(Number(book.price)) || Number(book.price) < 0) {
    errors.push('السعر يجب أن يكون رقماً موجباً');
  }

  // التحقق من الكمية
  if (book.stockQuantity !== undefined && book.stockQuantity !== null) {
    if (isNaN(Number(book.stockQuantity)) || Number(book.stockQuantity) < 0) {
      errors.push('الكمية يجب أن تكون رقماً موجباً');
    }
  }

  // التحقق من التقييم
  if (book.rating !== undefined && book.rating !== null) {
    const rating = Number(book.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push('التقييم يجب أن يكون بين 0 و 5');
    }
  }

  // التحقق من الحالة
  const validStatuses = ['available', 'out_of_stock', 'hidden'];
  if (book.status && !validStatuses.includes(book.status)) {
    errors.push('حالة الكتاب غير صحيحة');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * التحقق من بيانات التصنيف
 * @param {Object} category - بيانات التصنيف
 * @returns {Object} نتيجة التحقق
 */
function validateCategory(category) {
  const errors = [];

  if (!category.name || typeof category.name !== 'string' || category.name.trim().length < 1) {
    errors.push('اسم التصنيف مطلوب');
  } else if (category.name.length > 50) {
    errors.push('اسم التصنيف طويل جداً (الحد الأقصى 50 حرف)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * التحقق من بيانات المؤلف
 * @param {Object} author - بيانات المؤلف
 * @returns {Object} نتيجة التحقق
 */
function validateAuthor(author) {
  const errors = [];

  if (!author.name || typeof author.name !== 'string' || author.name.trim().length < 1) {
    errors.push('اسم المؤلف مطلوب');
  } else if (author.name.length > 100) {
    errors.push('اسم المؤلف طويل جداً (الحد الأقصى 100 حرف)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * التحقق من بيانات الطلب
 * @param {Object} order - بيانات الطلب
 * @returns {Object} نتيجة التحقق
 */
function validateOrder(order) {
  const errors = [];

  // التحقق من اسم العميل
  if (!order.customerName || typeof order.customerName !== 'string' || order.customerName.trim().length < 1) {
    errors.push('اسم العميل مطلوب');
  }

  // التحقق من رقم الهاتف
  if (!order.phone || typeof order.phone !== 'string' || order.phone.trim().length < 1) {
    errors.push('رقم الهاتف مطلوب');
  }

  // التحقق من العنوان
  if (!order.address || typeof order.address !== 'string' || order.address.trim().length < 1) {
    errors.push('العنوان مطلوب');
  }

  // التحقق من المنتجات
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    errors.push('يجب أن يحتوي الطلب على منتج واحد على الأقل');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * التحقق من بيانات تسجيل الدخول
 * @param {Object} credentials - بيانات الدخول
 * @returns {Object} نتيجة التحقق
 */
function validateLogin(credentials) {
  const errors = [];

  if (!credentials.username || typeof credentials.username !== 'string' || credentials.username.trim().length < 1) {
    errors.push('اسم المستخدم مطلوب');
  }

  if (!credentials.password || typeof credentials.password !== 'string' || credentials.password.trim().length < 1) {
    errors.push('كلمة المرور مطلوبة');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * تنظيف النص من الأكواد الضارة
 * @param {string} input - النص المراد تنظيفه
 * @returns {string} النص النظيف
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

module.exports = {
  validateBook,
  validateCategory,
  validateAuthor,
  validateOrder,
  validateLogin,
  sanitizeInput
};
