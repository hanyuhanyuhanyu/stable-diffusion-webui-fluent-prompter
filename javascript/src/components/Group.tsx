import React, { useState, useRef } from "react";
import type { GroupData, TextsData } from "../types";
import { Texts } from "./Texts";
import { isTextNegative } from "../utils/prompt";
import { NEGATIVE_PREFIX } from "../constants";

interface GroupProps {
  data: GroupData;
  onChange: (data: GroupData) => void;
  onDelete: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * グループコンポーネント
 * テキストとサブグループを含むグループを管理するコンポーネント
 */
export const Group: React.FC<GroupProps> = ({
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
  const [isOpen, setIsOpen] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const nameInputRef = useRef<HTMLDivElement>(null);
  const factorInputRef = useRef<HTMLDivElement>(null);

  // 名前入力ハンドラ
  const handleNameChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newName = e.currentTarget.textContent || "Group";
    onChange({
      ...data,
      name: newName,
      isNegative: isTextNegative(newName),
    });
  };

  // factor入力ハンドラ
  const handleFactorChange = (e: React.FormEvent<HTMLDivElement>) => {
    const value = parseFloat(e.currentTarget.textContent || "1");
    onChange({
      ...data,
      factor: isNaN(value) ? null : value,
    });
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

  // アコーディオンの開閉
  const handleToggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  // テキストの変更
  const handleTextsChange = (textsData: TextsData) => {
    onChange({
      ...data,
      texts: textsData,
    });
  };

  // サブグループの追加
  const handleAddGroup = () => {
    const newGroup: GroupData = {
      enabled: true,
      name: "Group",
      factor: null,
      texts: { texts: [] },
      groups: [],
      isNegative: false,
    };

    onChange({
      ...data,
      groups: [...data.groups, newGroup],
    });
  };

  // サブグループの変更
  const handleGroupChange = (index: number, groupData: GroupData) => {
    const newGroups = [...data.groups];
    newGroups[index] = groupData;

    onChange({
      ...data,
      groups: newGroups,
    });
  };

  // サブグループの削除
  const handleGroupDelete = (index: number) => {
    const newGroups = [...data.groups];
    newGroups.splice(index, 1);

    onChange({
      ...data,
      groups: newGroups,
    });
  };

  // ドラッグ開始
  const handleDragStart =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";

      // ドラッグ中の見た目を調整
      setTimeout(() => {
        if (e.currentTarget) {
          e.currentTarget.style.opacity = "0.4";
        }
      }, 0);
    };

  // ドラッグ終了
  const handleDragEnd =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      setDraggedIndex(null);

      // 見た目を元に戻す
      if (e.currentTarget) {
        e.currentTarget.style.opacity = "";
        e.currentTarget.removeAttribute("draggable");
      }
    };

  // ドラッグオーバー
  const handleDragOver =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (draggedIndex === null || draggedIndex === index) {
        return;
      }

      // マウス位置を取得
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      // 上半分か下半分かによってスタイルを変更
      if (e.clientY < midY) {
        e.currentTarget.style.borderTop = "3px solid blue";
        e.currentTarget.style.borderBottom = "";
      } else {
        e.currentTarget.style.borderTop = "";
        e.currentTarget.style.borderBottom = "3px solid blue";
      }
    };

  // ドラッグリーブ
  const handleDragLeave =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderTop = "";
      e.currentTarget.style.borderBottom = "";
    };

  // ドロップ
  const handleDrop =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.style.borderTop = "";
      e.currentTarget.style.borderBottom = "";

      if (draggedIndex === null || draggedIndex === index) {
        return;
      }

      // マウス位置を取得
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      // 新しい配列を作成
      const newGroups = [...data.groups];
      const [draggedItem] = newGroups.splice(draggedIndex, 1);

      // 上半分か下半分かによって挿入位置を決定
      if (e.clientY < midY) {
        // 上半分：このGroupの前に挿入
        newGroups.splice(
          index > draggedIndex ? index - 1 : index,
          0,
          draggedItem
        );
      } else {
        // 下半分：このGroupの後に挿入
        newGroups.splice(
          index < draggedIndex ? index + 1 : index,
          0,
          draggedItem
        );
      }

      onChange({
        ...data,
        groups: newGroups,
      });
    };

  // ドラッグハンドルのマウスダウンイベント
  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    // 親要素をdraggableに設定
    const parent = e.currentTarget.parentElement?.parentElement;
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

  // ヘッダークリックイベント
  const handleHeaderClick = (e: React.MouseEvent) => {
    // ボタンクリックの場合は処理しない
    if (
      e.target instanceof HTMLButtonElement ||
      (e.target as HTMLElement).closest("button")
    ) {
      return;
    }

    // 編集可能要素がフォーカスされている場合は処理しない
    if ((e.target as HTMLElement).isContentEditable) {
      return;
    }

    if (!data.enabled) {
      // 無効時に有効化
      handleToggleEnabled();
    } else {
      // アコーディオン開閉
      handleToggleAccordion();
    }
  };

  // factorのキーボードイベント
  const handleFactorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      factorInputRef.current?.blur();
    }
  };

  // スタイルの計算
  const containerStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: "4px",
    boxSizing: "border-box",
    padding: "0 8px",
  };

  const innerContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    border: "1px solid #333",
    borderRadius: "4px",
    backgroundColor: "#0B0F19",
    color: "#ddd",
    opacity: data.enabled ? 1 : 0.5,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "4px",
    backgroundColor: isTextNegative(data.name) ? "#3a273a" : "#1c2333",
    borderBottom: "1px solid #333",
    borderRadius: "4px 4px 0 0",
    cursor: "pointer",
    position: "relative",
  };

  const dragIconStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "4px",
    padding: "2px",
    cursor: "move",
  };

  const nameInputStyle: React.CSSProperties = {
    minWidth: "100px",
    padding: "4px",
    borderRadius: "4px",
    border: "none",
    borderBottom: "1px solid #555",
    outline: "none",
    fontWeight: "bold",
    color: "#ddd",
    backgroundColor: "transparent",
    textDecoration: !data.enabled ? "line-through" : "",
  };

  const factorInputStyle: React.CSSProperties = {
    borderRadius: "4px",
    outline: "none",
    textAlign: "center",
    fontSize: "0.9em",
    marginLeft: "8px",
    color: "#ddd",
    backgroundColor: "transparent",
    display: data.factor !== null ? "block" : "none",
  };

  const addGroupBtnStyle: React.CSSProperties = {
    position: "absolute",
    right: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "32px",
    width: "32px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#2a623a",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9em",
  };

  const contentStyle: React.CSSProperties = {
    padding: "4px",
    display: isOpen ? "block" : "none",
  };

  const groupsContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
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
    >
      <div style={innerContainerStyle}>
        {/* ヘッダー部分 */}
        <div
          style={headerStyle}
          className={isOpen ? "" : "closed"}
          onClick={handleHeaderClick}
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

          {/* アコーディオンアイコン */}
          <span style={{ marginRight: "4px" }}>{isOpen ? "▼" : "▶"}</span>

          {/* グループ名入力 */}
          <div
            ref={nameInputRef}
            style={nameInputStyle}
            contentEditable
            suppressContentEditableWarning
            onInput={handleNameChange}
          >
            {data.name}
          </div>

          {/* factor入力 */}
          <div
            ref={factorInputRef}
            style={factorInputStyle}
            contentEditable
            suppressContentEditableWarning
            onInput={handleFactorChange}
            onKeyDown={handleFactorKeyDown}
            data-before=":"
          >
            {data.factor !== null ? data.factor.toFixed(2) : ""}
          </div>

          {/* グループ追加ボタン */}
          <button style={addGroupBtnStyle} onClick={handleAddGroup}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
            >
              <path
                fill="#f7efef"
                d="M6.5 1.75a.75.75 0 0 0-1.5 0V5H1.75a.75.75 0 0 0 0 1.5H5v3.25a.75.75 0 0 0 1.5 0V6.5h3.25a.75.75 0 0 0 0-1.5H6.5z"
              />
            </svg>
          </button>
        </div>

        {/* コンテンツ部分 */}
        <div style={contentStyle}>
          {/* Textsコンポーネント */}
          <Texts data={data.texts} onChange={handleTextsChange} />

          {/* サブグループ */}
          <div style={groupsContainerStyle}>
            {data.groups.map((groupData, index) => (
              <Group
                key={index}
                data={groupData}
                onChange={(newData) => handleGroupChange(index, newData)}
                onDelete={() => handleGroupDelete(index)}
                onDragStart={handleDragStart(index)}
                onDragEnd={handleDragEnd(index)}
                onDragOver={handleDragOver(index)}
                onDragLeave={handleDragLeave(index)}
                onDrop={handleDrop(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
