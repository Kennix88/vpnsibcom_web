'use client'

import { TbSparkles } from 'react-icons/tb'
import TooltipWrapper from '../TooltipWrapper' // путь скорректируй под реальное расположение

/**
 * Бейдж "+N", показывающий, что лимит расширен относительно дефолтного
 * значения (за счёт выполненных заданий). Переиспользуется везде, где
 * сравнивается текущее значение с `default` из ответа API.
 */
export function BonusBadge({
  amount,
  tooltip,
}: {
  amount: string
  tooltip: string
}) {
  return (
    <TooltipWrapper color="default" placement="top" prompt={tooltip}>
      <span
        className="flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full cursor-help shrink-0"
        style={{
          background: 'rgba(55,227,162,0.14)',
          color: 'var(--success)',
        }}>
        <TbSparkles size={10} />
        {amount}
      </span>
    </TooltipWrapper>
  )
}
