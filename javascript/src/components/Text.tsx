import React, { useRef, useEffect, useImperativeHandle, useState } from "react";
import type { TextData } from "../types";
import DragSVG from "./atom/DragSVG";
import { css } from "@emotion/css";

interface TextProps {
  initial?: TextData;
  isNegative?: boolean;
  ref?: React.Ref<unknown>;
  onChange: (data: TextData) => void;
  removeRequested: (id: string) => void;
  draggable?: boolean;
  newInputRequest?: (id: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
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
  removeRequested,
  newInputRequest,
  onDragEnd,
}) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLDivElement>(null);
  const factorInputRef = useRef<HTMLDivElement>(null);
  const [draggable, setDraggable] = useState(false);
  const data = useRef(
    Object.assign(
      {
        __type: "text",
        id: "",
        enabled: false,
        text: "",
        factor: null,
        isNegative: false,
      } satisfies TextData,
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
    if (textInputRef.current) textInputRef.current.textContent = newState.text;
    if (factorInputRef.current)
      factorInputRef.current.textContent =
        newState.factor === null ? "" : String(newState.factor);
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
      e.preventDefault();
      blur();
      if (e.ctrlKey) return;
      if (data.current.text.trim().length === 0) return;
      newInputRequest?.(data.current.id);
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
      removeRequested(data.current.id);
      return;
    }
    if (newText === data.current.text) return;
    update({ text: newText.replace(/[\n\r]/g, "") });
  };

  // factorのブラー時
  const handleFactorBlur = () => {
    const current = factorInputRef.current;
    if (!current) return;
    const newFactorText = current.textContent?.trim() || "";
    const newFactor = parseFloat(newFactorText);
    const newFactorValue =
      !newFactorText || isNaN(newFactor) ? null : newFactor;
    current.textContent =
      newFactorValue === null
        ? null
        : String(newFactorValue).replace(/[\n\r]/g, "");
    update({ factor: newFactorValue });
  };

  // ドラッグハンドルのマウスダウンイベント
  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    // 親要素をdraggableに設定
    setDraggable(true);

    // マウスアップ時にdraggable属性を削除
    const mouseUpHandler = () => {
      setDraggable(false);
      document.removeEventListener("mouseup", mouseUpHandler);
    };
    document.addEventListener("mouseup", mouseUpHandler);
  };

  // コンテキストメニュー（右クリック）
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!data.current.enabled) {
      removeRequested(data.current.id);
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

  useEffect(() => {
    if (!initial?.text) textInputRef.current?.focus();
  }, []);
  return (
    <div
      style={containerStyle}
      draggable={draggable}
      onDragStart={console.log}
      onDragEnd={(e) => onDragEnd?.(e, data.current.id)}
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
