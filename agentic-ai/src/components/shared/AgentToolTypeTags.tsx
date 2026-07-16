import React from 'react'

interface AgentToolTypeTagsProps {
  tags: string[]
}

export const AgentToolTypeTags: React.FC<AgentToolTypeTagsProps> = ({
  tags,
}) => {
  if (tags.length === 0) {
    return null
  }

  return (
    <div className="agent-detail-tools-row-tags">
      {tags.map((tag) => (
        <span key={tag} className="agent-detail-tools-tag">
          {tag}
        </span>
      ))}
    </div>
  )
}
