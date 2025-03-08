import React, { useState, useEffect } from "react";
import type { ContainerData, GroupData, Prompt } from "../types";
import { Group } from "./Group";
import { containerToPrompt, setPromptToTextarea } from "../utils/prompt";
import { PROMPT_STORAGE_KEY } from "../constants";
import { logger } from "../utils/logger";

/**
 * コンテナコンポーネント
 * 複数のグループコンポーネントをまとめて管理するルートコンテナ
 */
export const Container: React.FC = () => {
  const [data, setData] = useState<ContainerData>({ groups: [] });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 初期化時にローカルストレージから読み込み
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(PROMPT_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
        logger.log("ローカルストレージからデータを読み込みました");
      }
    } catch (error) {
      console.error("ローカルストレージからの読み込みに失敗しました", error);
    }
  }, []);

  // データ変更時にローカルストレージに保存
  useEffect(() => {
    if (data.groups.length > 0) {
      try {
        localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(data));

        // プロンプトを生成してテキストエリアに設定
        const prompt = containerToPrompt(data);
        setPromptToTextarea(prompt);

        logger.log("データを保存しました");
      } catch (error) {
        console.error("データの保存に失敗しました", error);
      }
    }
  }, [data]);

  // グループの追加
  const handleAddGroup = () => {
    const newGroup: GroupData = {
      enabled: true,
      name: "Group",
      factor: null,
      texts: { texts: [] },
      groups: [],
      isNegative: false,
    };

    setData({
      groups: [...data.groups, newGroup],
    });

    logger.log("グループを追加しました");
  };

  // グループの変更
  const handleGroupChange = (index: number, groupData: GroupData) => {
    const newGroups = [...data.groups];
    newGroups[index] = groupData;

    setData({
      groups: newGroups,
    });
  };

  // グループの削除
  const handleGroupDelete = (index: number) => {
    const newGroups = [...data.groups];
    newGroups.splice(index, 1);

    setData({
      groups: newGroups,
    });

    logger.log("グループを削除しました");
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

      setData({
        groups: newGroups,
      });
    };

  // クリップボードにコピー
  const handleCopyToClipboard = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data));
      logger.log("データをクリップボードにコピーしました");
    } catch (error) {
      console.error("クリップボードへのコピーに失敗しました", error);
    }
  };

  // ファイルから読み込み
  const handleReadFromFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.addEventListener("change", (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsedData = JSON.parse(content);
            setData(parsedData);
            logger.log("ファイルからデータを読み込みました");
          } catch (error) {
            console.error("ファイルの読み込みに失敗しました", error);
          }
        };
        reader.readAsText(file);
      }
    });
    input.click();
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    backgroundColor: "transparent",
  };

  const controlsStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "4px",
    gap: "4px",
  };

  const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "32px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#2a623a",
    color: "white",
    cursor: "pointer",
    padding: "0 8px",
  };

  const addButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    width: "32px",
    padding: "0",
  };

  const groupsContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={containerStyle}>
      {/* 操作ボタン */}
      <div style={controlsStyle}>
        <button style={buttonStyle} onClick={handleCopyToClipboard}>
          Copy to clipboard
        </button>
        <button style={buttonStyle} onClick={handleReadFromFile}>
          Read from file
        </button>
        <button style={addButtonStyle} onClick={handleAddGroup}>
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

      {/* グループコンテナ */}
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
  );
};
