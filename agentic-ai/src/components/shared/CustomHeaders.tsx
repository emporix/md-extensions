import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

interface HeaderPair {
  id: string;
  key: string;
  value: string;
}

interface CustomHeadersProps {
  value: Record<string, any>;
  onChange: (headers: Record<string, any>) => void;
}

export const CustomHeaders: React.FC<CustomHeadersProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [headers, setHeaders] = useState<HeaderPair[]>([]);

  // Initialize headers from value prop
  useEffect(() => {
    const headerPairs: HeaderPair[] = Object.entries(value || {}).map(([key, value], index) => ({
      id: `header-${index}`,
      key,
      value: String(value)
    }));
    setHeaders(headerPairs);
  }, [value]);

  // Add a new empty header row
  const addHeader = () => {
    const newHeader: HeaderPair = {
      id: `header-${Date.now()}`,
      key: '',
      value: ''
    };
    setHeaders(prev => [...prev, newHeader]);
  };

  const removeHeader = (id: string) => {
    setHeaders(prev => {
      const filtered = prev.filter(header => header.id !== id);
      setTimeout(() => syncToParent(), 0);
      return filtered;
    });
  };

  const updateHeader = (id: string, field: 'key' | 'value', newValue: string) => {
    setHeaders(prev => prev.map(header => 
      header.id === id ? { ...header, [field]: newValue } : header
    ));
  };

  const handleKeyBlur = () => {
    // Sync to parent when user finishes typing
    syncToParent();
  };

  // Sync non-empty headers to parent
  const syncToParent = () => {
    const headersObject: Record<string, any> = {};
    headers.forEach(header => {
      if (header.key.trim()) {
        headersObject[header.key.trim()] = header.value;
      }
    });
    onChange(headersObject);
  };





  return (
    <div className="custom-headers">
      <div className="headers-list">
        {headers.map((header) => (
          <div key={header.id} className="header-row">
            <InputText
              value={header.key}
              onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
              onBlur={handleKeyBlur}
              placeholder={t('key', 'Key')}
              className="header-key"
            />
            <InputText
              value={header.value}
              onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
              onBlur={handleKeyBlur}
              placeholder={t('value', 'Value')}
              className="header-value"
            />
            <Button
              icon="pi pi-minus"
              onClick={() => removeHeader(header.id)}
              className="header-remove-btn"
            />
          </div>
        ))}
      </div>
      <div className="header-add-section">
        <Button
          icon="pi pi-plus"
          onClick={addHeader}
          className="header-add-btn"
        />
      </div>
    </div>
  );
}; 