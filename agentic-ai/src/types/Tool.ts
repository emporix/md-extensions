export interface Tool {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
}

export interface ToolCardProps {
  tool: Tool;
  onConfigure: (tool: Tool) => void;
  onRemove: (toolId: string) => void;
}

export interface ToolConfigPanelProps {
  visible: boolean;
  tool: Tool | null;
  onHide: () => void;
  onSave: (tool: Tool) => void;
  appState: any; // Using any for now, can be typed more specifically later
}
