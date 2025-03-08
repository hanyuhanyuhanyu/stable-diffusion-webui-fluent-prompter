import type {
  TextData,
  GroupData,
  TextsData,
  ContainerData,
  Prompt,
} from "../types";
import { NEGATIVE_PREFIX } from "../constants";

/**
 * テキストがネガティブかどうかを判定する
 */
export function isTextNegative(text: string): boolean {
  return new RegExp(`^${NEGATIVE_PREFIX}`).test(text.trim());
}

/**
 * テキストデータからプロンプトを生成する
 */
export function textToPrompt(
  textData: TextData,
  defaultFactor?: number
): Prompt {
  const result: Prompt = { positive: [], negative: [] };
  if (!textData.enabled || textData.text.length === 0) return result;

  let text = textData.text;
  let factor = textData.factor;

  if (factor === null && defaultFactor !== undefined) factor = defaultFactor;
  if (factor === 1) factor = null;
  if (factor) text = `(${text}:${factor})`;

  if (textData.isNegative) {
    result.negative = [text];
  } else {
    result.positive = [text];
  }

  return result;
}

/**
 * テキストグループデータからプロンプトを生成する
 */
export function textsToPrompt(
  textsData: TextsData,
  defaultFactor?: number
): Prompt {
  return textsData.texts.reduce(
    (acc, textData) => {
      const prompt = textToPrompt(textData, defaultFactor);
      return {
        positive: [...acc.positive, ...prompt.positive],
        negative: [...acc.negative, ...prompt.negative],
      };
    },
    { positive: [], negative: [] } as Prompt
  );
}

/**
 * グループデータからプロンプトを生成する
 */
export function groupToPrompt(groupData: GroupData): Prompt {
  const prompt: Prompt = { positive: [], negative: [] };
  if (!groupData.enabled) return prompt;

  // テキストからプロンプトを生成
  const textsPrompt = textsToPrompt(
    groupData.texts,
    groupData.factor !== null ? groupData.factor : undefined
  );

  let positivePrompts = [...textsPrompt.positive];
  let negativePrompts = [...textsPrompt.negative];

  // サブグループからプロンプトを生成
  groupData.groups.forEach((subGroup) => {
    const subPrompt = groupToPrompt(subGroup);
    positivePrompts = [...positivePrompts, ...subPrompt.positive];
    negativePrompts = [...negativePrompts, ...subPrompt.negative];
  });

  prompt.positive = positivePrompts;
  prompt.negative = negativePrompts;

  // グループ全体がネガティブの場合、ポジティブとネガティブを入れ替える
  if (groupData.isNegative) {
    const temp = prompt.positive;
    prompt.positive = prompt.negative;
    prompt.negative = temp;
  }

  return prompt;
}

/**
 * コンテナデータからプロンプトを生成する
 */
export function containerToPrompt(containerData: ContainerData): Prompt {
  return containerData.groups.reduce(
    (acc, groupData) => {
      const prompt = groupToPrompt(groupData);
      return {
        positive: [...acc.positive, ...prompt.positive],
        negative: [...acc.negative, ...prompt.negative],
      };
    },
    { positive: [], negative: [] } as Prompt
  );
}

/**
 * プロンプトをStable Diffusion Web UIのテキストエリアに設定する
 */
export function setPromptToTextarea(prompt: Prompt): void {
  const setVal = (id: string, value: string) => {
    // グローバル関数gradioAppを使用
    // @ts-ignore - gradioAppはグローバルに定義されている
    const app = typeof gradioApp === "function" ? gradioApp() : document;
    const element = app.querySelector(`#${id} textarea`) as HTMLTextAreaElement;
    if (!element) return;
    element.value = value;
    const e = new Event("input", { bubbles: true });
    Object.defineProperty(e, "target", { value: element });
    element.dispatchEvent(e);
  };

  setVal(
    "txt2img_prompt",
    prompt.positive.filter((text) => text.trim().length > 0).join(", ")
  );

  setVal(
    "txt2img_neg_prompt",
    prompt.negative.filter((text) => text.trim().length > 0).join(", ")
  );
}
