/**
 * ملف الدفع والطلب - Checkout JavaScript
 * 
 * الغرض: إدارة عملية إتمام الشراء
 * المدخلات: بيانات العميل وعناصر السلة
 * المخرجات: إرسال الطلب إلى الخادم
 * Responsibilities: عرض نافذة الدفع و Validate البيانات وإرسال الطلب
 */

// ==============================
// نافذة الدفع
// ==============================

/**
 * فتح نافذة الدفع
 */
function openCheckout() {
    const cart = loadCart();
    
    // التحقق من وجود عناصر في السلة
    if (cart.length === 0) {
        showToast('سلتك فارغة', 'error');
        return;
    }
    
    // إغلاق سلة المشتريات
    closeCart();
    
    // عرض نافذة الدفع
    const modal = document.getElementById('checkout-modal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // عرض ملخص الطلب
    displayOrderSummary(cart);
}

/**
 * إغلاق نافذة الدفع
 */
function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

/**
 * عرض ملخص الطلب
 */
function displayOrderSummary(cart) {
    const container = document.getElementById('order-summary-items');
    const totalElement = document.getElementById('order-total');
    
    let total = 0;
    
    container.innerHTML = cart.map(item => {
        const book = allBooks.find(b => b.id === item.bookId);
        if (!book) return '';
        
        const itemTotal = book.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="order-summary-item">
                <span>${book.title} × ${item.quantity}</span>
                <span>${itemTotal} ${getCurrency()}</span>
            </div>
        `;
    }).join('');
    
    totalElement.textContent = `${total} ${getCurrency()}`;
}

// ==============================
// إرسال الطلب
// ==============================

/**
 * إرسال الطلب
 * @param {Event} event - حدث النموذج
 */
async function submitOrder(event) {
    event.preventDefault();
    
    // الحصول على بيانات العميل
    const customerName = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const notes = document.getElementById('customer-notes').value.trim();
    
    // التحقق من صحة البيانات
    if (!customerName || !phone || !address) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // تحميل السلة
    const cart = loadCart();
    
    if (cart.length === 0) {
        showToast('سلتك فارغة', 'error');
        return;
    }
    
    // تجهيز بيانات الطلب
    const orderData = {
        customerName,
        phone,
        address,
        notes,
        items: cart.map(item => ({
            bookId: item.bookId,
            quantity: item.quantity
        }))
    };
    
    // تعطيل زر الإرسال
    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    
    try {
        // إرسال الطلب إلى الخادم
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // نجاح الطلب
            showToast(result.message, 'success');
            
            // تفريغ السلة
            localStorage.removeItem(CART_STORAGE_KEY);
            
            // إعادة تعيين النموذج
            document.getElementById('checkout-form').reset();
            
            // إغلاق نافذة الدفع
            closeCheckout();
            
            // تحديث واجهة السلة
            updateCartUI();
        } else {
            // فشل الطلب
            showToast(result.message || 'فشل إرسال الطلب', 'error');
        }
    } catch (error) {
        console.error('خطأ في إرسال الطلب:', error);
        showToast('خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً', 'error');
    } finally {
        // إعادة تفعيل زر الإرسال
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> تأكيد الطلب';
    }
}

// ==============================
// مستمعي الأحداث
// ==============================

// إغلاق النافذة عند النقر خارجها
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCheckout();
            }
        });
    }
});
