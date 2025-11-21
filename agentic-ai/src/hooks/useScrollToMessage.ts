import { useEffect, RefObject } from 'react';
import { LogMessage } from '../types/Log';

/**
 * Custom hook to handle scrolling to a specific message in a DataTable
 * @param dataTableRef - Ref to the DataTable component
 * @param messages - Array of log messages
 * @param scrollToMessage - Timestamp of message to scroll to
 * @param isVisible - Whether the component is visible (for dialogs)
 */
export const useScrollToMessage = (
  dataTableRef: RefObject<any>,
  messages?: LogMessage[],
  scrollToMessage?: string,
  isVisible: boolean = true
) => {
  useEffect(() => {
    if (!isVisible || !messages || !scrollToMessage) return;

    // Clear the stored timestamp
    sessionStorage.removeItem('scrollToMessage');
    
    // Find the message with matching timestamp
    const messageIndex = messages.findIndex(msg => msg.timestamp === scrollToMessage);
    
    if (messageIndex === -1) return;

    const attemptScroll = (attempt = 0) => {
      if (attempt > 10) return;
      
      const tableElement = dataTableRef.current?.getElement?.() || dataTableRef.current;
      
      if (!tableElement) {
        setTimeout(() => attemptScroll(attempt + 1), 200);
        return;
      }

      // Try different selectors for the table body
      const tbody = tableElement.querySelector('.p-datatable-tbody') || 
                   tableElement.querySelector('tbody') ||
                   tableElement.querySelector('[data-pc-section="tbody"]') ||
                   tableElement.querySelector('[role="rowgroup"]');
      
      if (tbody && tbody.children[messageIndex]) {
        const targetRow = tbody.children[messageIndex] as HTMLElement;
        
        // Scroll the row into view
        targetRow.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Highlight the row temporarily
        targetRow.style.backgroundColor = '#fff3cd';
        targetRow.style.transition = 'background-color 2s ease';
        
        setTimeout(() => {
          targetRow.style.backgroundColor = '';
        }, 2000);
        
        return;
      }
      
      // Retry after a short delay
      setTimeout(() => attemptScroll(attempt + 1), 100);
    };
    
    // Start scrolling attempts after a short delay to ensure table is rendered
    setTimeout(() => attemptScroll(), 200);
  }, [dataTableRef, messages, scrollToMessage, isVisible]);
};

