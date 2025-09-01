export interface Token {
  id: string;
  name: string;
  value?: string; // Optional for display, required for upsert
}

export interface TokenCardProps {
  token: Token;
  onConfigure: (token: Token) => void;
  onRemove: (tokenId: string) => void;
}

export interface TokenConfigPanelProps {
  visible: boolean;
  token: Token | null;
  onHide: () => void;
  onSave: (token: Token) => void;
}
