const containerIds = {
  root: "prompt-kun-container",
  form: "prompt-kun-form",
};
function toEachPrompt(obj) {
  return obj.toPrompt();
}

// 定数
const NEGATIVE_PREFIX = "n!"; // Negativeプロンプトの接頭辞
// ログ機能
class Logger {
  constructor(logElement = null) {
    this._logElement = logElement;
    this.suppress = true;
  }

  // ログ要素の設定
  setLogElement(element) {
    this._logElement = element;
  }

  // ログの追加
  log(message) {
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
const logger = new Logger();

// Textコンポーネントの実装
class PromptKunText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // 初期状態の設定
    this._enabled = true;
    this._text = "";
    this._factor = null; // factorの初期値はnull（表示しない）

    this.render();
  }

  // 属性が変更された時に呼ばれるコールバック
  static get observedAttributes() {
    return ["enabled", "text", "factor"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "enabled":
        this._enabled = newValue !== "false";
        break;
      case "text":
        this._text = newValue || "";
        break;
    }

    this.render();
  }

  // ゲッターとセッター
  get enabled() {
    return this._enabled;
  }

  set enabled(value) {
    this._enabled = Boolean(value);
    this.setAttribute("enabled", this._enabled.toString());
  }

  get text() {
    return this._text
      .trim()
      .replace(new RegExp("^" + NEGATIVE_PREFIX), "")
      .replace(/(\(|\))/g, "\\$1");
  }

  set text(value) {
    this._text = value || "";
    this.setAttribute("text", this._text);
  }

  get parent() {
    return this._parent;
  }
  set parent(parent) {
    this._parent = parent;
  }
  get factor() {
    return this._factor;
  }
  set factor(val) {
    if (isNaN(val)) this._factor = null;
    else if (val < 0) this._factor = 0;
    else {
      const rounded = String(Math.round(val * 100));
      this._factor = Number(
        `${rounded.slice(0, rounded.length - 2) || "0"}.${(
          "00" + rounded
        ).slice(-2)}`
      );
    }
  }

  // テキストがネガティブかどうかを判定
  isNegative() {
    return new RegExp(`^${NEGATIVE_PREFIX}`).test(this._text.trim());
  }

  // プロンプトがネガティブかどうかを判定（テキストの先頭がn!かどうか）
  isPromptNegative() {
    return this.isNegative();
  }

  // 初回描画
  connectedCallback() {
    if (!this.shadowRoot.querySelector(".container")) {
      this.createInitialDOM();
    }
    this.updateStyles();
  }

  // 初期DOMの作成（一度だけ実行）
  createInitialDOM() {
    const style = document.createElement("style");
    const container = document.createElement("div");
    container.className = "container";

    // アイコン要素の作成（ドラッグハンドルとして機能）
    const iconDiv = document.createElement("div");
    iconDiv.className = "drag-icon";
    iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 512 512"><path fill="#333" d="M278.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l9.4-9.4V224H109.3l9.4-9.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4l114.7.1v114.7l-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-9.4 9.4l.1-114.7h114.7l-9.4 9.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l9.4 9.4L288 224V109.3l9.4 9.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.に3l-64-64z"/></svg>`;

    // ドラッグハンドルのイベント
    iconDiv.addEventListener("mousedown", (e) => {
      // ドラッグ開始時に親要素（this）をdraggableに
      this.setAttribute("draggable", "true");

      // マウスアップ時にdraggable属性を削除
      const mouseUpHandler = () => {
        this.removeAttribute("draggable");
        document.removeEventListener("mouseup", mouseUpHandler);
      };
      document.addEventListener("mouseup", mouseUpHandler);
    });

    // テキスト入力要素の作成
    const textInput = document.createElement("div");
    textInput.className = "text-input";
    textInput.contentEditable = "true";
    textInput.setAttribute("placeholder", "プロンプトを入力");
    textInput.textContent = this._text;

    // factor入力要素の作成（初期状態では非表示）
    const factorInput = document.createElement("div");
    factorInput.className = "factor-input";
    factorInput.contentEditable = "true";
    factorInput.setAttribute("placeholder", "1");

    // 要素を追加
    container.appendChild(iconDiv);
    container.appendChild(textInput);
    container.appendChild(factorInput);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);

    // イベントリスナーの設定
    // ドラッグ開始イベント
    this.addEventListener("dragstart", (e) => {
      e.stopPropagation();
      // ドラッグ中の見た目を調整
      setTimeout(() => {
        container.style.opacity = "0.4";
      }, 0);

      // ドラッグ中のデータを設定
      e.dataTransfer.effectAllowed = "move";

      // 親要素にドラッグ中の要素を通知
      if (this.parent) {
        this.parent._draggedElement = this;
      }
    });

    // ドラッグ終了イベント
    this.addEventListener("dragend", (e) => {
      e.stopPropagation();
      container.style.opacity = "";
      this.removeAttribute("draggable");

      // 親要素のドラッグ中要素をクリア
      if (this.parent) {
        this.parent._draggedElement = null;
      }
    });

    // ドラッグオーバーイベント
    this.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const parent = this.parent;
      if (
        !parent ||
        !parent._draggedElement ||
        parent._draggedElement === this
      ) {
        return;
      }

      // マウス位置を取得
      const rect = this.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;

      // 左半分か右半分かによってスタイルを変更
      if (e.clientX < midX) {
        this.style.borderLeft = "3px solid blue";
        this.style.borderRight = "";
      } else {
        this.style.borderLeft = "";
        this.style.borderRight = "3px solid blue";
      }
    });

    // ドラッグリーブイベント
    this.addEventListener("dragleave", (e) => {
      this.style.borderLeft = "";
      this.style.borderRight = "";
    });

    // ドロップイベント
    this.addEventListener("drop", (e) => {
      e.preventDefault();
      this.style.borderLeft = "";
      this.style.borderRight = "";

      const parent = this.parent;
      if (
        !parent ||
        !parent._draggedElement ||
        parent._draggedElement === this
      ) {
        return;
      }

      // マウス位置を取得
      const rect = this.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;

      // 左半分か右半分かによって挿入位置を決定
      if (e.clientX < midX) {
        // 左半分：このTextの前に挿入
        parent.insertBefore(parent._draggedElement, this);
      } else {
        // 右半分：このTextの後に挿入
        parent.insertAfter(parent._draggedElement, this);
      }

      // 変更イベントを発火
      parent.dispatchEvent(new CustomEvent("change"));
    });

    // 左クリック: 無効時に有効化
    container.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._enabled) {
        this.enabled = true;
        this.dispatchEvent(
          new CustomEvent("change", {
            detail: { property: "enabled", value: this.enabled },
          })
        );
      }
    });

    // 右クリック: 有効時に無効化、無効時に削除
    container.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      if (this._enabled) {
        // 有効 → 無効
        this.enabled = false;
        this.dispatchEvent(
          new CustomEvent("change", {
            detail: { property: "enabled", value: this.enabled },
          })
        );
      } else {
        // 無効 → 削除
        this.dispatchEvent(new CustomEvent("delete"));
      }
    });

    // テキスト入力
    textInput.addEventListener("input", (e) => {
      this._text = e.target.textContent;
      this.setAttribute("text", this._text);
      this.updateStyles(); // スタイルだけ更新

      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { property: "text", value: this._text },
        })
      );
    });
    textInput.addEventListener("blur", () => {
      if (this.text.trim().length === 0) this.remove();
    });

    // factor入力
    factorInput.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "enter") {
        e.preventDefault();
        factorInput.blur();
      }
    });
    factorInput.addEventListener("input", (e) => {
      const value = parseFloat(e.target.textContent);
      this.factor = Number(value);

      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { property: "factor", value: this._factor },
        })
      );
    });
  }

  // スタイルと属性の更新（DOMを再作成せずに更新）
  updateStyles() {
    if (!this.shadowRoot.querySelector(".container")) return;

    const isNegative = this.isNegative();
    const style = this.shadowRoot.querySelector("style");
    const textInput = this.shadowRoot.querySelector(".text-input");

    // スタイルの更新
    style.textContent = `
      :host {
          display: inline-block;
          width: auto;
          font-family: sans-serif;
      }
      
      .container {
          display: flex;
          align-items: center;
          width: auto;
          padding: 4px;
          border: 1px solid #333;
          border-radius: 4px;
          background-color: ${isNegative ? "#3a273a" : "#1a3a1a"};
          color: #ddd;
          opacity: ${this._enabled ? "1" : "0.5"};
          cursor: pointer;
          user-select: none;
      }
      
      .drag-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 4px;
          padding: 2px;
          cursor: move;
      }
      
      .drag-icon svg {
          display: block;
      }
      
      .drag-icon svg path {
          fill: #ddd;
      }
      
      .text-input {
          flex: 1;
          min-width: 50px;
          padding: 2px;
          border-radius: 4px;
          border: none;
          border-bottom: 1px solid #555;
          outline: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-decoration: ${!this._enabled ? "line-through" : ""};
          background-color: transparent;
          color: #ddd;
      }
      
      .text-input:focus {
          border-bottom: 1px solid #888;
          background-color: #1c2333;
      }
      
      .text-input:empty:before {
          content: attr(placeholder);
          color: #777;
      }
      
      .factor-input {
          border-radius: 4px;
          outline: none;
          text-align: center;
          font-size: 0.9em;
          color: #ddd;
          background-color: transparent;
      }

      .factor-input:before {
        content: ":";
      }
      
      .factor-input:focus {
          background-color: #1c2333;
      }
      
      .factor-input:empty:before {
          content: ":" attr(placeholder);
          color: #777;
      }
    `;

    // 値の更新（フォーカスを失わないように直接値を設定）
    if (textInput.textContent !== this._text) {
      textInput.textContent = this._text;
    }

    // factorの更新
    const factorInput = this.shadowRoot.querySelector(".factor-input");
    if (factorInput && this.factor !== null) {
      factorInput.textContent = this.factor.toFixed(2);
    }
  }

  // UIの描画（属性変更時に呼ばれる）
  render() {
    // 初期DOMがまだ作成されていない場合は作成
    if (!this.shadowRoot.querySelector(".container")) {
      this.createInitialDOM();
    } else {
      // すでに作成済みの場合はスタイルだけ更新
      this.updateStyles();
    }
  }

  // 現在の状態をオブジェクトとして取得
  getData() {
    return {
      enabled: this.enabled,
      text: this.text,
      factor: this.factor,
    };
  }

  // オブジェクトから状態を設定
  setData(data) {
    if (data.enabled !== undefined) this.enabled = data.enabled;
    if (data.text !== undefined) this.text = data.text;
    if (data.factor !== undefined) this.factor = data.factor;
  }
  toObject() {
    return {
      enabled: this.enabled,
      text: this.text,
      factor: this.factor,
      isNegative: this.isNegative(),
      toPrompt(option) {
        const prompt = {
          positive: [],
          negative: [],
        };
        if (!this.enabled) return prompt;
        let text = this.text;
        if (this.text.length === 0) return prompt;
        let factor = this.factor;
        if (!this.factor) factor = option.factor;
        if (factor === 1) factor = null;
        if (factor) text = `(${text}:${factor})`;
        if (this.isNegative) prompt.negative.push(text);
        else prompt.positive.push(text);
        return prompt;
      },
    };
  }

  fromObject(obj) {
    if (typeof obj.enabled === "boolean") this.enabled = obj.enabled;
    if (typeof obj.text === "string") this.text = obj.text;
    if (typeof obj.factor === "number") this.factor = obj.factor;
    if (obj.isNegative === true) this.text = `${NEGATIVE_PREFIX}${this.text}`;
    this.render();
    return this;
  }
}

// Textsコンポーネントの実装（複数のTextをまとめる）
class PromptKunTexts extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // ドラッグ中の要素
    this._draggedElement = null;

    this.render();
  }

  // 要素を指定した要素の前に挿入
  insertBefore(element, referenceElement) {
    const container = this.shadowRoot.querySelector(".texts-container");
    container.insertBefore(element, referenceElement);
  }

  // 要素を指定した要素の後に挿入
  insertAfter(element, referenceElement) {
    const container = this.shadowRoot.querySelector(".texts-container");
    if (referenceElement.nextSibling) {
      container.insertBefore(element, referenceElement.nextSibling);
    } else {
      container.appendChild(element);
    }
  }

  // 初期描画
  connectedCallback() {
    if (!this.shadowRoot.querySelector(".container")) {
      this.render();
    }
  }

  // UIの描画
  render() {
    // スタイル
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        font-family: sans-serif;
      }
      
      .container {
        display: flex;
        flex-direction: row;
        row-gap: 4px;
        width: 100%;
      }
      
      .texts-container {
        display: flex;
        flex-grow: 1;
        flex-direction: row;
        gap: 4px;
        flex-wrap: wrap;
        box-sizing: border-box;
        width: 100%;
        min-height: 36px;
      }
    `;

    // コンテナ
    const container = document.createElement("div");
    container.className = "container";

    // テキスト要素を格納するコンテナ
    const textsContainer = document.createElement("div");
    textsContainer.className = "texts-container";

    textsContainer.addEventListener("click", () => this._addText());

    // コンテナに追加
    container.appendChild(textsContainer);

    // Shadow DOMに追加
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }

  // テキスト要素の追加
  _addText(text = "") {
    const element = document.createElement("prompt-kun-text");
    element.enabled = true;
    element.parent = this;
    const input = element.shadowRoot.querySelector(".text-input");

    // イベントリスナー
    element.addEventListener("change", (e) => {
      this.dispatchEvent(new CustomEvent("change"));
      logger.log(`変更: ${e.detail.property} = ${e.detail.value}`);
    });

    element.addEventListener("delete", () => {
      element.remove();
      this.dispatchEvent(new CustomEvent("change"));
      logger.log("テキスト削除");
    });
    input.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case "backspace": {
          if (input.textContent.length > 0) break;
          const prev = element.previousSibling;
          element.remove();
          if (prev) prev.shadowRoot.querySelector(".text-input")?.focus();
          break;
        }
        case "enter": {
          e.preventDefault();
          input.blur();
          if (input.textContent.trim().length === 0) element.remove();
          else this._addText();
          break;
        }
        case "escape": {
          input.blur();
          if (input.textContent.trim().length === 0) element.remove();
          break;
        }
      }
    });

    // コンテナに追加
    const container = this.shadowRoot.querySelector(".texts-container");
    container.appendChild(element);

    this.dispatchEvent(new CustomEvent("change"));

    if (text) element.text = text;
    else input.focus();

    return element;
  }

  // 全てのテキスト要素を取得
  getAllTexts() {
    return Array.from(this.shadowRoot.querySelectorAll("prompt-kun-text"));
  }

  toObject() {
    return {
      texts: this.getAllTexts().map((t) => t.toObject()),
      toPrompt(option) {
        return this.texts
          .map((t) => t.toPrompt(option))
          .reduce(
            (acc, cur) => {
              acc.positive.push(...cur.positive);
              acc.negative.push(...cur.negative);
              return acc;
            },
            { positive: [], negative: [] }
          );
      },
    };
  }

  // 初期テキストの追加
  addInitialTexts(texts = []) {
    texts.forEach((t) => this._addText(t));
  }

  fromObject(obj) {
    if (obj.texts && Array.isArray(obj.texts)) {
      // 既存のテキストをクリア
      this.getAllTexts().forEach((text) => text.remove());
      // 新しいテキストを追加
      obj.texts.forEach((textObj) => {
        const text = this._addText();
        text.fromObject(textObj);
      });
    }
    return this;
  }
}

// Groupコンポーネントの実装
class PromptKunGroup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // 初期状態の設定
    this._enabled = true;
    this._name = "Group";
    this._factor = null; // factorの初期値はnull（表示しない）
    this._draggedElement = null;
    this._isOpen = true; // アコーディオンの初期状態は開いている

    this.render();
  }

  // 属性が変更された時に呼ばれるコールバック
  static get observedAttributes() {
    return ["enabled", "name", "factor"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "enabled":
        this._enabled = newValue !== "false";
        break;
      case "name":
        this._name = newValue || "Group";
        break;
    }

    this.render();
  }

  // ゲッターとセッター
  get enabled() {
    return this._enabled;
  }

  set enabled(value) {
    this._enabled = Boolean(value);
    this.setAttribute("enabled", this._enabled.toString());
  }

  get name() {
    return this._name.trim().replace(new RegExp("^" + NEGATIVE_PREFIX), "");
  }

  set name(value) {
    this._name = value || "Group";
    this.setAttribute("name", this._name);
  }

  get parent() {
    return this._parent;
  }

  set parent(parent) {
    this._parent = parent;
  }

  get factor() {
    return this._factor;
  }

  set factor(val) {
    if (isNaN(val)) this._factor = null;
    else if (val < 0) this._factor = 0;
    else {
      const rounded = String(Math.round(val * 100));
      this._factor = Number(
        `${rounded.slice(0, rounded.length - 2) || "0"}.${(
          "00" + rounded
        ).slice(-2)}`
      );
    }
  }

  // 要素を指定した要素の前に挿入
  insertBefore(element, referenceElement) {
    const container = this.shadowRoot.querySelector(".groups-container");
    container.insertBefore(element, referenceElement);
  }

  // 要素を指定した要素の後に挿入
  insertAfter(element, referenceElement) {
    const container = this.shadowRoot.querySelector(".groups-container");
    if (referenceElement.nextSibling) {
      container.insertBefore(element, referenceElement.nextSibling);
    } else {
      container.appendChild(element);
    }
  }

  // 初回描画
  connectedCallback() {
    if (!this.shadowRoot.querySelector(".container")) {
      this.createInitialDOM();
    }
    this.updateStyles();
  }

  // 初期DOMの作成（一度だけ実行）
  createInitialDOM() {
    const style = document.createElement("style");
    const container = document.createElement("div");
    container.className = "container";

    // ヘッダー部分
    const header = document.createElement("div");
    header.className = "group-header";

    // アイコン要素の作成（ドラッグハンドルとして機能）
    const iconDiv = document.createElement("div");
    iconDiv.className = "drag-icon";
    iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 512 512"><path fill="#333" d="M278.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l9.4-9.4V224H109.3l9.4-9.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4l114.7.1v114.7l-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-9.4 9.4l.1-114.7h114.7l-9.4 9.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l9.4 9.4L288 224V109.3l9.4 9.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-64-64z"/></svg>`;

    // ドラッグハンドルのイベント
    iconDiv.addEventListener("mousedown", (e) => {
      // ドラッグ開始時に親要素（this）をdraggableに
      this.setAttribute("draggable", "true");

      // マウスアップ時にdraggable属性を削除
      const mouseUpHandler = () => {
        this.removeAttribute("draggable");
        document.removeEventListener("mouseup", mouseUpHandler);
      };
      document.addEventListener("mouseup", mouseUpHandler);
    });

    // グループ名入力要素
    const nameInput = document.createElement("div");
    nameInput.className = "name-input";
    nameInput.contentEditable = "true";
    nameInput.setAttribute("placeholder", "グループ名");
    nameInput.textContent = this._name;

    // factor入力要素の作成（初期状態では非表示）
    const factorInput = document.createElement("div");
    factorInput.className = "factor-input";
    factorInput.contentEditable = "true";
    factorInput.setAttribute("placeholder", "1");

    // ヘッダーに要素を追加
    header.appendChild(iconDiv);
    header.appendChild(nameInput);
    header.appendChild(factorInput);

    // コンテンツ部分
    const content = document.createElement("div");
    content.className = "group-content";

    // Textsコンテナ
    const textsContainer = document.createElement("div");
    textsContainer.className = "texts-container";

    // Textsコンポーネントを作成
    const texts = document.createElement("prompt-kun-texts");
    textsContainer.appendChild(texts);

    // Groupsコンテナ
    const groupsContainer = document.createElement("div");
    groupsContainer.className = "groups-container";

    // コンテンツに要素を追加
    content.appendChild(textsContainer);
    content.appendChild(groupsContainer);

    // グループ追加ボタン
    const addGroupBtn = document.createElement("button");
    addGroupBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
	<path fill="#f7efef" d="M6.5 1.75a.75.75 0 0 0-1.5 0V5H1.75a.75.75 0 0 0 0 1.5H5v3.25a.75.75 0 0 0 1.5 0V6.5h3.25a.75.75 0 0 0 0-1.5H6.5z" />
</svg>

    `;
    addGroupBtn.className = "add-group-btn";
    addGroupBtn.addEventListener("click", () => this._addGroup());

    // ヘッダーにボタンを追加
    header.appendChild(addGroupBtn);

    // コンテナに要素を追加
    container.appendChild(header);
    container.appendChild(content);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);

    // イベントリスナーの設定
    // ドラッグ開始イベント
    this.addEventListener("dragstart", (e) => {
      e.stopPropagation();
      // ドラッグ中の見た目を調整
      setTimeout(() => {
        container.style.opacity = "0.4";
      }, 0);

      // ドラッグ中のデータを設定
      e.dataTransfer.effectAllowed = "move";

      // 親要素にドラッグ中の要素を通知
      if (this.parent) {
        this.parent._draggedElement = this;
      }
    });

    // ドラッグ終了イベント
    this.addEventListener("dragend", (e) => {
      e.stopPropagation();
      container.style.opacity = "";
      this.removeAttribute("draggable");

      // 親要素のドラッグ中要素をクリア
      if (this.parent) {
        this.parent._draggedElement = null;
      }
    });

    // ドラッグオーバーイベント
    this.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const parent = this.parent;
      if (
        !parent ||
        !parent._draggedElement ||
        parent._draggedElement === this
      ) {
        return;
      }

      // マウス位置を取得
      const rect = this.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      // 左半分か右半分かによってスタイルを変更
      if (e.clientY < midY) {
        this.style.borderTop = "3px solid blue";
        this.style.borderBottom = "";
      } else {
        this.style.borderTop = "";
        this.style.borderBottom = "3px solid blue";
      }
    });

    // ドラッグリーブイベント
    this.addEventListener("dragleave", (e) => {
      this.style.borderTop = "";
      this.style.borderBottom = "";
    });

    // ドロップイベント
    this.addEventListener("drop", (e) => {
      e.preventDefault();
      this.style.borderTop = "";
      this.style.borderBottom = "";

      const parent = this.parent;
      if (
        !parent ||
        !parent._draggedElement ||
        parent._draggedElement === this
      ) {
        return;
      }

      // マウス位置を取得
      const rect = this.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      // 左半分か右半分かによって挿入位置を決定
      if (e.clientY < midY) {
        // 左半分：このGroupの前に挿入
        parent.insertBefore(parent._draggedElement, this);
      } else {
        // 右半分：このGroupの後に挿入
        parent.insertAfter(parent._draggedElement, this);
      }

      // 変更イベントを発火
      parent.dispatchEvent(new CustomEvent("change"));
    });

    // 左クリック: 無効時に有効化、有効時はアコーディオン開閉
    header.addEventListener("click", (e) => {
      // ボタンクリックの場合は処理しない（イベントバブリングを防止）
      if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
        return;
      }

      // 編集可能要素がフォーカスされている場合は処理しない
      if (e.target.isContentEditable) {
        return;
      }

      if (!this._enabled) {
        // 無効 → 有効
        this.enabled = true;
        this.dispatchEvent(
          new CustomEvent("change", {
            detail: { property: "enabled", value: this.enabled },
          })
        );
      } else {
        // アコーディオン開閉
        this._isOpen = !this._isOpen;
        if (this._isOpen)
          this.shadowRoot
            .querySelector(".group-header")
            .classList.remove("closed");
        else
          this.shadowRoot
            .querySelector(".group-header")
            .classList.add("closed");
        this.updateContentVisibility();
        logger.log(
          `グループ ${this._isOpen ? "展開" : "折りたたみ"}: ${this.name}`
        );
      }
    });

    // 右クリック: 有効時に無効化、無効時に削除
    header.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      if (this._enabled) {
        // 有効 → 無効
        this.enabled = false;
        this.dispatchEvent(
          new CustomEvent("change", {
            detail: { property: "enabled", value: this.enabled },
          })
        );
      } else {
        // 無効 → 削除
        this.dispatchEvent(new CustomEvent("delete"));
      }
    });

    // 名前入力
    nameInput.addEventListener("input", (e) => {
      this._name = e.target.textContent;
      this.setAttribute("name", this._name);
      this.updateStyles(); // スタイルだけ更新

      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { property: "name", value: this._name },
        })
      );
    });

    // factor入力
    factorInput.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "enter") {
        e.preventDefault();
        factorInput.blur();
      }
    });
    factorInput.addEventListener("input", (e) => {
      const value = parseFloat(e.target.textContent);
      this.factor = Number(value);

      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { property: "factor", value: this._factor },
        })
      );
    });

    // Textsの変更イベントを伝播
    texts.addEventListener("change", (e) => {
      this.dispatchEvent(new CustomEvent("change"));
    });
  }

  // グループ名がネガティブかどうかを判定
  isNegative() {
    return new RegExp(`^${NEGATIVE_PREFIX}`).test(this._name.trim());
  }

  // コンテンツの表示/非表示を切り替える
  updateContentVisibility() {
    const content = this.shadowRoot.querySelector(".group-content");
    if (content) {
      content.style.display = this._isOpen ? "block" : "none";
    }
  }

  // スタイルと属性の更新（DOMを再作成せずに更新）
  updateStyles() {
    if (!this.shadowRoot.querySelector(".container")) return;

    const isNegative = this.isNegative();
    const style = this.shadowRoot.querySelector("style");
    const nameInput = this.shadowRoot.querySelector(".name-input");
    const header = this.shadowRoot.querySelector(".group-header");

    // コンテンツの表示/非表示を更新
    this.updateContentVisibility();

    // ヘッダーの背景色を更新
    if (header) {
      header.style.backgroundColor = isNegative ? "#3a273a" : "#1c2333";
    }

    // スタイルの更新
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        font-family: sans-serif;
        margin-top: 4px;
        box-sizing: border-box;
        padding: 0 8px;
      }
      
      .container {
        display: flex;
        flex-direction: column;
        width: 100%;
        border: 1px solid #333;
        border-radius: 4px;
        background-color: #0B0F19;
        color: #ddd;
        opacity: ${this._enabled ? "1" : "0.5"};
      }
      
      .group-header {
        display: flex;
        align-items: center;
        padding: 4px;
        background-color: #1c2333;
        border-bottom: 1px solid #333;
        border-radius: 4px 4px 0 0;
        cursor: pointer;
        position: relative;
      }
      .group-header:not(.closed):before {
        content: "▼";
      }
      .group-header.closed:before {
        content: "▼";
        transform: rotate(-90deg);
      }
      
      .add-group-btn {
        position: absolute;
        right: 8px;
      }
      
      .drag-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 4px;
        padding: 2px;
        cursor: move;
      }
      
      .drag-icon svg {
        display: block;
      }
      
      .drag-icon svg path {
        fill: #ddd;
      }
      
      .name-input {
        min-width: 100px;
        padding: 4px;
        border-radius: 4px;
        border: none;
        border-bottom: 1px solid #555;
        outline: none;
        font-weight: bold;
        color: #ddd;
        background-color: transparent;
        text-decoration: ${!this._enabled ? "line-through" : ""}
      }
      
      .name-input:focus {
        border-bottom: 1px solid #888;
        background-color: #1c2333;
      }
      
      .name-input:empty:before {
        content: attr(placeholder);
        color: #777;
      }
      
      .factor-input {
        border-radius: 4px;
        outline: none;
        text-align: center;
        font-size: 0.9em;
        margin-left: 8px;
        color: #ddd;
        background-color: transparent;
      }

      .factor-input:before {
        content: ":";
      }
      
      .factor-input:focus {
        background-color: #1c2333;
      }
      
      .factor-input:empty:before {
        content: ":" attr(placeholder);
        color: #777;
      }
      
      .group-content {
        padding: 4px;
      }
      
      .groups-container {
        display: flex;
        flex-direction: column;
      }
      
      .controls {
        display: flex;
        gap: 4px;
        padding: 4px;
      }
      
      button {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        width: 32px;
        border: none;
        border-radius: 4px;
        background-color: #2a623a;
        color: white;
        cursor: pointer;
        font-size: 0.9em;
      }
      
      button:hover {
        background-color: #3a7a4a;
      }
    `;

    // 値の更新（フォーカスを失わないように直接値を設定）
    if (nameInput.textContent !== this._name) {
      nameInput.textContent = this._name;
    }

    // factorの更新
    const factorInput = this.shadowRoot.querySelector(".factor-input");
    if (factorInput && this.factor !== null) {
      factorInput.textContent = this.factor.toFixed(2);
      factorInput.style.display = "block";
    } else if (factorInput) {
      factorInput.style.display = "none";
    }
  }

  // UIの描画（属性変更時に呼ばれる）
  render() {
    // 初期DOMがまだ作成されていない場合は作成
    if (!this.shadowRoot.querySelector(".container")) {
      this.createInitialDOM();
    } else {
      // すでに作成済みの場合はスタイルだけ更新
      this.updateStyles();
    }
  }

  // グループ要素の追加
  _addGroup(name = "Group") {
    const element = document.createElement("prompt-kun-group");
    element.enabled = true;
    element.name = name;
    element.parent = this;

    // イベントリスナー
    element.addEventListener("change", (e) => {
      this.dispatchEvent(new CustomEvent("change"));
      if (e.detail) {
        logger.log(`グループ変更: ${e.detail.property} = ${e.detail.value}`);
      }
    });

    element.addEventListener("delete", () => {
      element.remove();
      this.dispatchEvent(new CustomEvent("change"));
      logger.log("グループ削除");
    });

    // コンテナに追加
    const container = this.shadowRoot.querySelector(".groups-container");
    container.appendChild(element);

    this.dispatchEvent(new CustomEvent("change"));
    logger.log(`グループ追加: ${name}`);
    element.shadowRoot.querySelector(".name-input").focus();
    return element;
  }

  // 全てのグループ要素を取得
  getAllGroups() {
    const container = this.shadowRoot.querySelector(".groups-container");
    return Array.from(container.querySelectorAll("prompt-kun-group"));
  }

  // Textsコンポーネントを取得
  getTexts() {
    const container = this.shadowRoot.querySelector("prompt-kun-texts");
    return container;
  }

  // 現在の状態をオブジェクトとして取得
  getData() {
    const textsData = this.getTexts()
      .getAllTexts()
      .map((text) => text.getData());
    const groupsData = this.getAllGroups().map((group) => group.getData());

    return {
      enabled: this.enabled,
      name: this.name,
      factor: this.factor,
      texts: textsData,
      groups: groupsData,
    };
  }

  // オブジェクトから状態を設定
  setData(data) {
    if (data.enabled !== undefined) this.enabled = data.enabled;
    if (data.name !== undefined) this.name = data.name;
    if (data.factor !== undefined) this.factor = data.factor;

    // Textsの設定
    if (data.texts && Array.isArray(data.texts)) {
      const texts = this.getTexts();
      // 既存のテキストをクリア
      texts.getAllTexts().forEach((text) => text.remove());
      // 新しいテキストを追加
      data.texts.forEach((textData) => {
        const text = texts._addText(textData.text);
        text.setData(textData);
      });
    }

    // グループの設定
    if (data.groups && Array.isArray(data.groups)) {
      // 既存のグループをクリア
      this.getAllGroups().forEach((group) => group.remove());
      // 新しいグループを追加
      data.groups.forEach((groupData) => {
        const group = this._addGroup(groupData.name);
        group.setData(groupData);
      });
    }
  }
  toObject() {
    return {
      name: this.name,
      enabled: this.enabled,
      texts: this.getTexts().toObject(),
      factor: this.factor,
      groups: this.getAllGroups().map((g) => g.toObject()),
      isNegative: this.isNegative(),
      toPrompt() {
        const prompt = {
          positive: [],
          negative: [],
        };
        if (!this.enabled) return prompt;
        const tp = this.texts.toPrompt({ factor: this.factor });
        prompt.positive.push(...tp.positive);
        prompt.negative.push(...tp.negative);
        this.groups.forEach((g) => {
          const { positive, negative } = g.toPrompt();
          prompt.positive.push(...positive);
          prompt.negative.push(...negative);
        });
        if (this.isNegative) {
          const buf = prompt.positive;
          prompt.positive = prompt.negative;
          prompt.negative = buf;
        }
        return prompt;
      },
    };
  }

  fromObject(obj) {
    if (typeof obj.enabled === "boolean") this.enabled = obj.enabled;
    if (typeof obj.name === "string") this.name = obj.name;
    if (typeof obj.factor === "number") this.factor = obj.factor;
    if (obj.isNegative === true) this.name = `${NEGATIVE_PREFIX}${this.name}`;
    this.render();

    // Textsの設定
    if (obj.texts) {
      const texts = this.getTexts();
      texts.fromObject(obj.texts);
    }

    // サブグループの設定
    if (obj.groups && Array.isArray(obj.groups)) {
      // 既存のグループをクリア
      this.getAllGroups().forEach((group) => group.remove());
      // 新しいグループを追加
      obj.groups.forEach((groupObj) => {
        const group = this._addGroup();
        group.fromObject(groupObj);
      });
    }
    return this;
  }
}

// PromptKunContainerコンポーネントの実装（Groupを束ねるだけのルートコンテナ）
class PromptKunContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // ドラッグ中の要素
    this._draggedElement = null;

    this.render();
  }

  // 要素を指定した要素の前に挿入
  insertBefore(element, referenceElement) {
    const container = this.shadowRoot.querySelector(".groups-container");
    container.insertBefore(element, referenceElement);
  }

  // 要素を指定した要素の後に挿入
  insertAfter(element, referenceElement) {
    const container = this.shadowRoot.querySelector(".groups-container");
    if (referenceElement.nextSibling) {
      container.insertBefore(element, referenceElement.nextSibling);
    } else {
      container.appendChild(element);
    }
  }

  // 初回描画
  connectedCallback() {
    if (!this.shadowRoot.querySelector(".container")) {
      this.render();
    }
  }

  // UIの描画
  render() {
    // スタイル
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        font-family: sans-serif;
      }
      
      .container {
        display: flex;
        flex-direction: column;
        width: 100%;
        background-color: transparent;
      }
      
      .groups-container {
        display: flex;
        flex-direction: column;
      }
      
      .controls {
        display: flex;
        justify-content: flex-end;
        margin-top: 4px;
        gap: 4px;
      }
      
      button {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        border: none;
        border-radius: 4px;
        background-color: #2a623a;
        color: white;
        cursor: pointer;
      }
      
      button:hover {
        background-color: #3a7a4a;
      }
    `;

    // コンテナ
    const container = document.createElement("div");
    container.className = "container";

    // グループ要素を格納するコンテナ
    const groupsContainer = document.createElement("div");
    groupsContainer.className = "groups-container";

    // 操作ボタンを格納するコンテナ
    const controls = document.createElement("div");
    controls.className = "controls";

    // クリップボードにコピーするボタン
    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy to clipboard";
    copyButton.className = "button";
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(JSON.stringify(this.toObject()));
    });

    // クリップボードの内容を反映するボタン
    const pasteButton = document.createElement("button");
    pasteButton.textContent = "Read from file";
    pasteButton.className = "button";
    pasteButton.addEventListener("click", () => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target.result;
            this.fromObject(JSON.parse(content));
          };
          reader.readAsText(file);
        }
      });
      inp.click();
    });

    // グループ追加ボタン
    const addGroupBtn = document.createElement("button");
    addGroupBtn.style = "width: 32px;";
    addGroupBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
	<path fill="#f7efef" d="M6.5 1.75a.75.75 0 0 0-1.5 0V5H1.75a.75.75 0 0 0 0 1.5H5v3.25a.75.75 0 0 0 1.5 0V6.5h3.25a.75.75 0 0 0 0-1.5H6.5z" />
</svg>
    `;
    addGroupBtn.addEventListener("click", () => this._addGroup());

    // ボタンを追加
    controls.appendChild(copyButton);
    controls.appendChild(pasteButton);
    controls.appendChild(addGroupBtn);

    // コンテナに追加
    container.appendChild(controls);
    container.appendChild(groupsContainer);

    // Shadow DOMに追加
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }

  // グループ要素の追加
  _addGroup(name = "Group") {
    const element = document.createElement("prompt-kun-group");
    element.enabled = true;
    element.name = name;
    element.parent = this;

    // イベントリスナー
    element.addEventListener("change", (e) => {
      this.dispatchEvent(new CustomEvent("change"));
      if (e.detail) {
        logger.log(`グループ変更: ${e.detail.property} = ${e.detail.value}`);
      }
    });

    element.addEventListener("delete", () => {
      element.remove();
      this.dispatchEvent(new CustomEvent("change"));
      logger.log("グループ削除");
    });

    // コンテナに追加
    const container = this.shadowRoot.querySelector(".groups-container");
    container.appendChild(element);

    this.dispatchEvent(new CustomEvent("change"));
    logger.log(`グループ追加: ${name}`);

    return element;
  }

  // 全てのグループ要素を取得
  getAllGroups() {
    const container = this.shadowRoot.querySelector(".groups-container");
    return Array.from(container.querySelectorAll("prompt-kun-group"));
  }

  // 現在の状態をオブジェクトとして取得
  getData() {
    const groupsData = this.getAllGroups().map((group) => group.getData());

    return {
      groups: groupsData,
    };
  }

  // オブジェクトから状態を設定
  setData(data) {
    // グループの設定
    if (data.groups && Array.isArray(data.groups)) {
      // 既存のグループをクリア
      this.getAllGroups().forEach((group) => group.remove());
      // 新しいグループを追加
      data.groups.forEach((groupData) => {
        const group = this._addGroup(groupData.name);
        group.setData(groupData);
      });
    }
  }

  toObject() {
    return {
      groups: this.getAllGroups().map((g) => g.toObject()),
      toPrompt() {
        return this.groups.reduce(
          (acc, cur) => {
            const { positive, negative } = cur.toPrompt();
            acc.positive.push(...positive);
            acc.negative.push(...negative);
            return acc;
          },
          { positive: [], negative: [] }
        );
      },
    };
  }

  fromObject(obj) {
    if (obj === null || typeof obj !== "object") return this;
    // グループの設定
    if (obj.groups && Array.isArray(obj.groups)) {
      // 既存のグループをクリア
      this.getAllGroups().forEach((group) => group.remove());
      // 新しいグループを追加
      (obj.groups || []).forEach((groupObj) => {
        const group = this._addGroup();
        group.fromObject(groupObj);
      });
    }

    return this;
  }
}

// カスタム要素の登録
customElements.define("prompt-kun-text", PromptKunText);
customElements.define("prompt-kun-texts", PromptKunTexts);
customElements.define("prompt-kun-group", PromptKunGroup);
customElements.define("prompt-kun-container", PromptKunContainer);

// 初期化関数
const PROMPT_STORAGE_KEY = "prompt-kun-latest-setting";
function initPromptKun(formRootId, logElementId = null) {
  const formRoot = document.getElementById(formRootId);
  if (!formRoot) return null;

  // ログ要素があれば設定
  if (logElementId) {
    const logElement = document.getElementById(logElementId);
    if (logElement) {
      logger.setLogElement(logElement);
    }
  }
  const container = document.createElement("prompt-kun-container");

  const setVal = (id, value) => {
    const element = gradioApp().querySelector(`#${id} textarea`);
    if (!element) return;
    element.value = value;
    let e = new Event("input", { bubbles: true });
    Object.defineProperty(e, "target", { value: element });
    element.dispatchEvent(e);
  };
  const onChange = () => {
    logger.log("コンテナが変更されました");
    const obj = container.toObject();
    const { positive, negative } = toEachPrompt(obj);
    try {
      localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(obj));
      setVal(
        "txt2img_prompt",
        positive.filter((a) => a.trim().length > 0).join(", ")
      );
      setVal(
        "txt2img_neg_prompt",
        negative.filter((a) => a.trim().length > 0).join(", ")
      );
    } catch (e) {
      console.error(e);
    }
  };
  // 変更イベントのリスナー
  container.addEventListener("change", onChange);
  container.fromObject(JSON.parse(localStorage.getItem(PROMPT_STORAGE_KEY)));

  // DOMに追加
  formRoot.appendChild(container);

  logger.log("プロンプト君初期化完了");
  return container;
}

// Stable Diffusion Web UI用の初期化
onUiLoaded(function () {
  const formRoot = document.getElementById(containerIds.form);
  if (!formRoot) return;

  // Gradioのコンポーネントを配置
  const toprow = document.getElementById("txt2img_toprow");
  const container = document.getElementById(containerIds.root);
  if (toprow && container) {
    toprow.parentNode.insertBefore(container, toprow.nextSibling);
  }

  // プロンプト君を初期化
  initPromptKun(containerIds.form, "log");
});
