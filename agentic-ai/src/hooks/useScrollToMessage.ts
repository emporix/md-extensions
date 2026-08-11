import React, { useEffect, RefObject } from 'react'
import { LogMessage } from '../types/Log'
import UnifiedLogsTable from '../components/shared/UnifiedLogsTable'

export const useScrollToMessage = (
  dataTableRef: RefObject<React.ComponentRef<typeof UnifiedLogsTable>>,
  messages?: LogMessage[],
  scrollToMessage?: string,
  isVisible: boolean = true
) => {
  useEffect(() => {
    if (!isVisible || !messages || !scrollToMessage) return

    sessionStorage.removeItem('scrollToMessage')

    const targetMessage = messages.find(
      (msg) => msg.timestamp === scrollToMessage
    )

    if (!targetMessage) return

    const attemptScroll = (attempt = 0) => {
      if (attempt > 10) return

      const tableElement =
        dataTableRef.current?.getElement?.() || dataTableRef.current

      if (!tableElement) {
        setTimeout(() => attemptScroll(attempt + 1), 200)
        return
      }

      const element =
        tableElement instanceof HTMLElement
          ? tableElement
          : (
              tableElement as unknown as {
                getElement?: () => HTMLElement | null
              }
            )?.getElement?.() || null

      if (!element) {
        setTimeout(() => attemptScroll(attempt + 1), 200)
        return
      }

      const messageCell = element.querySelector(
        `[data-log-timestamp="${CSS.escape(scrollToMessage)}"]`
      )

      if (!messageCell) {
        setTimeout(() => attemptScroll(attempt + 1), 100)
        return
      }

      const row = messageCell.closest('tr')

      if (!row || !(row instanceof HTMLElement)) {
        setTimeout(() => attemptScroll(attempt + 1), 100)
        return
      }

      row.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })

      row.style.backgroundColor = '#fff3cd'
      row.style.transition = 'background-color 2s ease'

      setTimeout(() => {
        row.style.backgroundColor = ''
      }, 2000)
    }

    setTimeout(() => attemptScroll(), 200)
  }, [dataTableRef, messages, scrollToMessage, isVisible])
}
