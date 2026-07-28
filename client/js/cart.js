/**
 * ملف سلة المشتريات - Shopping Cart JavaScript
 * 
 * الغرض: إدارة سلة المشتريات
 * المدخلات: بيانات الكتب المضافة للسلة
 * المخرجات: تحديث واجهة السلة
 * Responsibilities: إضافة، حذف، تعديل الكمية، حفظ السلة في LocalStorage
 */

// مفتاح التخزين في LocalStorage
const CART_STORAGE_KEY = 'bookstore_cart';

// متغير لتخزين مراجع DOM
let cartSidebar = null;
let cartOverlay = null;

// ==============================
// تهيئة السلة
// ==============================

/**
 * تحميل السلة من التخزين المحلي
 * @returns {Array} مصفوفة عناصر السلة
 */
function loadCart() {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
        console.error('خطأ في تحميل السلة:', error);
        return [];
    }
}

/**
 * حفظ السلة في التخزين المحلي
 * @param {Array} cart - مصفوفة عناصر السلة
 */
function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartUI();
    } catch (error) {
        console.error('خطأ في حفظ السلة:', error);
    }
}

// ==============================
// عمليات السلة
// ==============================

/**
 * إضافة كتاب إلى السلة
 * @param {string} bookId - معرف الكتاب
 */
function addToCart(bookId) {
    // العثور على الكتاب في البيانات
    const book = allBooks.find(b => b.id === bookId);
    if (!book) {
        showToast('الكتاب غير موجود', 'error');
        return;
    }
    
    // التحقق من توفر الكتاب
    if (book.status !== 'available') {
        showToast('الكتاب غير متوفر حالياً', 'error');
        return;
    }
    
    // تحميل السلة الحالية
    const cart = loadCart();
    
    // التحقق من وجود الكتاب في السلة
    const existingItem = cart.find(item => item.bookId === bookId);
    
    if (existingItem) {
        // زيادة الكمية
        existingItem.quantity += 1;
    } else {
        // إضافة عنصر جديد
        cart.push({
            bookId: bookId,
            quantity: 1
        });
    }
    
    // حفظ السلة
    saveCart(cart);
    
    // عرض رسالة نجاح
    showToast('تمت إضافة الكتاب إلى السلة', 'success');
    
    // فتح السلة
    openCart();
}

/**
 * حذف كتاب من السلة
 * @param {string} bookId - معرف الكتاب
 */
function removeFromCart(bookId) {
    let cart = loadCart();
    cart = cart.filter(item => item.bookId !== bookId);
    saveCart(cart);
}

/**
 * تعديل كمية الكتاب
 * @param {string} bookId - معرف الكتاب
 * @param {number} change - التغيير في الكمية (+1 أو -1)
 */
function updateQuantity(bookId, change) {
    const cart = loadCart();
    const item = cart.find(i => i.bookId === bookId);
    
    if (!item) return;
    
    // تعديل الكمية
    item.quantity += change;
    
    // إذا كانت الكمية أقل من 1، حذف العنصر
    if (item.quantity < 1) {
        removeFromCart(bookId);
        return;
    }
    
    // حفظ السلة
    saveCart(cart);
}

/**
 * تفريغ السلة بالكامل
 */
function clearCart() {
    if (confirm('هل أنت متأكد من تفريغ السلة؟')) {
        localStorage.removeItem(CART_STORAGE_KEY);
        updateCartUI();
        showToast('تم تفريغ السلة', 'success');
    }
}

// ==============================
// واجهة السلة
// ==============================

/**
 * فتح سلة المشتريات
 */
function openCart() {
    // إنشاء الظل إذا لم يكن موجوداً
    if (!cartOverlay) {
        cartOverlay = document.createElement('div');
        cartOverlay.className = 'sidebar-overlay';
        cartOverlay.onclick = closeCart;
        document.body.appendChild(cartOverlay);
    }
    
    cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    updateCartUI();
}

/**
 * إغلاق سلة المشتريات
 */
function closeCart() {
    if (cartSidebar) {
        cartSidebar.classList.remove('open');
    }
    if (cartOverlay) {
        cartOverlay.classList.remove('show');
    }
    document.body.style.overflow = '';
}

/**
 * تحديث واجهة السلة
 */
function updateCartUI() {
    const cart = loadCart();
    const cartItems = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');
    const cartEmpty = document.getElementById('cart-empty');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    // تحديث العدد في شريط التنقل
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // التحقق من وجود عناصر في السلة
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        cartFooter.style.display = 'none';
        cartEmpty.style.display = 'block';
        return;
    }
    
    cartFooter.style.display = 'block';
    cartEmpty.style.display = 'none';
    
    // حساب الإجمالي
    let total = 0;
    
    // عرض العناصر
    cartItems.innerHTML = cart.map(item => {
        const book = allBooks.find(b => b.id === item.bookId);
        if (!book) return '';
        
        const itemTotal = book.price * item.quantity;
        total += itemTotal;
        
        const coverHtml = book.coverImage 
            ? `<img src="${book.coverImage}" alt="${book.title}">`
            : `<div class="placeholder"><i class="fas fa-book"></i></div>`;
        
        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${coverHtml}
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${book.title}</div>
                    <div class="cart-item-price">${book.price} ${getCurrency()}</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity('${item.bookId}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.bookId}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <span class="remove-item" onclick="removeFromCart('${item.bookId}')">
                            <i class="fas fa-trash"></i>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // تحديث الإجمالي
    cartTotal.textContent = `${total} ${getCurrency()}`;
}
