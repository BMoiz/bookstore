/**
 * ملف مساعد التليجرام - Telegram Utility
 * 
 * الغرض: إرسال الرسائل عبر بوت التليجرام
 * المدخلات: بيانات الطلب المراد إرسالها
 * المخرجات: نجاح أو فشل الإرسال
 * المسؤوليات: تنسيق رسالة الطلب وإرسالها عبر التليجرام
 */

const fetch = require('node-fetch');

/**
 * إرسال رسالة إلى التليجرام
 * @param {string} message - نص الرسالة
 * @returns {Promise<Object>} نتيجة الإرسال
 */
async function sendTelegramMessage(message) {
  // التحقق من وجود التوكن ومعرف المحادثة
  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  // التحقق من إعدادات التليجرام
  if (!botToken || botToken === 'YOUR_BOT_TOKEN_HERE') {
    throw new Error('توكن بوت التليجرام غير مُعد. يرجى تعديل ملف .env');
  }

  if (!chatId || chatId === 'YOUR_CHAT_ID_HERE') {
    throw new Error('معرف المحادثة غير مُعد. يرجى تعديل ملف .env');
  }

  // رابط API التليجرام
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    // إرسال الطلب إلى التليجرام
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    // تحليل الاستجابة
    const data = await response.json();

    // التحقق من نجاح الإرسال
    if (!data.ok) {
      throw new Error(data.description || 'فشل إرسال الرسالة');
    }

    return { success: true, data };
  } catch (error) {
    console.error('خطأ في إرسال التليجرام:', error.message);
    throw new Error(`فشل الاتصال بالتليجرام: ${error.message}`);
  }
}

/**
 * تنسيق رسالة الطلب
 * @param {Object} order - بيانات الطلب
 * @param {Array} books - بيانات الكتب
 * @returns {string} الرسالة المنسقة
 */
function formatOrderMessage(order, books) {
  // تنسيق قائمة المنتجات
  let itemsText = '';
  let totalAmount = 0;

  order.items.forEach((item, index) => {
    const book = books.find(b => b.id === item.bookId);
    const bookTitle = book ? book.title : 'كتاب غير معروف';
    const bookPrice = book ? book.price : 0;
    const itemTotal = bookPrice * item.quantity;
    totalAmount += itemTotal;

    itemsText += `📘 ${bookTitle}\n`;
    itemsText += `   الكمية: ${item.quantity}\n`;
    itemsText += `   السعر: ${itemTotal} ${order.currency || 'MAD'}\n\n`;
  });

  // تنسيق الرسالة الكاملة
  const message = `
━━━━━━━━━━━━━━━━━━
📚 طلب كتاب جديد
━━━━━━━━━━━━━━━━━━

👤 العميل
   الاسم: ${order.customerName}
   الهاتف: ${order.phone}
   العنوان: ${order.address}
${order.notes ? `   ملاحظات: ${order.notes}` : ''}

━━━━━━━━━━━━━━━━━━

🛒 المنتجات
${itemsText}
━━━━━━━━━━━━━━━━━━

💵 المبلغ الإجمالي: ${totalAmount} ${order.currency || 'MAD'}
🕒 التاريخ والوقت: ${new Date().toLocaleString('ar-MA', { timeZone: 'Africa/Casablanca' })}

━━━━━━━━━━━━━━━━━━
  `.trim();

  return message;
}

module.exports = {
  sendTelegramMessage,
  formatOrderMessage
};
