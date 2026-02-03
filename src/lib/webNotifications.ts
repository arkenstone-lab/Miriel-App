import i18n from '@/i18n'

let pollingInterval: ReturnType<typeof setInterval> | null = null
let lastFiredKey = ''

/** Request browser notification permission. Returns true if granted. */
export async function requestWebPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/** Show a browser notification */
export function showWebNotification(title: string, body: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  new Notification(title, { body })
}

/**
 * Schedule web notifications via polling (checks every 30s).
 * Fires morning, evening, and weekly review notifications when time matches.
 * Only works while the tab is open (demo-level).
 */
export function scheduleWebNotifications(settings: {
  morningNotificationTime: string
  eveningNotificationTime: string
  weeklyReviewDay: number   // 0=Mon..6=Sun
  weeklyReviewTime: string
}) {
  cancelWebNotifications()

  pollingInterval = setInterval(() => {
    const now = new Date()
    const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    // JS getDay(): 0=Sun..6=Sat → convert to our convention 0=Mon..6=Sun
    const jsDay = now.getDay()
    const ourDay = jsDay === 0 ? 6 : jsDay - 1

    const dateKey = now.toISOString().split('T')[0]

    // Morning
    if (hhmm === settings.morningNotificationTime) {
      const key = `morning-${dateKey}`
      if (lastFiredKey !== key) {
        lastFiredKey = key
        showWebNotification(
          i18n.t('settings:notifications.morningTitle'),
          i18n.t('settings:notifications.morningBody'),
        )
      }
    }

    // Evening
    if (hhmm === settings.eveningNotificationTime) {
      const key = `evening-${dateKey}`
      if (lastFiredKey !== key) {
        lastFiredKey = key
        showWebNotification(
          i18n.t('settings:notifications.eveningTitle'),
          i18n.t('settings:notifications.eveningBody'),
        )
      }
    }

    // Weekly review
    if (ourDay === settings.weeklyReviewDay && hhmm === settings.weeklyReviewTime) {
      const key = `weekly-${dateKey}`
      if (lastFiredKey !== key) {
        lastFiredKey = key
        showWebNotification(
          i18n.t('settings:notifications.weeklyTitle'),
          i18n.t('settings:notifications.weeklyBody'),
        )
      }
    }
  }, 30_000) // check every 30 seconds
}

/** Cancel the web notification polling interval */
export function cancelWebNotifications() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}
