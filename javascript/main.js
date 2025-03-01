const containerIds = {
  root: "prompt-kun-container",
  form: "prompt-kun-form",
};

// 定数
const NEGATIVE_PREFIX = "n!"; // Negativeプロンプトの接頭辞
const UP_RIGHT_DOWN_LEFT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 512 512"><path fill="#333" d="M278.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l9.4-9.4V224H109.3l9.4-9.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4l114.7.1v114.7l-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-9.4 9.4l.1-114.7h114.7l-9.4 9.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l9.4 9.4L288 224V109.3l9.4 9.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-64-64z"/></svg>`;

// Textコンポーネントの実装
class PromptKunText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // 初期状態の設定
    this._enabled = true;
    this._text = "";

    this.render();
  }

  // 属性が変更された時に呼ばれるコールバック
  static get observedAttributes() {
    return ["enabled", "text"];
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

  // テキストがネガティブかどうかを判定
  isNegative() {
    return new RegExp(`^${NEGATIVE_PREFIX}`).test(this._text.trim());
  }

  // プロンプト生成用のテキストを取得（接頭辞を除去）
  getPromptText() {
    if (this.isNegative()) {
      return this._text.substring(NEGATIVE_PREFIX.length);
    }
    return this._text;
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
    iconDiv.innerHTML = UP_RIGHT_DOWN_LEFT_ICON_SVG;

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

    // 要素を追加
    container.appendChild(iconDiv);
    container.appendChild(textInput);

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
    });

    // ドラッグ終了イベント
    this.addEventListener("dragend", (e) => {
      container.style.opacity = "";
      this.removeAttribute("draggable");
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
          margin: 5px 0;
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
      }
      
      .text-input:focus {
          border-bottom: 1px solid #666;
          background-color: white;
      }
      
      .text-input:empty:before {
          content: attr(placeholder);
          color: #999;
      }
    `;

    // 値の更新（フォーカスを失わないように直接値を設定）
    if (textInput.textContent !== this._text) {
      textInput.textContent = this._text;
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
    };
  }

  // オブジェクトから状態を設定
  setData(data) {
    if (data.enabled !== undefined) this.enabled = data.enabled;
    if (data.text !== undefined) this.text = data.text;
  }
}

// カスタム要素の登録
customElements.define("prompt-kun-text", PromptKunText);

onUiLoaded(function () {
  const formRoot = document.getElementById(containerIds.form);
  if (!formRoot) return;

  // Gradioのコンポーネントを配置
  const toprow = document.getElementById("txt2img_toprow");
  const container = document.getElementById(containerIds.root);
  if (toprow && container) {
    toprow.parentNode.insertBefore(container, toprow.nextSibling);
  }

  // テスト用のTextコンポーネントを追加
  const testPositive = document.createElement("prompt-kun-text");
  testPositive.text = "サンプルプロンプト";
  testPositive.enabled = true;

  const testNegative = document.createElement("prompt-kun-text");
  testNegative.text = "n!サンプルネガティブプロンプト";
  testNegative.enabled = true;

  // イベントリスナーの設定
  [testPositive, testNegative].forEach((element) => {
    element.addEventListener("change", (e) => {
      console.log("Text changed:", e.detail);
    });

    element.addEventListener("delete", () => {
      element.remove();
      console.log("Text deleted");
    });
  });

  // 使用方法の説明
  const instructions = document.createElement("div");
  instructions.innerHTML = `
    <div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
      <h4 style="margin-top: 0;">使用方法</h4>
      <ul>
        <li>有効時に右クリック → 無効化</li>
        <li>無効時に左クリック → 有効化</li>
        <li>無効時に右クリック → 削除</li>
        <li>テキストの先頭に「${NEGATIVE_PREFIX}」を付けるとネガティブプロンプトになります</li>
      </ul>
    </div>
  `;

  // DOMに追加
  formRoot.appendChild(instructions);
  formRoot.appendChild(testPositive);
  formRoot.appendChild(testNegative);
});
