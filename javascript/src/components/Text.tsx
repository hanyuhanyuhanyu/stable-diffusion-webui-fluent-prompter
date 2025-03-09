import React, { useState, useRef, useEffect, useImperativeHandle } from "react";
import type { TextData } from "../types";
import { isTextNegative } from "../utils/prompt";
import DragSVG from "./atom/DragSVG";
import { css } from "@emotion/css";

interface TextProps {
  initial?: TextData;
  isNegative?: boolean;
  ref?: React.Ref<unknown>;
  onChange: (data: TextData) => void;
  removeRequested: () => void;
  draggable?: boolean;
  newInputRequest?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}
const styles = {
  factor: css`
    &::before {
      content: ":";
    }
  `,
};

/**
 * テキストコンポーネント
 * 個別のプロンプトテキストを表示・編集するためのコンポーネント
 */
export const Text: React.FC<TextProps> = ({
  initial,
  ref,
  onChange,
  removeRequested: onDelete,
  draggable,
  newInputRequest,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLDivElement>(null);
  const factorInputRef = useRef<HTMLDivElement>(null);
  const data = useRef(
    Object.assign(
      {
        enabled: false,
        text: "",
        factor: null,
        isNegative: false,
      } as TextData,
      initial
    )
  );
  useImperativeHandle(
    ref,
    () => {
      if (!ref) return {};
      return {
        focus: () => textInputRef.current?.focus(),
      };
    },
    []
  );

  const update = (d: Partial<TextData>) => {
    const newState = Object.assign({}, data.current, d);
    if (JSON.stringify(newState) === JSON.stringify(data.current)) return;
    data.current = newState;
    onChange(data.current);
  };

  const negate = () => update({ isNegative: !data.current.isNegative });

  const enable = () => update({ enabled: true });
  const disable = () => update({ enabled: false });
  const blur = () => {
    textInputRef.current?.blur();
    factorInputRef.current?.blur();
  };

  useEffect(() => {
    if (!initial) return;
    if (textInputRef.current) textInputRef.current.textContent = initial.text;
    if (factorInputRef.current)
      factorInputRef.current.textContent =
        initial.factor === null ? "" : String(initial.factor);
  }, [initial]);

  // キーボードイベント
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      blur();
      if (e.ctrlKey) return;
      newInputRequest?.();
    } else if (e.key === "Escape") {
      blur();
    } else {
      return;
    }
  };

  // factorのキーボードイベント
  const handleFactorKeyDown = handleKeyDown;

  // テキストのブラー時
  const handleTextBlur = () => {
    const newText = textInputRef.current?.textContent || "";

    // テキストが空の場合は削除
    if (newText.trim().length === 0) {
      onDelete();
      return;
    }
    if (newText === data.current.text) return;
    update({ text: newText });
  };

  // factorのブラー時
  const handleFactorBlur = () => {
    const current = factorInputRef.current;
    if (!current) return;
    const newFactorText = current.textContent?.trim() || "";
    const newFactor = parseFloat(newFactorText);
    const newFactorValue =
      !newFactorText || isNaN(newFactor) ? null : newFactor;
    console.log(newFactorValue);
    current.textContent =
      newFactorValue === null ? null : String(newFactorValue);
    update({ factor: newFactorValue });
  };

  // ドラッグハンドルのマウスダウンイベント
  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    // 親要素をdraggableに設定
    const current = baseRef.current;
    if (!current) return;
    current.setAttribute("draggable", "true");

    // マウスアップ時にdraggable属性を削除
    const mouseUpHandler = () => {
      current.removeAttribute("draggable");
      document.removeEventListener("mouseup", mouseUpHandler);
    };
    document.addEventListener("mouseup", mouseUpHandler);
  };

  // コンテキストメニュー（右クリック）
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!data.current.enabled) {
      onDelete();
      return;
    }
    disable();
  };

  // クリックイベント
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // on alt,negate
    if (e.altKey) negate();
    // on ctrl, choose
    // TODO: implement later
    enable();
  };

  // スタイルの計算
  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "4px",
    border: "1px solid #333",
    borderRadius: "4px",
    backgroundColor: data.current.isNegative ? "#3a273a" : "#1a3a1a",
    color: "#ddd",
    opacity: data.current.enabled ? 1 : 0.5,
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
    border: "none",
    borderBottom: "1px solid #555",
    outline: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textDecoration: !data.current.enabled ? "line-through" : "",
    color: "#ddd",
  };

  const factorInputStyle: React.CSSProperties = {
    display: "inline-block",
    minWidth: "2em",
    padding: "2px",
    border: "none",
    borderBottom: "1px solid #555",
    outline: "none",
    color: "#ddd",
    backgroundColor: "transparent",
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
      ref={baseRef}
    >
      {/* ドラッグハンドル */}
      <div style={dragIconStyle} onMouseDown={handleDragHandleMouseDown}>
        <DragSVG />
      </div>

      {/* テキスト入力 */}
      <div
        ref={textInputRef}
        style={textInputStyle}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onBlur={handleTextBlur}
      />

      {/* factor入力 */}
      <div
        ref={factorInputRef}
        className={styles.factor}
        style={factorInputStyle}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleFactorKeyDown}
        onBlur={handleFactorBlur}
        data-before=":"
      ></div>
    </div>
  );
};
