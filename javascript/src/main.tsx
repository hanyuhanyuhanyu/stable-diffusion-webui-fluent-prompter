import { createRoot } from "react-dom/client";
import React from "react";
import { Extension } from "./components/Extension";
import { containerIds } from "./constants";

// グローバル関数の宣言
declare function onUiLoaded(callback: () => void): void;

// Stable Diffusion Web UI用の初期化
onUiLoaded(() => {
  // Gradioのコンポーネントを配置
  const formRoot = document.getElementById(containerIds.form);
  if (!formRoot) return;

  const toprow = document.getElementById("txt2img_toprow");
  const container = document.getElementById(containerIds.root);
  if (toprow && container) {
    toprow.parentNode?.insertBefore(container, toprow.nextSibling);
  }

  // Reactコンポーネントをレンダリング
  if (container) {
    createRoot(container).render(<Extension />);
  }
});
