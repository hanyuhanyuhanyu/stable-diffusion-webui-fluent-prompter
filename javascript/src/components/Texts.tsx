import React, { useState } from "react";
import type { TextData, TextsData } from "../types";
import { Text } from "./Text";

interface TextsProps {
  data: TextsData;
  onChange: (data: TextsData) => void;
}

/**
 * テキストグループコンポーネント
 * 複数のテキストコンポーネントをまとめて管理するコンポーネント
 */
export const Texts: React.FC<TextsProps> = ({ data, onChange }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // テキストの追加
  const handleAddText = () => {
    const newText: TextData = {
      enabled: true,
      text: "",
      factor: null,
      isNegative: false,
    };

    onChange({
      texts: [...data.texts, newText],
    });
  };

  // テキストの変更
  const handleTextChange = (index: number, textData: TextData) => {
    const newTexts = [...data.texts];
    newTexts[index] = textData;

    onChange({
      texts: newTexts,
    });
  };

  // テキストの削除
  const handleTextDelete = (index: number) => {
    const newTexts = [...data.texts];
    newTexts.splice(index, 1);

    onChange({
      texts: newTexts,
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
      const midX = rect.left + rect.width / 2;

      // 左半分か右半分かによってスタイルを変更
      if (e.clientX < midX) {
        e.currentTarget.style.borderLeft = "3px solid blue";
        e.currentTarget.style.borderRight = "";
      } else {
        e.currentTarget.style.borderLeft = "";
        e.currentTarget.style.borderRight = "3px solid blue";
      }
    };

  // ドラッグリーブ
  const handleDragLeave =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderLeft = "";
      e.currentTarget.style.borderRight = "";
    };

  // ドロップ
  const handleDrop =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.style.borderLeft = "";
      e.currentTarget.style.borderRight = "";

      if (draggedIndex === null || draggedIndex === index) {
        return;
      }

      // マウス位置を取得
      const rect = e.currentTarget.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;

      // 新しい配列を作成
      const newTexts = [...data.texts];
      const [draggedItem] = newTexts.splice(draggedIndex, 1);

      // 左半分か右半分かによって挿入位置を決定
      if (e.clientX < midX) {
        // 左半分：このTextの前に挿入
        newTexts.splice(
          index > draggedIndex ? index - 1 : index,
          0,
          draggedItem
        );
      } else {
        // 右半分：このTextの後に挿入
        newTexts.splice(
          index < draggedIndex ? index + 1 : index,
          0,
          draggedItem
        );
      }

      onChange({
        texts: newTexts,
      });
    };

  // コンテナクリック時に新しいテキストを追加
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // テキストコンポーネント自体のクリックでなければ新しいテキストを追加
    if ((e.target as HTMLElement).className === "texts-container") {
      handleAddText();
    }
  };

  // キーボードイベント
  const handleKeyDown =
    (index: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Backspace" && data.texts[index].text.length === 0) {
        // テキストが空の状態でBackspaceが押された場合、テキストを削除
        handleTextDelete(index);

        // 前のテキストにフォーカス
        if (index > 0) {
          const prevTextInput = document.querySelector(
            `[data-index="${index - 1}"] .text-input`
          ) as HTMLElement;
          if (prevTextInput) {
            prevTextInput.focus();
          }
        }
      } else if (e.key === "Enter") {
        e.preventDefault();

        // Enterキーで新しいテキストを追加
        handleAddText();

        // 次のテキストにフォーカス
        setTimeout(() => {
          const nextTextInput = document.querySelector(
            `[data-index="${data.texts.length}"] .text-input`
          ) as HTMLElement;
          if (nextTextInput) {
            nextTextInput.focus();
          }
        }, 0);
      }
    };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "4px",
    minHeight: "36px",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div
      className="texts-container"
      style={containerStyle}
      onClick={handleContainerClick}
    >
      {data.texts.map((textData, index) => (
        <Text
          key={index}
          data-index={index}
          initial={textData}
          onChange={(newData) => handleTextChange(index, newData)}
          removeRequested={() => handleTextDelete(index)}
          onDragStart={handleDragStart(index)}
          onDragEnd={handleDragEnd(index)}
          onDragOver={handleDragOver(index)}
          onDragLeave={handleDragLeave(index)}
          onDrop={handleDrop(index)}
        />
      ))}
    </div>
  );
};
