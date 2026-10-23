// Replace these placeholders before launch. Numeric strings (e.g. '1200') animate as counters.
export const BRAND = 'tarqat'
export const BOT_USERNAME = '{BOT_USERNAME}'
export const CHANNELS_COUNT = '{CHANNELS_COUNT}'
export const MIN_SUBSCRIBERS = '{MIN_SUBSCRIBERS}'
export const CONTACT = { phone: '+998970200460', phoneLabel: '+998 97 020 04 60', email: 'osimxon992@gmail.com' }
export const LINKS = { oferta: '{OFERTA_URL}', privacy: '{PRIVACY_URL}' }

// Until the bot exists, every Telegram button opens this chat, where orders are taken by hand.
// Set BOT_USERNAME above and the buttons switch to the bot automatically.
export const ORDER_CHAT = 'osimxon_00'
export const HAS_BOT = !BOT_USERNAME.startsWith('{')
export const TELEGRAM_USERNAME = HAS_BOT ? BOT_USERNAME : ORDER_CHAT

// Message pre-filled in the chat, so you know at once what the person wants.
const CHAT_TEXT = {
  advertiser: 'Salom! Reklama bermoqchiman.',
  owner: 'Salom! Kanalimni ulamoqchiman.',
  catalog: 'Salom! Kanallar roʻyxatini koʻrmoqchiman.',
}

export const botUrl = (start) => {
  if (HAS_BOT) return `https://t.me/${BOT_USERNAME}${start ? `?start=${start}` : ''}`
  const text = CHAT_TEXT[start]
  return `https://t.me/${ORDER_CHAT}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
