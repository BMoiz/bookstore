/**
 * ملف JavaScript للوحة التحكم - Admin Panel JavaScript
 * 
 * الغرض: إدارة جميع وظائف لوحة التحكم
 * المدخلات: بيانات من API الخادم
 * المخرجات: تحديث واجهة لوحة التحكم
 * Responsibilities: إدارة الكتب والتصنيفات والمؤلفين والإعدادات
 */

// المتغيرات العامة
const API_BASE = '/api';
let authToken = localStorage.getItem('admin_token');
let allBooks = [];
let allCategories = [];
let allAuthors = [];
let siteSettings = {};

/**
 * الحصول على العملة الحالية من الإعدادات
 * @returns {string} رمز العملة (مثل MAD, USD, EUR)
 */
function getCurrency() {
    return siteSettings.currency || 'MAD';
}

// ==============================
// المصادقة
// ==============================

/**
 * التحقق من حالة تسجيل الدخول
 */
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        verifyToken();
    } else {
        showLoginPage();
    }
});

/**
 * التحقق من صحة الرمز
 */
async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAdminPanel();
        } else {
            showLoginPage();
        }
    } catch (error) {
        showLoginPage();
    }
}

/**
 * تسجيل الدخول
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            localStorage.setItem('admin_token', authToken);
            showAdminPanel();
        } else {
            showLoginError(data.message);
        }
    } catch (error) {
        showLoginError('خطأ في الاتصال بالخادم');
    }
}

/**
 * تسجيل الخروج
 */
function handleLogout() {
    localStorage.removeItem('admin_token');
    authToken = null;
    showLoginPage();
}

/**
 * عرض صفحة تسجيل الدخول
 */
function showLoginPage() {
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('admin-layout').style.display = 'none';
}

/**
 * عرض لوحة التحكم
 */
function showAdminPanel() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-layout').style.display = 'flex';
    loadDashboardData();
}

/**
 * عرض خطأ تسجيل الدخول
 */
function showLoginError(message) {
    const errorEl = document.getElementById('login-error');
    document.getElementById('login-error-message').textContent = message;
    errorEl.style.display = 'flex';
    setTimeout(() => errorEl.style.display = 'none', 5000);
}

// ==============================
// تحميل البيانات
// ==============================

/**
 * تحميل بيانات لوحة التحكم
 */
async function loadDashboardData() {
    try {
        const [statsRes, booksRes, categoriesRes, authorsRes] = await Promise.all([
            fetch(`${API_BASE}/stats`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/books`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/authors`, { headers: getAuthHeaders() })
        ]);
        
        const stats = await statsRes.json();
        const books = await booksRes.json();
        const categories = await categoriesRes.json();
        const authors = await authorsRes.json();
        
        if (stats.success) updateStats(stats.data);
        if (books.success) allBooks = books.data;
        if (categories.success) allCategories = categories.data;
        if (authors.success) allAuthors = authors.data;
        
        renderBooks();
        renderCategories();
        renderAuthors();
        populateFormSelects();
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
}

/**
 * تحديث الإحصائيات
 */
function updateStats(stats) {
    document.getElementById('stat-total-books').textContent = stats.totalBooks;
    document.getElementById('stat-available').textContent = stats.availableBooks;
    document.getElementById('stat-out-of-stock').textContent = stats.outOfStockBooks;
    document.getElementById('stat-hidden').textContent = stats.hiddenBooks;
    document.getElementById('stat-categories').textContent = stats.totalCategories;
    document.getElementById('stat-authors').textContent = stats.totalAuthors;
}

// ==============================
// التنقل
// ==============================

/**
 * عرض قسم معين
 */
function showSection(section) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    
    // إظهار القسم المحدد
    document.getElementById(`section-${section}`).style.display = 'block';
    
    // تحديث العنوان
    const titles = {
        dashboard: 'لوحة التحكم',
        books: 'إدارة الكتب',
        categories: 'إدارة التصنيفات',
        authors: 'إدارة المؤلفين',
        settings: 'إعدادات الموقع'
    };
    document.getElementById('page-title').textContent = titles[section];
    
    // تحديث الرابط النشط
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    
    // تحميل الإعدادات عند الوصول لقسم الإعدادات
    if (section === 'settings') {
        loadSettings();
    }
}

/**
 * تبديل الشريط الجانبي
 */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ==============================
// إدارة الكتب
// ==============================

/**
 * عرض الكتب في الجدول
 */
function renderBooks() {
    const tbody = document.getElementById('books-table-body');
    
    tbody.innerHTML = allBooks.map(book => {
        const coverHtml = book.coverImage 
            ? `<img src="${book.coverImage}" alt="${book.title}">`
            : `<div class="placeholder"><i class="fas fa-book"></i></div>`;
        
        const statusText = {
            available: 'متوفر',
            out_of_stock: 'نفد المخزون',
            hidden: 'مخفي'
        };
        
        return `
            <tr>
                <td>
                    <div class="table-cover">${coverHtml}</div>
                </td>
                <td><strong>${book.title}</strong></td>
                <td>${book.author}</td>
                <td>${book.category}</td>
                <td>${book.price} MAD</td>
                <td><span class="status-badge ${book.status}">${statusText[book.status]}</span></td>
                <td>${book.rating || 0} ★</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon edit" onclick="editBook('${book.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteBook('${book.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * فتح نافذة إضافة كتاب
 */
function openBookModal(bookId = null) {
    const modal = document.getElementById('book-modal');
    const title = document.getElementById('book-modal-title');
    const form = document.getElementById('book-form');
    
    form.reset();
    document.getElementById('book-id').value = '';
    document.getElementById('book-cover-url').value = '';
    document.getElementById('cover-preview').style.display = 'none';
    document.getElementById('cover-placeholder').style.display = 'block';
    
    if (bookId) {
        // وضع التعديل
        const book = allBooks.find(b => b.id === bookId);
        if (book) {
            title.textContent = 'تعديل الكتاب';
            document.getElementById('book-id').value = book.id;
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-author').value = book.author;
            document.getElementById('book-category').value = book.category;
            document.getElementById('book-isbn').value = book.isbn || '';
            document.getElementById('book-price').value = book.price;
            document.getElementById('book-stock').value = book.stockQuantity || 0;
            document.getElementById('book-rating').value = book.rating || 0;
            document.getElementById('book-status').value = book.status;
            document.getElementById('book-description').value = book.description || '';
            
            if (book.coverImage) {
                document.getElementById('cover-preview').src = book.coverImage;
                document.getElementById('cover-preview').style.display = 'block';
                document.getElementById('cover-placeholder').style.display = 'none';
                document.getElementById('book-cover-url').value = book.coverImage;
            }
        }
    } else {
        title.textContent = 'إضافة كتاب جديد';
    }
    
    modal.classList.add('active');
}

/**
 * إغلاق نافذة الكتاب
 */
function closeBookModal() {
    document.getElementById('book-modal').classList.remove('active');
}

/**
 * تعديل كتاب
 */
function editBook(bookId) {
    openBookModal(bookId);
}

/**
 * حفظ الكتاب
 */
async function saveBook(event) {
    event.preventDefault();
    
    const bookId = document.getElementById('book-id').value;
    const coverUrl = document.getElementById('book-cover-url').value;
    
    const bookData = {
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        category: document.getElementById('book-category').value,
        isbn: document.getElementById('book-isbn').value,
        price: parseFloat(document.getElementById('book-price').value),
        stockQuantity: parseInt(document.getElementById('book-stock').value) || 0,
        rating: parseFloat(document.getElementById('book-rating').value) || 0,
        status: document.getElementById('book-status').value,
        description: document.getElementById('book-description').value,
        coverImage: coverUrl
    };
    
    try {
        const url = bookId ? `${API_BASE}/books/${bookId}` : `${API_BASE}/books`;
        const method = bookId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(bookData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(bookId ? 'تم تعديل الكتاب بنجاح' : 'تم إضافة الكتاب بنجاح', 'success');
            closeBookModal();
            await loadDashboardData();
        } else {
            showToast(data.message || data.errors?.join(', ') || 'حدث خطأ', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

/**
 * حذف كتاب
 */
async function deleteBook(bookId) {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;
    
    try {
        const response = await fetch(`${API_BASE}/books/${bookId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('تم حذف الكتاب بنجاح', 'success');
            await loadDashboardData();
        } else {
            showToast(data.message || 'حدث خطأ', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

// ==============================
// إدارة التصنيفات
// ==============================

/**
 * عرض التصنيفات في الجدول
 */
function renderCategories() {
    const tbody = document.getElementById('categories-table-body');
    
    tbody.innerHTML = allCategories.map(cat => `
        <tr>
            <td><strong>${cat.name}</strong></td>
            <td>${cat.nameEn || '-'}</td>
            <td>${new Date(cat.createdAt).toLocaleDateString('ar-MA')}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit" onclick="editCategory('${cat.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteCategory('${cat.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * فتح نافذة إضافة تصنيف
 */
function openCategoryModal(categoryId = null) {
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');
    
    form.reset();
    document.getElementById('category-id').value = '';
    
    if (categoryId) {
        const cat = allCategories.find(c => c.id === categoryId);
        if (cat) {
            title.textContent = 'تعديل التصنيف';
            document.getElementById('category-id').value = cat.id;
            document.getElementById('category-name').value = cat.name;
            document.getElementById('category-nameEn').value = cat.nameEn || '';
            document.getElementById('category-description').value = cat.description || '';
        }
    } else {
        title.textContent = 'إضافة تصنيف جديد';
    }
    
    modal.classList.add('active');
}

/**
 * إغلاق نافذة التصنيف
 */
function closeCategoryModal() {
    document.getElementById('category-modal').classList.remove('active');
}

/**
 * تعديل تصنيف
 */
function editCategory(categoryId) {
    openCategoryModal(categoryId);
}

/**
 * حفظ التصنيف
 */
async function saveCategory(event) {
    event.preventDefault();
    
    const categoryId = document.getElementById('category-id').value;
    
    const categoryData = {
        name: document.getElementById('category-name').value,
        nameEn: document.getElementById('category-nameEn').value,
        description: document.getElementById('category-description').value
    };
    
    try {
        const url = categoryId ? `${API_BASE}/categories/${categoryId}` : `${API_BASE}/categories`;
        const method = categoryId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(categoryData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(categoryId ? 'تم تعديل التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح', 'success');
            closeCategoryModal();
            await loadDashboardData();
        } else {
            showToast(data.message || data.errors?.join(', ') || 'حدث خطأ', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

/**
 * حذف تصنيف
 */
async function deleteCategory(categoryId) {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    
    try {
        const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('تم حذف التصنيف بنجاح', 'success');
            await loadDashboardData();
        } else {
            showToast(data.message || 'حدث خطأ', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

// ==============================
// إدارة المؤلفين
// ==============================

/**
 * عرض المؤلفين في الجدول
 */
function renderAuthors() {
    const tbody = document.getElementById('authors-table-body');
    
    tbody.innerHTML = allAuthors.map(author => `
        <tr>
            <td><strong>${author.name}</strong></td>
            <td>${author.bio || '-'}</td>
            <td>${new Date(author.createdAt).toLocaleDateString('ar-MA')}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit" onclick="editAuthor('${author.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteAuthor('${author.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * فتح نافذة إضافة مؤلف
 */
function openAuthorModal(authorId = null) {
    const modal = document.getElementById('author-modal');
    const title = document.getElementById('author-modal-title');
    const form = document.getElementById('author-form');
    
    form.reset();
    document.getElementById('author-id').value = '';
    
    if (authorId) {
        const author = allAuthors.find(a => a.id === authorId);
        if (author) {
            title.textContent = 'تعديل المؤلف';
            document.getElementById('author-id').value = author.id;
            document.getElementById('author-name').value = author.name;
            document.getElementById('author-bio').value = author.bio || '';
        }
    } else {
        title.textContent = 'إضافة مؤلف جديد';
    }
    
    modal.classList.add('active');
}

/**
 * إغلاق نافذة المؤلف
 */
function closeAuthorModal() {
    document.getElementById('author-modal').classList.remove('active');
}

/**
 * تعديل مؤلف
 */
function editAuthor(authorId) {
    openAuthorModal(authorId);
}

/**
 * حفظ المؤلف
 */
async function saveAuthor(event) {
    event.preventDefault();
    
    const authorId = document.getElementById('author-id').value;
    
    const authorData = {
        name: document.getElementById('author-name').value,
        bio: document.getElementById('author-bio').value
    };
    
    try {
        const url = authorId ? `${API_BASE}/authors/${authorId}` : `${API_BASE}/authors`;
        const method = authorId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(authorData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(authorId ? 'تم تعديل المؤلف بنجاح' : 'تم إضافة المؤلف بنجاح', 'success');
            closeAuthorModal();
            await loadDashboardData();
        } else {
            showToast(data.message || data.errors?.join(', ') || 'حدث خطأ', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

/**
 * حذف مؤلف
 */
async function deleteAuthor(authorId) {
    if (!confirm('هل أنت متأكد من حذف هذا المؤلف؟')) return;
    
    try {
        const response = await fetch(`${API_BASE}/authors/${authorId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('تم حذف المؤلف بنجاح', 'success');
            await loadDashboardData();
        } else {
            showToast(data.message || 'حدث خطأ', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

// ==============================
// الإعدادات
// ==============================

/**
 * تحميل الإعدادات
 */
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE}/settings`);
        const data = await response.json();
        
        if (data.success) {
            const settings = data.data;
            document.getElementById('setting-storeName').value = settings.storeName || '';
            document.getElementById('setting-storeNameEn').value = settings.storeNameEn || '';
            document.getElementById('setting-phone').value = settings.phone || '';
            document.getElementById('setting-email').value = settings.email || '';
            document.getElementById('setting-address').value = settings.address || '';
            document.getElementById('setting-currency').value = settings.currency || 'MAD';
            document.getElementById('setting-workingHours').value = settings.workingHours || '';
            document.getElementById('setting-facebook').value = settings.facebook || '';
            document.getElementById('setting-instagram').value = settings.instagram || '';
            document.getElementById('setting-telegram').value = settings.telegram || '';
            
            if (settings.logo) {
                document.getElementById('logo-preview').src = settings.logo;
                document.getElementById('logo-preview').style.display = 'block';
                document.getElementById('logo-placeholder').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
    }
}

/**
 * حفظ الإعدادات
 */
async function saveSettings(event) {
    event.preventDefault();
    
    const settingsData = {
        storeName: document.getElementById('setting-storeName').value,
        storeNameEn: document.getElementById('setting-storeNameEn').value,
        phone: document.getElementById('setting-phone').value,
        email: document.getElementById('setting-email').value,
        address: document.getElementById('setting-address').value,
        currency: document.getElementById('setting-currency').value,
        workingHours: document.getElementById('setting-workingHours').value,
        facebook: document.getElementById('setting-facebook').value,
        instagram: document.getElementById('setting-instagram').value,
        telegram: document.getElementById('setting-telegram').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(settingsData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('تم حفظ الإعدادات بنجاح', 'success');
        } else {
            showToast(data.message || 'حدث خطأ', 'error');
        }
    } catch (error) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

// ==============================
// رفع الصور
// ==============================

/**
 * معاينة صورة الغلاف
 */
async function previewCover(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
        showToast('يرجى اختيار ملف صورة', 'error');
        return;
    }
    
    // التحقق من حجم الملف (5 ميجابايت كحد أقصى)
    if (file.size > 5 * 1024 * 1024) {
        showToast('حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)', 'error');
        return;
    }
    
    try {
        // رفع الصورة
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('cover-preview').src = data.data.url;
            document.getElementById('cover-preview').style.display = 'block';
            document.getElementById('cover-placeholder').style.display = 'none';
            document.getElementById('book-cover-url').value = data.data.url;
            showToast('تم رفع الصورة بنجاح', 'success');
        } else {
            showToast(data.message || 'خطأ في رفع الصورة', 'error');
        }
    } catch (error) {
        showToast('خطأ في رفع الصورة', 'error');
    }
}

/**
 * معاينة شعار المتجر
 */
async function previewLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('يرجى اختيار ملف صورة', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('logo-preview').src = data.data.url;
            document.getElementById('logo-preview').style.display = 'block';
            document.getElementById('logo-placeholder').style.display = 'none';
            
            // حفظ رابط الشعار في الإعدادات
            await fetch(`${API_BASE}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ logo: data.data.url })
            });
            
            showToast('تم رفع الشعار بنجاح', 'success');
        } else {
            showToast(data.message || 'خطأ في رفع الصورة', 'error');
        }
    } catch (error) {
        showToast('خطأ في رفع الصورة', 'error');
    }
}

// ==============================
// أدوات مساعدة
// ==============================

/**
 * الحصول على رؤوس المصادقة
 */
function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${authToken}`
    };
}

/**
 * ملء قوائم الاختيار في النماذج
 */
function populateFormSelects() {
    // ملء قائمة المؤلفين
    const authorSelect = document.getElementById('book-author');
    authorSelect.innerHTML = '<option value="">اختر مؤلفاً</option>';
    allAuthors.forEach(author => {
        authorSelect.innerHTML += `<option value="${author.name}">${author.name}</option>`;
    });
    
    // ملء قائمة التصنيفات
    const categorySelect = document.getElementById('book-category');
    categorySelect.innerHTML = '<option value="">اختر تصنيفاً</option>';
    allCategories.forEach(cat => {
        categorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
}

/**
 * إظهار رسالة Toast
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toastIcon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
