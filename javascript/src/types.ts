/**
 * 外部から提供される関数の型定義
 */
declare function onUiLoaded(callback: () => unknown): void;

/**
 * テキストデータの型定義
 */
export interface TextData {
  __type: "text";
  id: string;
  enabled: boolean;
  text: string;
  factor: number | null;
  isNegative: boolean;
}

/**
 * テキストグループデータの型定義
 */
export interface TextsData {
  texts: TextData[];
}

/**
 * グループデータの型定義
 */
export interface GroupData {
  __type: "group";
  id: string;
  enabled: boolean;
  name: string;
  factor: number | null;
  texts: TextsData;
  groups: GroupData[];
  isNegative: boolean;
}

/**
 * コンテナデータの型定義
 */
export interface ContainerData {
  groups: GroupData[];
}

/**
 * プロンプトの型定義
 */
export interface Prompt {
  positive: Array<string>;
  negative: Array<string>;
}

/**
 * Stable Diffusion Web UIから提供される関数
 */
declare function gradioApp(): Document;

/**
 * ドラッグ＆ドロップ関連の型定義
 */
export interface DragDropProps {
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}
