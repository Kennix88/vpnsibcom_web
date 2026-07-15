'use client'

/**
 * Общий стек обработчиков аппаратной/UI кнопки "назад" в Telegram Mini App.
 *
 * Проблема, которую это решает: и страницы (TmaPage), и модалки хотят
 * управлять одной и той же глобальной кнопкой Telegram.WebApp.BackButton.
 * Если каждый компонент дёргает show()/hide()/onClick() напрямую и
 * независимо — они начинают затирать состояние друг друга (закрыли
 * модалку → случайно скрыли легитимную кнопку "назад" страницы, или
 * наоборот — она осталась видна там, где явно не нужна).
 *
 * Вместо этого — стек уровней. Последний запушенный уровень и есть
 * "источник истины": он определяет, видна ли кнопка и что происходит по
 * клику. Когда уровень снимается (unmount страницы / закрытие модалки),
 * стек откатывается к предыдущему уровню и синхронизирует кнопку под него.
 *
 * onBack = null означает "на этом уровне кнопка не нужна" (например,
 * главная страница) — но уровень всё равно занимает место в стеке: если
 * поверх него ничего больше нет, кнопка будет скрыта.
 */

type BackHandler = (() => void) | null

interface StackEntry {
  onBack: BackHandler
}

type BackButtonModule = typeof import('@tma.js/sdk-react')

const stack: StackEntry[] = []
let modulePromise: Promise<BackButtonModule> | null = null
let clickBound = false

function loadModule() {
  if (!modulePromise) modulePromise = import('@tma.js/sdk-react')
  return modulePromise
}

async function applyTop() {
  try {
    const { backButton } = await loadModule()
    const top = stack[stack.length - 1]
    if (!top || !top.onBack) {
      if (backButton.hide.isAvailable()) backButton.hide()
      return
    }
    if (backButton.show.isAvailable()) backButton.show()
  } catch (err) {
    console.error('Failed to sync BackButton state', err)
  }
}

async function ensureClickBound() {
  if (clickBound) return
  clickBound = true
  try {
    const { backButton } = await loadModule()
    backButton.onClick(() => {
      // Клик всегда обслуживает самый верхний уровень стека — то, что
      // сейчас реально "накрывает" экран (открытая модалка важнее
      // страницы под ней).
      const top = stack[stack.length - 1]
      top?.onBack?.()
    })
  } catch (err) {
    console.error('Failed to bind BackButton click', err)
    clickBound = false
  }
}

/**
 * Регистрирует уровень в стеке кнопки "назад".
 * Возвращает функцию снятия — вызвать в cleanup эффекта.
 */
export function pushBackHandler(onBack: BackHandler) {
  const entry: StackEntry = { onBack }
  stack.push(entry)
  ensureClickBound()
  applyTop()

  return () => {
    const idx = stack.indexOf(entry)
    if (idx !== -1) stack.splice(idx, 1)
    applyTop()
  }
}
