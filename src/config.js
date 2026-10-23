// Replace these placeholders before launch. Numeric strings (e.g. '1200') animate as counters.
export const BRAND = 'tarqat'
export const BOT_USERNAME = '{BOT_USERNAME}'
export const CHANNELS_COUNT = '{CHANNELS_COUNT}'
export const MIN_SUBSCRIBERS = '{MIN_SUBSCRIBERS}'
export const CONTACT = { phone: '{PHONE}', email: '{EMAIL}' }
export const LINKS = { oferta: '{OFERTA_URL}', privacy: '{PRIVACY_URL}' }

export const botUrl = (start) => `https://t.me/${BOT_USERNAME}${start ? `?start=${start}` : ''}`
