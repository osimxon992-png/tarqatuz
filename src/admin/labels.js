// Admin wording. [label, badge colour]
export const ORDER_STATUS = {
  new: ['Toʻlov kutilmoqda', 'bg-paper'],
  held: ['Post kutilmoqda', 'bg-white'],
  live: ['24 soat nazoratda', 'bg-mint'],
  disputed: ['Nizo', 'bg-alert/25'],
  completed: ['Yakunlangan', 'bg-brand'],
  refunded: ['Qaytarilgan', 'bg-ink/10'],
}
export const CHANNEL_STATUS = {
  pending: ['Tekshiruvda', 'bg-accent'],
  verified: ['Tasdiqlangan', 'bg-brand'],
  rejected: ['Rad etilgan', 'bg-ink/10'],
  blocked: ['Bloklangan', 'bg-alert/25'],
}
export const PAYOUT_STATUS = {
  pending: ['Toʻlanishi kerak', 'bg-accent'],
  paid: ['Toʻlangan', 'bg-brand'],
}

// [button label, what happens, button colour]
export const ACTIONS = {
  paid: ['Toʻlov qabul qilindi', '', ''], // set by Click, shown only in the log
  create: ['Buyurtma yaratildi', '', ''], // log only
  confirm_payment: ['Toʻlov tushdi', 'Kartangizga pul tushganini tekshirdingizmi? Buyurtma himoyaga oʻtadi. Izohga qaysi kartadan, qachon va qancha tushganini yozing.', 'bg-brand'],
  mark_posted: ['Post joylandi', '24 soatlik nazorat hozirdan boshlanadi.', 'bg-white'],
  release: ['Kanal egasiga oʻtkazish', 'Pul kanal egasiga oʻtadi va toʻlovlar roʻyxatiga qoʻshiladi. Buni ortga qaytarib boʻlmaydi.', 'bg-brand'],
  refund: ['Pulni qaytarish', 'Pul reklama beruvchiga qaytariladi. Buni ortga qaytarib boʻlmaydi.', 'bg-alert/30'],
  dispute: ['Nizo ochish', 'Pul hech kimga oʻtmaydi, siz qaror qilmaguningizcha.', 'bg-white'],
  verify: ['Tasdiqlash', 'Kanal katalogda koʻrinadi va buyurtma qabul qila oladi.', 'bg-brand'],
  reject: ['Rad etish', 'Kanal katalogga chiqmaydi. Sabab jurnalda saqlanadi.', 'bg-alert/30'],
  block: ['Bloklash', 'Kanal katalogdan olinadi va yangi buyurtma qabul qilmaydi.', 'bg-alert/30'],
  mark_paid: ['Toʻlandi', 'Pulni kanal egasining kartasiga yuborganingizni tasdiqlang.', 'bg-accent'],
}

export const ENTITY = { order: 'Buyurtma', channel: 'Kanal', payout: 'Toʻlov' }
