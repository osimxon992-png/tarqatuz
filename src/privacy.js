// Privacy policy text. Keep it true to what the code stores: when the bot, site or database starts
// collecting something new, update this list and the date.
import { BRAND, CONTACT } from './config'

const UPDATED = '2026-10-24'
const contact = `${CONTACT.phoneLabel}, ${CONTACT.email}`

// sections: [heading, [paragraph or ['list item', ...]]]
export const PRIVACY = {
  uz: {
    title: 'Maxfiylik siyosati',
    updated: `Soʻnggi yangilanish: ${UPDATED}`,
    intro: `Bu siyosat ${BRAND} sayti, Telegram boti va bot ichidagi ilova qanday maʼlumotlarni yigʻishi, ulardan nima uchun foydalanishi va qanday himoya qilishini tushuntiradi. Xizmatdan foydalanib, siz shu shartlarga rozilik bildirasiz.`,
    sections: [
      ['Qanday maʼlumot yigʻamiz', [
        [
          'Telegram maʼlumotlari: Telegram ID va username (agar boʻlsa). Ularni Telegram botga yozganingizda yoki ilovani ochganingizda beradi.',
          'Kanal maʼlumotlari: kanal nomi, username, Telegram identifikatori, obunachilar soni, siz koʻrsatgan oʻrtacha koʻrishlar, narx va kategoriya.',
          'Buyurtmalar: kanal, summa, komissiya, holat, vaqtlar, nizo yoki qaytarish sababi.',
          'Toʻlovlar: Click tranzaksiya raqami va summasi. Karta maʼlumotlaringizni biz koʻrmaymiz va saqlamaymiz — ularni faqat Click qayta ishlaydi.',
        ],
      ]],
      ['Reklama postlari', [
        'Reklama postining matni va mediasi bizning bazamizda saqlanmaydi: ular Telegram serverlarida, bot bilan yozishmangizda va kanalda turadi. Bazada faqat xabar raqamlari saqlanadi — bot postni shu raqamlar orqali kanalga joylaydi va 24 soat davomida joyida ekanini tekshiradi.',
      ]],
      ['Nima uchun foydalanamiz', [
        [
          'Buyurtmani bajarish: postni kanal egasiga koʻrsatish, kanalga joylash va 24 soat nazorat qilish.',
          'Pulni himoyalash: toʻlovni qabul qilish, kanal egasiga oʻtkazish yoki reklama beruvchiga qaytarish.',
          'Sizga bildirishnoma yuborish: toʻlov, joylash, nizo va yakunlanish haqida.',
          'Kanallarni tekshirish va nizolarni hal qilish.',
        ],
        'Maʼlumotlaringizni sotmaymiz va reklama maqsadida uchinchi shaxslarga bermaymiz.',
      ]],
      ['Kimlar bilan ulashamiz', [
        [
          'Telegram — bot va ilova Telegram platformasida ishlaydi.',
          'Click — toʻlovlarni qabul qilish uchun.',
          'Buyurtma tomonlari: kanal egasi reklama postini koʻradi; reklama beruvchi joylangan postga havola oladi.',
          'Davlat organlari — faqat qonunda belgilangan hollarda.',
        ],
      ]],
      ['Sayt va cookie', [
        'Saytga tashrif buyuruvchilar uchun cookie va analitika ishlatilmaydi. Cookie faqat admin paneliga kirish uchun qoʻllanadi. Sayt shriftlari Google Fonts’dan yuklanadi, shuning uchun brauzeringiz Google’ga IP manzilingizni yuboradi.',
      ]],
      ['Qancha saqlaymiz', [
        'Maʼlumotlar xizmatdan foydalanayotganingizcha saqlanadi. Buyurtma va toʻlov yozuvlari hisob-kitob va nizolar uchun qonunchilikda belgilangan muddat davomida saqlanadi.',
      ]],
      ['Sizning huquqlaringiz', [
        `Oʻzingiz haqingizdagi maʼlumotni soʻrashingiz, tuzatish yoki oʻchirishni talab qilishingiz mumkin: ${contact}. Ochiq buyurtmalar va qonun boʻyicha saqlanishi shart boʻlgan toʻlov yozuvlari ular yopilgunicha yoki muddat tugaguncha oʻchirilmaydi.`,
      ]],
      ['Himoya', [
        'Maʼlumotlar himoyalangan serverda saqlanadi, ularga faqat xizmat administratori kira oladi. Ilova har bir soʻrovda Telegram imzosini tekshiradi, shuning uchun boshqa birov sizning buyurtma va kanallaringizni koʻra olmaydi.',
      ]],
      ['Oʻzgarishlar', [
        'Siyosat oʻzgarsa, yangi matn shu sahifada eʼlon qilinadi va yuqoridagi sana yangilanadi.',
      ]],
      ['Aloqa', [`Savollar boʻyicha: ${contact}.`]],
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    updated: `Последнее обновление: ${UPDATED}`,
    intro: `Эта политика объясняет, какие данные собирают сайт ${BRAND}, Telegram-бот и приложение внутри бота, зачем они используются и как защищены. Пользуясь сервисом, вы соглашаетесь с этими условиями.`,
    sections: [
      ['Какие данные мы собираем', [
        [
          'Данные Telegram: Telegram ID и username (если есть). Их передаёт Telegram, когда вы пишете боту или открываете приложение.',
          'Данные канала: название, username, идентификатор в Telegram, число подписчиков, указанные вами средние просмотры, цена и категория.',
          'Заказы: канал, сумма, комиссия, статус, время, причина спора или возврата.',
          'Платежи: номер транзакции Click и сумма. Данные вашей карты мы не видим и не храним — их обрабатывает только Click.',
        ],
      ]],
      ['Рекламные посты', [
        'Текст и медиа рекламного поста не хранятся в нашей базе: они остаются на серверах Telegram — в переписке с ботом и в канале. В базе хранятся только номера сообщений — по ним бот публикует пост и 24 часа проверяет, что он на месте.',
      ]],
      ['Зачем мы их используем', [
        [
          'Выполнение заказа: показать пост владельцу канала, опубликовать его и 24 часа контролировать.',
          'Защита денег: принять оплату, перевести её владельцу канала или вернуть рекламодателю.',
          'Уведомления: об оплате, публикации, спорах и завершении заказа.',
          'Проверка каналов и решение споров.',
        ],
        'Мы не продаём ваши данные и не передаём их третьим лицам для рекламы.',
      ]],
      ['С кем мы делимся', [
        [
          'Telegram — бот и приложение работают на платформе Telegram.',
          'Click — для приёма платежей.',
          'Стороны заказа: владелец канала видит рекламный пост; рекламодатель получает ссылку на опубликованный пост.',
          'Государственные органы — только в случаях, предусмотренных законом.',
        ],
      ]],
      ['Сайт и cookie', [
        'Для посетителей сайта cookie и аналитика не используются. Cookie нужен только для входа в панель администратора. Шрифты сайта загружаются с Google Fonts, поэтому ваш браузер передаёт Google ваш IP-адрес.',
      ]],
      ['Сколько мы храним', [
        'Данные хранятся, пока вы пользуетесь сервисом. Записи о заказах и платежах хранятся в течение срока, установленного законодательством для расчётов и споров.',
      ]],
      ['Ваши права', [
        `Вы можете запросить свои данные, потребовать их исправления или удаления: ${contact}. Открытые заказы и записи о платежах, которые закон обязывает хранить, удаляются только после их закрытия или истечения срока.`,
      ]],
      ['Защита', [
        'Данные хранятся на защищённом сервере, доступ к ним есть только у администратора сервиса. Приложение проверяет подпись Telegram при каждом запросе, поэтому никто другой не увидит ваши заказы и каналы.',
      ]],
      ['Изменения', [
        'При изменении политики новый текст публикуется на этой странице, а дата выше обновляется.',
      ]],
      ['Контакты', [`По вопросам: ${contact}.`]],
    ],
  },
}
