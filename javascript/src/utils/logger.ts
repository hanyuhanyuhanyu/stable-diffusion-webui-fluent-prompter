/**
 * ログ機能を提供するクラス
 */
export class Logger {
  private _logElement: HTMLElement | null = null;
  public suppress = true;

  /**
   * ログ要素の設定
   */
  setLogElement(element: HTMLElement | null): void {
    this._logElement = element;
  }

  /**
   * ログの追加
   */
  log(message: string): void {
    if (this.suppress) return;
    // コンソールに出力
    console.log(message);
    // ログ要素がある場合はそこにも追加
    if (this._logElement) {
      const entry = document.createElement("div");
      entry.className = "log-entry";
      entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
      this._logElement.prepend(entry);
    }
  }
}

// グローバルロガーのインスタンス
export const logger = new Logger();
