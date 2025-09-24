import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'primereact/dropdown';
import { AVAILABLE_TAGS } from '../../utils/constants';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = memo(({
  selectedTags,
  onTagsChange
}) => {
  const { t } = useTranslation();

  const tagOptions = AVAILABLE_TAGS.map(tag => ({
    label: tag,
    value: tag
  }));

  // For single select, we'll use the first tag or empty string
  const selectedTag = selectedTags.length > 0 ? selectedTags[0] : null;

  const handleTagChange = (value: string | null) => {
    onTagsChange(value ? [value] : []);
  };

  return (
    <div className="form-field">
      <label className="field-label">{t('tags', 'Tags')}</label>
      <Dropdown
        value={selectedTag}
        options={tagOptions}
        onChange={(e) => handleTagChange(e.value)}
        className="w-full"
        placeholder={t('select_tags', 'Select tags')}
        showClear
        appendTo="self"
      />
    </div>
  );
});

TagSelector.displayName = 'TagSelector'; 