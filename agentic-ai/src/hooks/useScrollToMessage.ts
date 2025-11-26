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

      const tbody = element.querySelector('.p-datatable-tbody')

      if (!tbody) {
        setTimeout(() => attemptScroll(attempt + 1), 100)
        return
      }

      // Find the row by matching timestamp and message in the DOM
      // Iterate through all rows and check both timestamp and message
      for (let i = 0; i < tbody.children.length; i++) {
        const row = tbody.children[i] as HTMLElement

        // Get all cells in the row
        const cells = row.querySelectorAll('td')
        if (cells.length < 4) continue

        // Column order: severity (0), timestamp (1), agentId (2), message (3)
        const timestampCell = cells[1]
        const messageCell = cells[3]

        if (!timestampCell || !messageCell) continue

        // Get cell text content and remove prefixes
        const timestampText = (timestampCell.textContent?.trim() || '').replace(
          'Timestamp',
          ''
        )
        const messageText = (messageCell.textContent?.trim() || '').replace(
          'Message',
          ''
        )

        // Format the target timestamp for comparison
        const formattedTargetTimestamp = new Date(
          targetMessage.timestamp
        ).toLocaleString()

        if (
          timestampText !== formattedTargetTimestamp ||
          messageText !== targetMessage.message.replace(/\n/g, '')
        )
          continue

        row.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })

        row.style.backgroundColor = '#fff3cd'
        row.style.transition = 'background-color 2s ease'

        setTimeout(() => {
          row.style.backgroundColor = ''
        }, 2000)

        return
      }

      // Row not found yet, retry after a short delay
      setTimeout(() => attemptScroll(attempt + 1), 100)
    }

    // Start scrolling attempts after a short delay to ensure table is rendered
    setTimeout(() => attemptScroll(), 200)
  }, [dataTableRef, messages, scrollToMessage, isVisible])
}
