const containerIds = {
  root: "prompt-kun-container",
  form: "prompt-kun-form",
};

// 定数
const NEGATIVE_PREFIX = "n!"; // Negativeプロンプトの接頭辞
// ログ機能
class Logger {
  constructor(logElement = null) {
    this._logElement = logElement;
  }

  // ログ要素の設定
  setLogElement(element) {
    this._logElement = element;
  }

  // ログの追加
  log(message) {
    // コンソールに出力

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
    return this._text;
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

  // プロンプト生成用のテキストを取得（接頭辞を除去）
  getPromptText() {
    let txt = "";
    if (this.isNegative()) txt = this._text.substring(NEGATIVE_PREFIX.length);
    else txt = this._text;
    if (!this.factor || this.factor === 1) return txt;
    const [int, rawDec] = String(this.factor).split(".");
    const dec = (rawDec || "00").slice(0, 2);
    const factor = `${int}.${dec}`;
    return `(${txt}:${factor})`;
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

    // ホイールイベントでfactorの表示/非表示を切り替え
    textInput.addEventListener("wheel", (e) => {
      e.preventDefault();

      if (this.factor === null) {
        // factorが未表示の場合は表示する
        this.factor = 1.0;
      }
      // factorが表示されている場合は値を増減する
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      this.factor = Math.max(0, this.factor + delta);

      this.render();

      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { property: "factor", value: this.factor },
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
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: ${isNegative ? "#ffcccc" : "#ccffcc"};
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
      
      .text-input {
          flex: 1;
          min-width: 50px;
          padding: 2px;
          border-radius: 4px;
          border: none;
          border-bottom: 1px solid #aaa;
          outline: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-decoration: ${!this._enabled ? "line-through" : ""}
      }
      
      .text-input:focus {
          border-bottom: 1px solid #666;
          background-color: white;
      }
      
      .text-input:empty:before {
          content: attr(placeholder);
          color: #999;
      }
      
      .factor-input {
          border-radius: 4px;
          outline: none;
          text-align: center;
          font-size: 0.9em;
      }

      .factor-input:before {
        content: ":";
      }
      
      .factor-input:focus {
          background-color: white;
      }
      
      .factor-input:empty:before {
          content: ":" attr(placeholder);
          color: #999;
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
      isNegative: !this.isNegative(),
    };
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
        flex-direction: column;
        row-gap: 4px;
        width: 100%;
      }
      
      .texts-container {
        display: flex;
        flex-direction: row;
        gap: 4px;
        flex-wrap: wrap;
        box-sizing: border-box;
        width: 100%;
        min-height: 36px;
      }
      
      
      .controls {
        display: flex;
        gap: 10px;
      }
      
      button {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        background-color: #4caf50;
        color: white;
        cursor: pointer;
      }
      
      button:hover {
        background-color: #45a049;
      }
      
    `;

    // コンテナ
    const container = document.createElement("div");
    container.className = "container";

    // テキスト要素を格納するコンテナ
    const textsContainer = document.createElement("div");
    textsContainer.className = "texts-container";

    // 操作ボタンを格納するコンテナ
    const controls = document.createElement("div");
    controls.className = "controls";

    // ポジティブテキスト追加ボタン
    const addPositiveBtn = document.createElement("button");
    addPositiveBtn.textContent = "add text";
    addPositiveBtn.addEventListener("click", () => this._addText());

    // ボタンを追加
    controls.appendChild(addPositiveBtn);

    // コンテナに追加
    container.appendChild(textsContainer);
    container.appendChild(controls);

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

  // プロンプト文字列の生成
  generatePrompt() {
    const texts = this.getAllTexts();
    const positivePrompts = [];
    const negativePrompts = [];

    texts.forEach((text) => {
      if (!text.enabled) return;

      if (text.isNegative()) {
        negativePrompts.push(text.getPromptText());
      } else {
        positivePrompts.push(text.getPromptText());
      }
    });

    return {
      positive: positivePrompts.join(", "),
      negative: negativePrompts.join(", "),
    };
  }
  toObject() {
    return {
      texts: this.getAllTexts().map((t) => t.toObject()),
    };
  }

  // 初期テキストの追加
  addInitialTexts(texts = []) {
    texts.forEach((t) => this._addText(t));
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
    addGroupBtn.textContent = "add group";
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

    // ホイールイベントでfactorの表示/非表示を切り替え
    header.addEventListener("wheel", (e) => {
      e.preventDefault();

      if (this.factor === null) {
        // factorが未表示の場合は表示する
        this.factor = 1.0;
      }
      // factorが表示されている場合は値を増減する
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      this.factor = Math.max(0, this.factor + delta);

      this.render();

      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { property: "factor", value: this.factor },
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
      header.style.backgroundColor = isNegative ? "#ffcccc" : "#e0e0e0";
    }

    // スタイルの更新
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
        border: 1px solid #ccc;
        border-radius: 4px;
        margin-bottom: 8px;
        background-color: #f9f9f9;
        opacity: ${this._enabled ? "1" : "0.5"};
      }
      
      .group-header {
        display: flex;
        align-items: center;
        padding: 8px;
        background-color: #e0e0e0;
        border-bottom: 1px solid #ccc;
        border-radius: 4px 4px 0 0;
        cursor: pointer;
        position: relative;
      }
      
      .add-group-btn {
        position: absolute;
        right: 8px;
      }
      
      .drag-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        padding: 2px;
        cursor: move;
      }
      
      .drag-icon svg {
        display: block;
      }
      
      .name-input {
        flex: 1;
        min-width: 100px;
        padding: 4px;
        border-radius: 4px;
        border: none;
        border-bottom: 1px solid #aaa;
        outline: none;
        font-weight: bold;
        text-decoration: ${!this._enabled ? "line-through" : ""}
      }
      
      .name-input:focus {
        border-bottom: 1px solid #666;
        background-color: white;
      }
      
      .name-input:empty:before {
        content: attr(placeholder);
        color: #999;
      }
      
      .factor-input {
        border-radius: 4px;
        outline: none;
        text-align: center;
        font-size: 0.9em;
        margin-left: 8px;
      }

      .factor-input:before {
        content: ":";
      }
      
      .factor-input:focus {
        background-color: white;
      }
      
      .factor-input:empty:before {
        content: ":" attr(placeholder);
        color: #999;
      }
      
      .group-content {
        padding: 8px;
      }
      
      .texts-container {
        margin-bottom: 8px;
      }
      
      .groups-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .controls {
        display: flex;
        gap: 8px;
        padding: 0 8px 8px;
      }
      
      button {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        background-color: #4caf50;
        color: white;
        cursor: pointer;
        font-size: 0.9em;
      }
      
      button:hover {
        background-color: #45a049;
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

  // プロンプト文字列の生成
  getPromptText() {
    if (!this._enabled) return "";

    let result = "";

    // Textsからプロンプトを取得
    const texts = this.getTexts();
    const textsPrompt = texts.generatePrompt();

    // グループがネガティブかどうかによって使用するプロンプトを選択
    const isNegative = this.isNegative();
    let textContent = isNegative ? textsPrompt.negative : textsPrompt.positive;

    // グループ内のすべてのグループからプロンプトを取得
    const groups = this.getAllGroups();
    const groupPrompts = groups
      .map((group) => group.getPromptText())
      .filter((text) => text.length > 0);

    // テキストとグループのプロンプトを結合
    if (textContent.length > 0 || groupPrompts.length > 0) {
      if (textContent.length > 0) {
        result = textContent;
      }

      if (groupPrompts.length > 0) {
        if (result.length > 0) {
          result += ", " + groupPrompts.join(", ");
        } else {
          result = groupPrompts.join(", ");
        }
      }

      // factorがある場合は適用
      if (this.factor !== null && this.factor !== 1) {
        const [int, rawDec] = String(this.factor).split(".");
        const dec = (rawDec || "00").slice(0, 2);
        const factor = `${int}.${dec}`;
        result = `(${result}:${factor})`;
      }
    }

    // グループ名からn!プレフィックスを削除
    if (isNegative) {
      const nameWithoutPrefix = this._name
        .trim()
        .substring(NEGATIVE_PREFIX.length);
      return nameWithoutPrefix.length > 0 ? result : result;
    }

    return result;
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
      groups: this.getAllGroups().map((g) => g.toObject()),
      isNegative: this.isNegative(),
    };
  }
}

// カスタム要素の登録
customElements.define("prompt-kun-text", PromptKunText);
customElements.define("prompt-kun-texts", PromptKunTexts);
customElements.define("prompt-kun-group", PromptKunGroup);

// 初期化関数
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

  // Textsコンポーネントを作成
  const texts = document.createElement("prompt-kun-texts");

  // 初期テキストを追加
  texts.addInitialTexts(["beautiful landscape", "n!simple background"]);

  // 変更イベントのリスナー
  texts.addEventListener("change", () => {
    const prompts = texts.generatePrompt();
    logger.log(
      `プロンプト生成: Positive="${prompts.positive}", Negative="${prompts.negative}"`
    );
  });

  // DOMに追加
  formRoot.appendChild(texts);

  logger.log("プロンプト君初期化完了");
  return texts;
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
