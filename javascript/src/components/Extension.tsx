import React, { useEffect } from "react";
import { Container } from "./Container";
import { logger } from "../utils/logger";

/**
 * 拡張機能のルートコンポーネント
 */
export const Extension: React.FC = () => {
  // ログ要素の設定
  useEffect(() => {
    const logElement = document.getElementById("log");
    if (logElement) {
      logger.setLogElement(logElement);
      logger.suppress = false;
      logger.log("プロンプト君初期化完了");
    }
  }, []);

  return (
    <div className="prompt-kun-extension">
      <Container />
    </div>
  );
};
