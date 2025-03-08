import React, { useState, useRef, useEffect } from "react";
import type { TextData } from "../types";
import { isTextNegative } from "../utils/prompt";
import { NEGATIVE_PREFIX } from "../constants";

interface TextProps {
  data: TextData;
  onChange: (data: TextData) => void;
  onDelete: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * テキストコンポーネント
 * 個別のプロンプトテキストを表示・編集するためのコンポーネント
 */
export const Text: React.FC<TextProps> = ({
  data,
  onChange,
  onDelete,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [initialText, setInitialText] = useState(data.text);
  const [initialFactor, setInitialFactor] = useState(data.factor);
  const [isFactorFocused, setIsFactorFocused] = useState(false);
  const textInputRef = useRef<HTMLDivElement>(null);
  const factorInputRef = useRef<HTMLDivElement>(null);

  // テキスト入力ハンドラ
  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    // focus中は親コンポーネントに通知しない（入力完了時のみ通知）
    if (!isFocused) {
      const newText = e.currentTarget.textContent || "";
      onChange({
        ...data,
        text: newText,
        isNegative: isTextNegative(newText),
      });
    }
  };

  // factor入力ハンドラ
  const handleFactorChange = (e: React.FormEvent<HTMLDivElement>) => {
    // focus中は親コンポーネントに通知しない（入力完了時のみ通知）
    if (!isFactorFocused) {
      const value = parseFloat(e.currentTarget.textContent || "1");
      onChange({
        ...data,
        factor: isNaN(value) ? null : value,
      });
    }
  };

  // 有効/無効の切り替え
  const handleToggleEnabled = () => {
    onChange({
      ...data,
      enabled: !data.enabled,
    });
  };

  // 削除
  const handleDelete = () => {
    onDelete();
  };

  // キーボードイベント
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      textInputRef.current?.blur();
    } else if (e.key === "Escape") {
      textInputRef.current?.blur();
    }
  };

  // factorのキーボードイベント
  const handleFactorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      factorInputRef.current?.blur();
    }
  };

  // テキストのフォーカス時
  const handleTextFocus = () => {
    setIsFocused(true);
    setInitialText(textInputRef.current?.textContent || "");
    setIsEditing(true);
  };

  // テキストのブラー時
  const handleTextBlur = () => {
    setIsFocused(false);
    setIsEditing(false);

    const newText = textInputRef.current?.textContent || "";

    // テキストが空の場合は削除
    if (newText.trim().length === 0) {
      onDelete();
      return;
    }

    // 変更があった場合のみ通知
    if (newText !== initialText) {
      onChange({
        ...data,
        text: newText,
        isNegative: isTextNegative(newText),
      });
    }
  };

  // factorのフォーカス時
  const handleFactorFocus = () => {
    setIsFactorFocused(true);
    setInitialFactor(data.factor);
  };

  // factorのブラー時
  const handleFactorBlur = () => {
    setIsFactorFocused(false);

    const newFactorText = factorInputRef.current?.textContent || "";
    const newFactor = parseFloat(newFactorText);
    const newFactorValue = isNaN(newFactor) ? null : newFactor;

    // 変更があった場合のみ通知
    if (newFactorValue !== initialFactor) {
      onChange({
        ...data,
        factor: newFactorValue,
      });
    }
  };

  // ドラッグハンドルのマウスダウンイベント
  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    // 親要素をdraggableに設定
    const parent = e.currentTarget.parentElement;
    if (parent) {
      parent.setAttribute("draggable", "true");
    }

    // マウスアップ時にdraggable属性を削除
    const mouseUpHandler = () => {
      if (parent) {
        parent.removeAttribute("draggable");
      }
      document.removeEventListener("mouseup", mouseUpHandler);
    };
    document.addEventListener("mouseup", mouseUpHandler);
  };

  // コンテキストメニュー（右クリック）
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (data.enabled) {
      // 有効 → 無効
      handleToggleEnabled();
    } else {
      // 無効 → 削除
      handleDelete();
    }
  };

  // クリックイベント
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.enabled) {
      // 無効時に有効化
      handleToggleEnabled();
    }
  };

  // スタイルの計算
  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "4px",
    border: "1px solid #333",
    borderRadius: "4px",
    backgroundColor: isTextNegative(data.text) ? "#3a273a" : "#1a3a1a",
    color: "#ddd",
    opacity: data.enabled ? 1 : 0.5,
    cursor: "pointer",
    userSelect: "none",
  };

  const dragIconStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "4px",
    padding: "2px",
    cursor: "move",
  };

  const textInputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: "50px",
    padding: "2px",
    borderRadius: "4px",
    border: "none",
    borderBottom: "1px solid #555",
    outline: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textDecoration: !data.enabled ? "line-through" : "",
    backgroundColor: isEditing ? "#1c2333" : "transparent",
    color: "#ddd",
  };

  const factorInputStyle: React.CSSProperties = {
    borderRadius: "4px",
    outline: "none",
    textAlign: "center",
    fontSize: "0.9em",
    color: "#ddd",
    backgroundColor: "transparent",
    display: data.factor !== null ? "block" : "none",
  };

  return (
    <div
      style={containerStyle}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* ドラッグハンドル */}
      <div style={dragIconStyle} onMouseDown={handleDragHandleMouseDown}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16px"
          height="16px"
          viewBox="0 0 512 512"
        >
          <path
            fill="#ddd"
            d="M278.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l9.4-9.4V224H109.3l9.4-9.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4l114.7.1v114.7l-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-9.4 9.4l.1-114.7h114.7l-9.4 9.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l9.4 9.4L288 224V109.3l9.4 9.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-64-64z"
          />
        </svg>
      </div>

      {/* テキスト入力 */}
      <div
        ref={textInputRef}
        style={textInputStyle}
        contentEditable
        suppressContentEditableWarning
        onInput={handleTextChange}
        onKeyDown={handleKeyDown}
        onFocus={handleTextFocus}
        onBlur={handleTextBlur}
      >
        {data.text}
      </div>

      {/* factor入力 */}
      <div
        ref={factorInputRef}
        style={factorInputStyle}
        contentEditable
        suppressContentEditableWarning
        onInput={handleFactorChange}
        onKeyDown={handleFactorKeyDown}
        onFocus={handleFactorFocus}
        onBlur={handleFactorBlur}
        data-before=":"
      >
        {data.factor !== null ? data.factor.toFixed(2) : ""}
      </div>
    </div>
  );
};
