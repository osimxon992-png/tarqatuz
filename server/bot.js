// Telegram bot: owners connect channels, advertisers order and pay, the bot posts the ad and runs the 24h check.
// Money never moves here: the bot only changes order status; payouts and refunds stay with the admin.
import { Bot, InlineKeyboard } from 'grammy'
import { COMMISSION, som } from '../src/lib/fee.js'
import { ActionError, createChannel, createOrder, orderAction } from './market.js'
import { payUrl } from './click.js'
import { CONTACT } from '../src/config.js'

const CATEGORIES = ['Yangiliklar', 'Texnologiya', 'Taʼlim', 'Sport', 'Biznes', 'Avto', 'Oshxona', 'Moda', 'Kino', 'Boshqa']
// shortcut: one timer polls every live post each tick; fine for hundreds of orders, move to per-order schedules beyond that.
const TICK_MS = 2 * 60 * 1000

// Shown in the "/" menu; /id stays unlisted (admin setup only).
const COMMANDS = [
  ['start', 'Bosh menyu'],
  ['catalog', 'Kanallar katalogi — reklama berish'],
  ['kanal', 'Kanalimni ulash'],
  ['app', 'Ilovani ochish'],
  ['help', 'Qanday ishlaydi va aloqa'],
]
// Telegram limits: description 512 chars (empty chat screen), short description 120 (profile and shares).
const DESCRIPTION = `tarqat — tekshirilgan Telegram kanallarida xavfsiz reklama.

📢 Reklama beruvchi: kanal tanlang, postni yuboring va karta orqali toʻlang.
📡 Kanal egasi: kanalingizni ulang va oldindan toʻlangan buyurtmalar oling.

🔒 Pul platformada turadi va post 24 soat turgandan keyingina kanal egasiga oʻtadi. Post oʻchirilsa — pul qaytariladi.`
const SHORT_DESCRIPTION = 'Tekshirilgan Telegram kanallarida xavfsiz reklama. Pul post 24 soat turgandan keyin oʻtadi.'
const HELP = `Qanday ishlaydi:
1. Katalogdan kanal tanlaysiz va reklama postini yuborasiz.
2. Karta orqali toʻlaysiz — pul platformada himoyada turadi.
3. Kanal egasi tasdiqlagach, bot postni joylaydi.
4. Post 24 soat tursa, pul kanal egasiga oʻtadi. Oʻchirilsa — sizga qaytadi.

Kanal egalari: /kanal — botni kanalga admin qiling, narxni yozing, admin tekshirgach katalogga chiqasiz. Komissiya 10–15%, faqat muvaffaqiyatli reklamadan.

Aloqa: ${CONTACT.phoneLabel}, ${CONTACT.email}`

const who = (u) => (u.username ? `@${u.username}` : `tg${u.id}`)

export const postLink = (username, chatId, msgId) =>
  username.startsWith('@') ? `https://t.me/${username.slice(1)}/${msgId}` : `https://t.me/c/${String(chatId).replace(/^-100/, '')}/${msgId}`

// Result of probing a channel post by re-setting its (empty) keyboard.
// 'gone' only on Telegram's explicit answer; a network error (no description) is retried, never counted against the owner.
export function probeResult(e) {
  const d = e?.description
  if (!d) return 'retry'
  if (/message is not modified/i.test(d)) return 'ok'
  if (/message to edit not found|message_id_invalid/i.test(d)) return 'gone'
  return 'unreachable' // bot removed from the channel or lost its rights
}

export function startBot(db, token, adminChat = process.env.ADMIN_CHAT_ID) {
  const bot = new Bot(token)
  // shortcut: conversation steps live in memory, so a restart drops half-filled forms; persist them if that bites.
  const drafts = new Map()

  const dm = (id, text, extra) =>
    id ? bot.api.sendMessage(id, text, extra).catch((e) => console.warn('bot: cannot message', id, e.description ?? e.message)) : null
  const toAdmin = (text) => dm(adminChat, `🛠 ${text}`)

  // Telegram opens Mini Apps only over HTTPS; without such a URL the bot works through chat alone.
  const webApp = process.env.WEBAPP_URL?.startsWith('https://') ? process.env.WEBAPP_URL : null
  const menu = new InlineKeyboard()
  if (webApp) menu.webApp('📱 Ilovani ochish', webApp).row()
  menu.text('📢 Reklama berish', 'catalog').row().text('📡 Kanalimni ulash', 'owner')
  const loadOrder = (id) => db.prepare(`
    SELECT o.*, c.title, c.username, c.tg_chat_id, c.owner_tg FROM orders o JOIN channels c ON c.id = o.channel_id WHERE o.id = ?`).get(id)

  // One place that tells people what happened to an order, whether the bot or the admin moved it.
  function notifyOrder(o, { byBot = false } = {}) {
    const n = `#${o.id} «${o.title}»`
    if (o.status === 'live') {
      dm(o.advertiser_tg, `✅ Reklamangiz joylandi: ${postLink(o.username, o.tg_chat_id, o.post_msg)}\n24 soatdan keyin bot post joyida ekanini tekshiradi.`)
    } else if (o.status === 'disputed') {
      dm(o.advertiser_tg, `⚠️ Buyurtma ${n}: ${o.reason}\nPulingiz himoyada, admin koʻrib chiqib siz bilan bogʻlanadi.`)
      dm(o.owner_tg, `⚠️ Buyurtma ${n}: ${o.reason}\nAdmin koʻrib chiqadi.`)
      if (byBot) toAdmin(`Nizo: buyurtma ${n} — ${o.reason}`)
    } else if (o.status === 'completed') {
      dm(o.advertiser_tg, `🏁 Buyurtma ${n} yakunlandi: post 24 soat turdi. Rahmat!`)
      dm(o.owner_tg, `💰 Buyurtma ${n}: ${som(o.payout)} soʻm kartangizga oʻtkaziladi.`)
      if (byBot) toAdmin(`Buyurtma ${n} yakunlandi. Kanal egasiga ${som(o.payout)} soʻm oʻtkazing (Toʻlovlar boʻlimi).`)
    } else if (o.status === 'refunded') {
      dm(o.advertiser_tg, `↩️ Buyurtma ${n} boʻyicha ${som(o.price)} soʻm sizga qaytarildi.`)
    }
  }

  function move(id, action, reason) {
    orderAction(db, id, action, 'bot', reason)
    notifyOrder(loadOrder(id), { byBot: true })
  }

  async function catalog(ctx) {
    const rows = db.prepare(`SELECT id, title, subscribers, price FROM channels
      WHERE status = 'verified' AND tg_chat_id IS NOT NULL ORDER BY subscribers DESC LIMIT 50`).all()
    if (!rows.length) return ctx.reply('Hozircha katalogda kanal yoʻq. Tez orada qoʻshiladi.')
    const kb = new InlineKeyboard()
    for (const c of rows) kb.text(`${c.title} · ${som(c.subscribers)} obunachi · ${som(c.price)} soʻm`, `ch:${c.id}`).row()
    return ctx.reply('Reklama joylash uchun kanalni tanlang:', { reply_markup: kb })
  }

  function ownerHelp(ctx) {
    const rights = 'post_messages+edit_messages+delete_messages'
    const kb = new InlineKeyboard().url('➕ Kanalga qoʻshish', `https://t.me/${ctx.me.username}?startchannel&admin=${rights}`)
    return ctx.reply(
      'Kanalni ulash:\n1. Pastdagi tugma orqali botni kanalingizga administrator qiling (xabar joylash va tahrirlash huquqi bilan).\n' +
        '2. Bot shu yerga yozadi va narxni soʻraydi.\n3. Admin tekshirgach, kanalingiz katalogga chiqadi.',
      { reply_markup: kb },
    )
  }

  bot.on('callback_query', (ctx, next) => {
    ctx.answerCallbackQuery().catch(() => {})
    return next()
  })

  // The owner made the bot an admin of their channel: start the connect form in their private chat.
  bot.on('my_chat_member', async (ctx) => {
    const { chat, from, new_chat_member: m } = ctx.myChatMember
    if (chat.type !== 'channel' || m.status !== 'administrator') return
    if (!m.can_post_messages || !m.can_edit_messages) {
      return dm(from.id, `«${chat.title}»: botga «Xabar joylash» va «Xabarlarni tahrirlash» huquqini bering.`)
    }
    const existing = db.prepare('SELECT status FROM channels WHERE tg_chat_id = ?').get(chat.id)
    if (existing) return dm(from.id, `«${chat.title}» allaqachon ulangan.`)
    const member = await ctx.api.getChatMember(chat.id, from.id)
    if (!['creator', 'administrator'].includes(member.status)) return
    const subscribers = await ctx.api.getChatMemberCount(chat.id)
    drafts.set(from.id, {
      step: 'price',
      channel: {
        tgChatId: chat.id, title: chat.title, username: chat.username ? `@${chat.username}` : `id${chat.id}`,
        subscribers, ownerTg: from.id, owner: who(from),
      },
    })
    dm(from.id, `«${chat.title}» topildi: ${som(subscribers)} obunachi.\n\nBitta reklama posti narxini soʻmda yozing (masalan, 450000):`)
  })

  const pm = bot.chatType('private')

  pm.command('start', (ctx) => {
    drafts.delete(ctx.from.id)
    if (ctx.match === 'owner') return ownerHelp(ctx)
    if (ctx.match === 'advertiser' || ctx.match === 'catalog') return catalog(ctx)
    return ctx.reply(
      'Assalomu alaykum! tarqat — Telegram reklamasi uchun xavfsiz joy.\nPul post 24 soat turgandan keyingina kanal egasiga oʻtadi.',
      { reply_markup: menu },
    )
  })
  pm.command('id', (ctx) => ctx.reply(`Sizning Telegram ID: ${ctx.from.id}`))
  pm.command('catalog', catalog)
  pm.command('kanal', ownerHelp)
  pm.command('help', (ctx) => ctx.reply(HELP))
  pm.command('app', (ctx) =>
    webApp
      ? ctx.reply('Katalog, buyurtmalar va kanallaringiz — ilovada:', { reply_markup: new InlineKeyboard().webApp('📱 Ilovani ochish', webApp) })
      : ctx.reply('Ilova hozircha ishlamayapti. Menyudan foydalaning:', { reply_markup: menu }))
  pm.callbackQuery('catalog', catalog)
  pm.callbackQuery('owner', ownerHelp)

  pm.callbackQuery(/^cat:(\d+)$/, (ctx) => {
    const d = drafts.get(ctx.from.id)
    const category = CATEGORIES[Number(ctx.match[1])]
    if (d?.step !== 'category' || !category) return
    drafts.delete(ctx.from.id)
    try {
      createChannel(db, { ...d.channel, category })
    } catch (e) {
      if (/UNIQUE/.test(e.message)) return ctx.reply('Bu kanal allaqachon roʻyxatda.')
      throw e
    }
    toAdmin(`Yangi kanal: ${d.channel.username} «${d.channel.title}», ${som(d.channel.subscribers)} obunachi, ${som(d.channel.price)} soʻm. Admin panelda tekshiring.`)
    return ctx.editMessageText(`Kategoriya: ${category}.\n\n✅ Kanal tekshiruvga yuborildi. Admin tasdiqlagach, katalogga chiqadi.`)
  })

  // Chosen in the chat catalog or in the Mini App; either way the post itself is sent here, in the chat.
  async function beginAd(userId, channelId) {
    const c = db.prepare("SELECT id, title, price FROM channels WHERE id = ? AND status = 'verified' AND tg_chat_id IS NOT NULL").get(channelId)
    if (!c) throw new ActionError('Bu kanal hozir mavjud emas', 404)
    drafts.set(userId, { step: 'ad', channelId: c.id })
    await bot.api.sendMessage(userId, `«${c.title}» — ${som(c.price)} soʻm.\n\nReklama postini yuboring (matn, rasm yoki video izoh bilan). Bot uni aynan shu koʻrinishda joylaydi.`)
  }

  pm.callbackQuery(/^ch:(\d+)$/, (ctx) => beginAd(ctx.from.id, Number(ctx.match[1])))

  pm.callbackQuery('redo', (ctx) => {
    const d = drafts.get(ctx.from.id)
    if (d?.step !== 'confirm') return
    d.step = 'ad'
    return ctx.reply('Yangi postni yuboring:')
  })

  pm.callbackQuery('order', async (ctx) => {
    const d = drafts.get(ctx.from.id)
    if (d?.step !== 'confirm') return
    drafts.delete(ctx.from.id)
    const c = db.prepare('SELECT title, price FROM channels WHERE id = ?').get(d.channelId)
    const id = createOrder(db, {
      channelId: d.channelId, advertiser: who(ctx.from), price: c.price, commissionPct: COMMISSION[0],
      tg: { advertiserTg: ctx.from.id, adChat: ctx.chat.id, adMsg: d.adMsg },
    })
    const url = payUrl({ id, price: c.price })
    toAdmin(`Yangi buyurtma #${id}: «${c.title}», ${som(c.price)} soʻm, ${who(ctx.from)}. Toʻlov kutilmoqda.`)
    const text = `🧾 Buyurtma #${id}: «${c.title}», ${som(c.price)} soʻm.\n\n`
    if (!url) return ctx.reply(`${text}Admin siz bilan bogʻlanib, toʻlov uchun karta raqamini yuboradi.`)
    return ctx.reply(`${text}Pul platformada himoyada turadi va post 24 soat turgandan keyingina kanal egasiga oʻtadi.`, {
      reply_markup: new InlineKeyboard().url('💳 Click orqali toʻlash', url),
    })
  })

  // Owner's answer to a paid order. The post is claimed (post_msg = 0) first, so a double tap can't post twice.
  pm.callbackQuery(/^(ok|no):(\d+)$/, async (ctx) => {
    const id = Number(ctx.match[2])
    const o = loadOrder(id)
    if (!o || o.owner_tg !== ctx.from.id) return
    if (ctx.match[1] === 'no') {
      if (o.status !== 'held' || o.post_msg !== null) return ctx.reply('Bu buyurtma allaqachon koʻrib chiqilgan.')
      move(id, 'dispute', 'Kanal egasi buyurtmani rad etdi')
      return ctx.editMessageText(`❌ Buyurtma #${id} rad etildi.`)
    }
    const { changes } = db.prepare("UPDATE orders SET post_msg = 0 WHERE id = ? AND status = 'held' AND post_msg IS NULL").run(id)
    if (!changes) return ctx.reply('Bu buyurtma allaqachon koʻrib chiqilgan.')
    let post
    try {
      post = await ctx.api.copyMessage(o.tg_chat_id, ctx.chat.id, o.review_msg)
    } catch (e) {
      db.prepare('UPDATE orders SET post_msg = NULL WHERE id = ?').run(id)
      return ctx.reply(`Joylab boʻlmadi: ${e.description ?? e.message}\nBot kanalda admin ekanini tekshiring va qayta bosing.`)
    }
    db.prepare('UPDATE orders SET post_msg = ? WHERE id = ?').run(post.message_id, id)
    move(id, 'mark_posted')
    return ctx.editMessageText(`✅ Buyurtma #${id} joylandi: ${postLink(o.username, o.tg_chat_id, post.message_id)}\n24 soatdan keyin ${som(o.payout)} soʻm sizga oʻtadi.`)
  })

  pm.on('message', async (ctx) => {
    const d = drafts.get(ctx.from.id)
    if (d?.step === 'price' || d?.step === 'views') {
      const n = Number(ctx.message.text?.replace(/[\s.,]/g, ''))
      const min = d.step === 'price' ? 10_000 : 0
      if (!Number.isInteger(n) || n < min || n > 1_000_000_000) return ctx.reply(`Faqat raqam yozing${min ? `, kamida ${som(min)}` : ''}.`)
      if (d.step === 'price') {
        d.channel.price = n
        d.step = 'views'
        return ctx.reply('Oxirgi postlarning oʻrtacha koʻrishlar soni qancha? (admin tekshiradi)')
      }
      d.channel.avgViews = n
      d.step = 'category'
      const kb = new InlineKeyboard()
      CATEGORIES.forEach((c, i) => (i % 2 ? kb.text(c, `cat:${i}`).row() : kb.text(c, `cat:${i}`)))
      return ctx.reply('Kanal kategoriyasini tanlang:', { reply_markup: kb })
    }
    if (d?.step === 'ad') {
      // The bot's own copy is what gets posted later, so later edits to the user's message change nothing.
      let preview
      try {
        preview = await ctx.api.copyMessage(ctx.chat.id, ctx.chat.id, ctx.message.message_id)
      } catch {
        return ctx.reply('Bu turdagi xabarni joylab boʻlmaydi. Matn, rasm yoki video yuboring.')
      }
      Object.assign(d, { step: 'confirm', adMsg: preview.message_id })
      return ctx.reply('☝️ Post kanalda aynan shunday chiqadi.', {
        reply_markup: new InlineKeyboard().text('✅ Buyurtma berish', 'order').text('✏️ Boshqa post', 'redo'),
      })
    }
    return ctx.reply('Menyudan tanlang:', { reply_markup: menu })
  })

  bot.catch(({ error, ctx }) => {
    if (error instanceof ActionError) return ctx.reply(error.message).catch(() => {})
    console.error('bot:', error)
  })

  // Paid orders go to the owner for review; live posts are checked until their 24 hours are up.
  async function tick(now = Date.now()) {
    const paid = db.prepare(`SELECT o.id FROM orders o JOIN channels c ON c.id = o.channel_id
      WHERE o.status = 'held' AND o.ad_msg IS NOT NULL AND o.review_msg IS NULL AND c.owner_tg IS NOT NULL`).all()
    for (const { id } of paid) {
      const o = loadOrder(id)
      try {
        const copy = await bot.api.copyMessage(o.owner_tg, o.ad_chat, o.ad_msg)
        db.prepare('UPDATE orders SET review_msg = ? WHERE id = ?').run(copy.message_id, id)
        await bot.api.sendMessage(o.owner_tg,
          `🆕 Buyurtma #${id} «${o.title}» kanaliga (post tepada ☝️).\nToʻlov qabul qilingan. Siz olasiz: ${som(o.payout)} soʻm, post 24 soat turgach.`,
          { reply_markup: new InlineKeyboard().text('✅ Joylash', `ok:${id}`).text('❌ Rad etish', `no:${id}`) })
        dm(o.advertiser_tg, `💳 Buyurtma #${id}: toʻlov qabul qilindi. Kanal egasi tasdiqlashi kutilmoqda.`)
      } catch (e) {
        // 0 = could not deliver; stops retrying every tick, the admin takes it from here.
        db.prepare('UPDATE orders SET review_msg = 0 WHERE id = ?').run(id)
        toAdmin(`Buyurtma #${id}: kanal egasiga yuborib boʻlmadi (${e.description ?? e.message}).`)
      }
    }

    const live = db.prepare("SELECT o.id FROM orders o WHERE o.status = 'live' AND o.post_msg > 0").all()
    for (const { id } of live) {
      const o = loadOrder(id)
      const state = await bot.api
        .editMessageReplyMarkup(o.tg_chat_id, o.post_msg, { reply_markup: { inline_keyboard: [] } })
        .then(() => 'ok', probeResult)
      if (state === 'gone') move(id, 'dispute', 'Post 24 soat tugamasdan oʻchirildi')
      else if (state === 'unreachable') move(id, 'dispute', 'Bot postni tekshira olmadi: kanaldan chiqarilgan yoki huquqi olingan')
      else if (state === 'ok' && now >= o.release_at) move(id, 'release')
    }
  }

  let busy = false
  setInterval(async () => {
    if (busy) return
    busy = true
    await tick().catch((e) => console.error('bot tick:', e))
    busy = false
  }, TICK_MS)

  bot.start({
    onStart: (me) => {
      console.log(`tarqat bot: @${me.username}${webApp ? ` (Mini App: ${webApp})` : ''}`)
      const menuButton = webApp ? { type: 'web_app', text: 'Ilova', web_app: { url: webApp } } : { type: 'commands' }
      // Re-applied on every start so the bot's profile always matches this code.
      const warn = (what) => (e) => console.warn(`bot: ${what}`, e.description ?? e.message)
      bot.api.setChatMenuButton({ menu_button: menuButton }).catch(warn('menu button'))
      bot.api.setMyCommands(COMMANDS.map(([command, description]) => ({ command, description }))).catch(warn('commands'))
      bot.api.setMyDescription(DESCRIPTION).catch(warn('description'))
      bot.api.setMyShortDescription(SHORT_DESCRIPTION).catch(warn('short description'))
    },
  }).catch((e) => console.error('bot stopped:', e.message))

  // Admin-panel hooks: tell people about changes the admin made.
  return {
    beginAd,
    channelChanged(id) {
      const c = db.prepare('SELECT title, status, note, owner_tg FROM channels WHERE id = ?').get(id)
      const text = { verified: '✅ tasdiqlandi va katalogga chiqdi', rejected: '❌ rad etildi', blocked: '⛔ bloklandi' }[c?.status]
      if (text) dm(c.owner_tg, `«${c.title}» ${text}.${c.note ? `\nSabab: ${c.note}` : ''}`)
    },
    orderChanged(id) {
      const o = loadOrder(id)
      if (o) notifyOrder(o)
    },
  }
}
