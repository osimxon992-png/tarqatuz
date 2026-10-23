// Escrow rules shared by the API (enforces them) and the admin panel (shows only allowed buttons).

export const HOLD_MS = 24 * 60 * 60 * 1000 // a post must stay live this long before the owner is paid

// 'new' moves to 'held' when the payment arrives: confirmed by Click, or by an admin who saw a card transfer.
export const ORDER_STATUSES = ['new', 'held', 'live', 'disputed', 'completed', 'refunded']
export const CHANNEL_STATUSES = ['pending', 'verified', 'rejected', 'blocked']
export const PAYOUT_STATUSES = ['pending', 'paid']

// action: [statuses it is allowed from, status it moves to]
export const ORDER_ACTIONS = {
  confirm_payment: [['new'], 'held'], // manual card transfer, checked by the admin
  mark_posted: [['held'], 'live'],
  release: [['live', 'disputed'], 'completed'],
  refund: [['held', 'live', 'disputed'], 'refunded'],
  dispute: [['held', 'live'], 'disputed'],
}

export const CHANNEL_ACTIONS = {
  verify: [['pending', 'rejected', 'blocked'], 'verified'],
  reject: [['pending'], 'rejected'],
  block: [['verified'], 'blocked'],
}

// Actions that touch someone's money or listing must say why (kept in the audit log).
// For confirm_payment that's the proof: which card, when, how much.
export const NEEDS_REASON = new Set(['confirm_payment', 'refund', 'dispute', 'reject', 'block'])

export const allowedActions = (rules, status) => Object.keys(rules).filter((a) => rules[a][0].includes(status))
