/**
 * ملف مسارات الكتب - Books Routes
 * 
 * الغرض: إدارة جميع عمليات CRUD للكتب
 * المدخلات: طلبات HTTP مع بيانات الكتب
 * المخرجات: استجابة JSON مع البيانات أو رسائل الخطأ
 * Responsibilities: إضافة، تعديل، حذف، عرض، بحث الكتب
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/dataStore');
const { validateBook, sanitizeInput } = require('../utils/validator');
const { PATHS, BOOK_STATUS, MESSAGES, STATUS_CODES } = require('../../config/constants');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/books
 * جلب جميع الكتب (للوحة التحكم - تشمل المخفية)
 */
router.get('/', (req, res) => {
  try {
    const books = readData(PATHS.books);
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * GET /api/books/public
 * جلب الكتب المتاحة للعرض العام (لا تشمل المخفية)
 */
router.get('/public', (req, res) => {
  try {
    const books = readData(PATHS.books);
    
    // تصفية الكتب المخفية
    const publicBooks = books.filter(book => book.status !== BOOK_STATUS.HIDDEN);
    
    res.json({ success: true, data: publicBooks });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * GET /api/books/search
 * البحث في الكتب
 */
router.get('/search', (req, res) => {
  try {
    const { q, category, author, minPrice, maxPrice, status, sort } = req.query;
    
    let books = readData(PATHS.books);
    
    // تصفية الكتب المخفية للبحث العام
    books = books.filter(book => book.status !== BOOK_STATUS.HIDDEN);
    
    // البحث بالعنوان
    if (q) {
      const query = q.toLowerCase();
      books = books.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.description && book.description.toLowerCase().includes(query))
      );
    }
    
    // التصفية بالتصنيف
    if (category) {
      books = books.filter(book => book.category === category);
    }
    
    // التصفية بالمؤلف
    if (author) {
      books = books.filter(book => book.author === author);
    }
    
    // التصفية بالسعر
    if (minPrice) {
      books = books.filter(book => book.price >= Number(minPrice));
    }
    if (maxPrice) {
      books = books.filter(book => book.price <= Number(maxPrice));
    }
    
    // التصفية بالحالة
    if (status) {
      books = books.filter(book => book.status === status);
    }
    
    // الترتيب
    if (sort) {
      switch (sort) {
        case 'newest':
          books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'price_asc':
          books.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          books.sort((a, b) => b.price - a.price);
          break;
        case 'alpha':
          books.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
          break;
        case 'rating':
          books.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        default:
          // الترتيب الافتراضي: الأحدث أولاً
          books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }
    
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * GET /api/books/featured
 * جلب الكتب المميزة (الأعلى تقييماً)
 */
router.get('/featured', (req, res) => {
  try {
    let books = readData(PATHS.books);
    
    // تصفية الكتب المخفية وغير المتوفرة
    books = books.filter(book => 
      book.status !== BOOK_STATUS.HIDDEN && 
      book.status === BOOK_STATUS.AVAILABLE
    );
    
    // ترتيب حسب التقييم
    books.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    // إرجاع أول 8 كتب
    res.json({ success: true, data: books.slice(0, 8) });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * GET /api/books/new-arrivals
 * جلب أحدث الكتب
 */
router.get('/new-arrivals', (req, res) => {
  try {
    let books = readData(PATHS.books);
    
    // تصفية الكتب المخفية
    books = books.filter(book => book.status !== BOOK_STATUS.HIDDEN);
    
    // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // إرجاع أول 8 كتب
    res.json({ success: true, data: books.slice(0, 8) });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * GET /api/books/best-sellers
 * جلب الأكثر مبيعاً (الأكثر كميةً)
 */
router.get('/best-sellers', (req, res) => {
  try {
    let books = readData(PATHS.books);
    
    // تصفية الكتب المخفية والمتوفرة فقط
    books = books.filter(book => 
      book.status !== BOOK_STATUS.HIDDEN && 
      book.status === BOOK_STATUS.AVAILABLE
    );
    
    // ترتيب حسب عدد المبيعات (simulated by stockQuantity inverse)
    books.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    
    // إرجاع أول 8 كتب
    res.json({ success: true, data: books.slice(0, 8) });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * GET /api/books/:id
 * جلب كتاب واحد بالـ ID
 */
router.get('/:id', (req, res) => {
  try {
    const books = readData(PATHS.books);
    const book = books.find(b => b.id === req.params.id);
    
    if (!book) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: MESSAGES.BOOK_NOT_FOUND 
      });
    }
    
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * POST /api/books
 * إضافة كتاب جديد
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    // التحقق من صحة البيانات
    const validation = validateBook(req.body);
    if (!validation.isValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        errors: validation.errors 
      });
    }
    
    // قراءة الكتب الحالية
    const books = readData(PATHS.books);
    
    // إنشاء كائن الكتاب الجديد
    const newBook = {
      id: `book-${uuidv4()}`,
      title: sanitizeInput(req.body.title),
      author: sanitizeInput(req.body.author),
      category: sanitizeInput(req.body.category),
      isbn: sanitizeInput(req.body.isbn || ''),
      description: sanitizeInput(req.body.description || ''),
      price: Number(req.body.price),
      stockQuantity: Number(req.body.stockQuantity || 0),
      coverImage: req.body.coverImage || '',
      rating: Number(req.body.rating || 0),
      status: req.body.status || BOOK_STATUS.AVAILABLE,
      soldCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // إضافة الكتاب
    books.push(newBook);
    
    // حفظ البيانات
    if (!writeData(PATHS.books, books)) {
      throw new Error('فشل حفظ البيانات');
    }
    
    res.status(STATUS_CODES.CREATED).json({ 
      success: true, 
      message: 'تم إضافة الكتاب بنجاح',
      data: newBook 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * PUT /api/books/:id
 * تعديل كتاب
 */
router.put('/:id', authMiddleware, (req, res) => {
  try {
    // التحقق من صحة البيانات
    const validation = validateBook(req.body);
    if (!validation.isValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false, 
        errors: validation.errors 
      });
    }
    
    // قراءة الكتب الحالية
    const books = readData(PATHS.books);
    const bookIndex = books.findIndex(b => b.id === req.params.id);
    
    // التحقق من وجود الكتاب
    if (bookIndex === -1) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: MESSAGES.BOOK_NOT_FOUND 
      });
    }
    
    // تحديث بيانات الكتاب
    books[bookIndex] = {
      ...books[bookIndex],
      title: sanitizeInput(req.body.title),
      author: sanitizeInput(req.body.author),
      category: sanitizeInput(req.body.category),
      isbn: sanitizeInput(req.body.isbn || ''),
      description: sanitizeInput(req.body.description || ''),
      price: Number(req.body.price),
      stockQuantity: Number(req.body.stockQuantity || 0),
      coverImage: req.body.coverImage || books[bookIndex].coverImage,
      rating: Number(req.body.rating || 0),
      status: req.body.status || books[bookIndex].status,
      updatedAt: new Date().toISOString()
    };
    
    // حفظ البيانات
    if (!writeData(PATHS.books, books)) {
      throw new Error('فشل حفظ البيانات');
    }
    
    res.json({ 
      success: true, 
      message: 'تم تعديل الكتاب بنجاح',
      data: books[bookIndex] 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || MESSAGES.SERVER_ERROR 
    });
  }
});

/**
 * DELETE /api/books/:id
 * حذف كتاب
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    // قراءة الكتب الحالية
    const books = readData(PATHS.books);
    const bookIndex = books.findIndex(b => b.id === req.params.id);
    
    // التحقق من وجود الكتاب
    if (bookIndex === -1) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false, 
        message: MESSAGES.BOOK_NOT_FOUND 
      });
    }
    
    // حذف الكتاب
    books.splice(bookIndex, 1);
    
    // حفظ البيانات
    if (!writeData(PATHS.books, books)) {
      throw new Error('فشل حفظ البيانات');
    }
    
    res.json({ 
      success: true, 
      message: 'تم حذف الكتاب بنجاح' 
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ 
      success: false, 
      message: error.message || MESSAGES.SERVER_ERROR 
    });
  }
});

module.exports = router;
