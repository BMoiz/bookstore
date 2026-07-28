/**
 * ملف التطبيق الرئيسي - Main Application JavaScript
 * 
 * الغرض: إدارة وظائف الموقع الرئيسية
 * المدخلات: بيانات من API الخادم
 * المخرجات: تحديث واجهة المستخدم
 * Responsibilities: تحميل البيانات وعرضها وإدارة البحث والفلاتر
 */

// المتغيرات العامة
const API_BASE = '/api';
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
// تهيئة التطبيق
// ==============================

/**
 * تحميل البيانات عند بدء الصفحة
 */
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    setupEventListeners();
});

/**
 * تحميل البيانات الأولية
 */
async function loadInitialData() {
    try {
        showLoading();
        
        // تحميل الكتب والتصنيفات والمؤلفين والإعدادات
        await Promise.all([
            loadBooks(),
            loadCategories(),
            loadAuthors(),
            loadSettings()
        ]);
        
        // عرض الكتب في الأقسام المختلفة
        displayFeaturedBooks();
        displayNewArrivals();
        displayBestSellers();
        displayCategories();
        
        hideLoading();
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        hideLoading();
        showToast('خطأ في تحميل البيانات', 'error');
    }
}

/**
 * تحميل الكتب من الخادم
 */
async function loadBooks() {
    try {
        const response = await fetch(`${API_BASE}/books/public`);
        const data = await response.json();
        
        if (data.success) {
            allBooks = data.data;
            updateStats();
        }
    } catch (error) {
        console.error('خطأ في تحميل الكتب:', error);
    }
}

/**
 * تحميل التصنيفات من الخادم
 */
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const data = await response.json();
        
        if (data.success) {
            allCategories = data.data;
            populateCategoryFilter();
        }
    } catch (error) {
        console.error('خطأ في تحميل التصنيفات:', error);
    }
}

/**
 * تحميل المؤلفين من الخادم
 */
async function loadAuthors() {
    try {
        const response = await fetch(`${API_BASE}/authors`);
        const data = await response.json();
        
        if (data.success) {
            allAuthors = data.data;
        }
    } catch (error) {
        console.error('خطأ في تحميل المؤلفين:', error);
    }
}

/**
 * تحميل إعدادات الموقع
 */
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE}/settings`);
        const data = await response.json();
        
        if (data.success) {
            siteSettings = data.data;
            updateSiteSettings(data.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
    }
}

// ==============================
// عرض البيانات
// ==============================

/**
 * عرض الكتب المميزة
 */
function displayFeaturedBooks() {
    const container = document.getElementById('featured-books');
    const featured = allBooks
        .filter(book => book.status === 'available' && book.rating >= 4)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8);
    
    container.innerHTML = featured.map(book => createBookCard(book)).join('');
}

/**
 * عرض أحدث الكتب
 */
function displayNewArrivals() {
    const container = document.getElementById('new-arrivals-books');
    const newest = [...allBooks]
        .filter(book => book.status !== 'hidden')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);
    
    container.innerHTML = newest.map(book => createBookCard(book)).join('');
}

/**
 * عرض الأكثر مبيعاً
 */
function displayBestSellers() {
    const container = document.getElementById('best-sellers-books');
    const bestSellers = [...allBooks]
        .filter(book => book.status === 'available')
        .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
        .slice(0, 8);
    
    container.innerHTML = bestSellers.map(book => createBookCard(book)).join('');
}

/**
 * عرض التصنيفات
 */
function displayCategories() {
    const container = document.getElementById('categories-grid');
    const icons = ['fa-book', 'fa-flask', 'fa-history', 'fa-lightbulb', 'fa-feather-alt', 'fa-chart-line'];
    
    container.innerHTML = allCategories.map((cat, index) => `
        <div class="category-card" onclick="filterByCategory('${cat.name}')">
            <i class="fas ${icons[index % icons.length]}"></i>
            <h3>${cat.name}</h3>
        </div>
    `).join('');
}

/**
 * إنشاء بطاقة كتاب
 * @param {Object} book - بيانات الكتاب
 * @returns {string} HTML لبطاقة الكتاب
 */
function createBookCard(book) {
    // تحديد حالة الكتاب
    const isAvailable = book.status === 'available';
    const statusClass = isAvailable ? 'available' : 'out-of-stock';
    const statusText = isAvailable ? 'متوفر' : 'نفد من المخزون';
    
    // إنشاء صورة الغلاف
    const coverHtml = book.coverImage 
        ? `<img src="${book.coverImage}" alt="${book.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
        : '';
    
    const placeholderStyle = book.coverImage ? 'display: none' : 'display: flex';
    
    // إنشاء التقييم
    const ratingStars = '★'.repeat(Math.floor(book.rating || 0)) + '☆'.repeat(5 - Math.floor(book.rating || 0));
    
    return `
        <div class="book-card">
            <div class="book-cover">
                ${coverHtml}
                <div class="placeholder-icon" style="${placeholderStyle}">
                    <i class="fas fa-book"></i>
                </div>
                <span class="book-status-badge ${statusClass}">${statusText}</span>
                <span class="book-rating">
                    <i class="fas fa-star"></i>
                    ${(book.rating || 0).toFixed(1)}
                </span>
            </div>
            <div class="book-info">
                <div class="book-category">${book.category}</div>
                <h3 class="book-title">${book.title}</h3>
                <div class="book-author">${book.author}</div>
                ${book.description ? `<p class="book-description">${book.description}</p>` : ''}
                <div class="book-footer">
                    <div class="book-price">
                        ${book.price} <span class="currency">${getCurrency()}</span>
                    </div>
                    <button class="btn-add-cart" 
                            onclick="addToCart('${book.id}')"
                            ${!isAvailable ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${isAvailable ? 'أضف للسلة' : 'غير متوفر'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==============================
// البحث والفلاتر
// ==============================

/**
 * إعداد مستمعي الأحداث
 */
function setupEventListeners() {
    // البحث الفوري
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(performSearch, 300));
    }
    
    const heroSearchInput = document.getElementById('hero-search-input');
    if (heroSearchInput) {
        heroSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performHeroSearch();
            }
        });
    }
}

/**
 * تنفيذ البحث
 */
function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        applyFilters();
    } else {
        // إعادة تحميل جميع الكتب
        displayFeaturedBooks();
        displayNewArrivals();
        displayBestSellers();
    }
}

/**
 * البحث من Hero
 */
function performHeroSearch() {
    const query = document.getElementById('hero-search-input').value.trim();
    if (query) {
        document.getElementById('search-input').value = query;
        applyFilters();
        
        // التمرير إلى قسم الكتب
        document.getElementById('filters').scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * تطبيق الفلاتر
 */
function applyFilters() {
    const category = document.getElementById('filter-category').value;
    const priceRange = document.getElementById('filter-price').value;
    const sort = document.getElementById('filter-sort').value;
    const searchQuery = document.getElementById('search-input').value.trim().toLowerCase();
    
    let filtered = [...allBooks].filter(book => book.status !== 'hidden');
    
    // الفلتر بالبحث
    if (searchQuery) {
        filtered = filtered.filter(book => 
            book.title.toLowerCase().includes(searchQuery) ||
            book.author.toLowerCase().includes(searchQuery) ||
            book.description.toLowerCase().includes(searchQuery)
        );
    }
    
    // الفلتر بالتصنيف
    if (category) {
        filtered = filtered.filter(book => book.category === category);
    }
    
    // الفلتر بالسعر
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(p => p === '+' ? Infinity : Number(p));
        filtered = filtered.filter(book => {
            if (max === undefined || max === Infinity) {
                return book.price >= min;
            }
            return book.price >= min && book.price <= max;
        });
    }
    
    // الترتيب
    switch (sort) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'price_asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'alpha':
            filtered.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
            break;
        case 'rating':
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
    }
    
    // عرض النتائج
    displayFilteredBooks(filtered);
}

/**
 * عرض الكتب المفلترة
 */
function displayFilteredBooks(books) {
    // إخفاء الأقسام الرئيسية وإظهار قسم جميع الكتب
    document.getElementById('featured').style.display = 'none';
    document.getElementById('categories').style.display = 'none';
    document.getElementById('new-arrivals').style.display = 'none';
    document.getElementById('best-sellers').style.display = 'none';
    document.getElementById('all-books-section').style.display = 'block';
    
    const container = document.getElementById('all-books-grid');
    
    if (books.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-secondary);">لم يتم العثور على نتائج</h3>
                <p style="color: var(--text-secondary);">جرب البحث بكلمات مختلفة</p>
            </div>
        `;
    } else {
        container.innerHTML = books.map(book => createBookCard(book)).join('');
    }
    
    // التمرير إلى قسم الفلاتر
    document.getElementById('filters').scrollIntoView({ behavior: 'smooth' });
}

/**
 * عرض جميع الكتب
 */
function showAllBooks(type) {
    let books;
    
    switch (type) {
        case 'featured':
            books = allBooks.filter(book => book.status === 'available' && book.rating >= 4);
            break;
        case 'newest':
            books = [...allBooks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'best-sellers':
            books = [...allBooks].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
            break;
        default:
            books = allBooks;
    }
    
    displayFilteredBooks(books.filter(book => book.status !== 'hidden'));
}

/**
 * إغلاق عرض جميع الكتب
 */
function closeAllBooks() {
    document.getElementById('featured').style.display = 'block';
    document.getElementById('categories').style.display = 'block';
    document.getElementById('new-arrivals').style.display = 'block';
    document.getElementById('best-sellers').style.display = 'block';
    document.getElementById('all-books-section').style.display = 'none';
    
    document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
}

/**
 * الفلتر حسب التصنيف
 */
function filterByCategory(category) {
    document.getElementById('filter-category').value = category;
    applyFilters();
}

/**
 * ملء قائمة الفلتر بالتصنيفات
 */
function populateCategoryFilter() {
    const select = document.getElementById('filter-category');
    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

// ==============================
// تحديث الإحصائيات
// ==============================

/**
 * تحديث إحصائيات الموقع
 */
function updateStats() {
    const totalBooks = allBooks.length;
    const totalCategories = allCategories.length;
    const totalAuthors = allAuthors.length;
    
    document.getElementById('total-books').textContent = totalBooks;
    document.getElementById('total-categories').textContent = totalCategories;
    document.getElementById('total-authors').textContent = totalAuthors;
}

/**
 * تحديث إعدادات الموقع
 */
function updateSiteSettings(settings) {
    // تحديث اسم المتجر
    if (settings.storeName) {
        document.getElementById('store-name').textContent = settings.storeName;
        document.getElementById('footer-store-name').textContent = settings.storeName;
        document.getElementById('footer-copyright-name').textContent = settings.storeName;
        document.title = `${settings.storeName} - أفضل الكتب`;
    }
    
    // تحديث معلومات الاتصال
    const contactInfo = document.getElementById('contact-info');
    contactInfo.innerHTML = `
        <div class="contact-item">
            <i class="fas fa-phone"></i>
            <span>${settings.phone || 'غير محدد'}</span>
        </div>
        <div class="contact-item">
            <i class="fas fa-envelope"></i>
            <span>${settings.email || 'غير محدد'}</span>
        </div>
        <div class="contact-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${settings.address || 'غير محدد'}</span>
        </div>
        <div class="contact-item">
            <i class="fas fa-clock"></i>
            <span>${settings.workingHours || 'غير محدد'}</span>
        </div>
    `;
    
    // تحديث روابط التواصل الاجتماعي
    const socialLinks = document.getElementById('social-links');
    let socialHtml = '';
    
    if (settings.facebook) {
        socialHtml += `<a href="${settings.facebook}" target="_blank" class="social-link"><i class="fab fa-facebook-f"></i></a>`;
    }
    if (settings.instagram) {
        socialHtml += `<a href="${settings.instagram}" target="_blank" class="social-link"><i class="fab fa-instagram"></i></a>`;
    }
    if (settings.telegram) {
        socialHtml += `<a href="${settings.telegram}" target="_blank" class="social-link"><i class="fab fa-telegram-plane"></i></a>`;
    }
    
    socialLinks.innerHTML = socialHtml;
}

// ==============================
// أدوات مساعدة
// ==============================

/**
 * تأخير التنفيذ (Debounce)
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * إظهار رسالة التحميل
 */
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

/**
 * إخفاء رسالة التحميل
 */
function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
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
