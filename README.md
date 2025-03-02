# Stable Diffusion WebUI Fluent Prompter -- Prompt Input Assistance

This extension **assists with prompt input** in txt2img (text-to-image generation) within Stable Diffusion WebUI Forge.

## Background

The conventional UI requires direct text input into positive and negative prompts, which presents several inconveniences:

- It is cumbersome to change some words and check variations with the same prompt.
- The structure of the prompt is difficult to understand, making modifications difficult.
- Specifying importance and escape processing are complicated.

To solve these problems, this extension provides the following functions:

- **Group prompts and name them**
- **Create hierarchical group structures**
- **Switch group opening/closing with a toggle**
- **Temporal Disabling**
- **Reorder groups/words**
- **Invert positive/negative by adding `n!` at the beginning of the group name**
  - `n!word` under the `n!group` will be inverted twice, resulting in a positive prompt
- **Provide a field to specify the importance of each word**
- **Save input information to localStorage and load it automatically**

## Example Usage

For example, if you want to generate a realistic lion and an illustration-style lion, you can invert the art style specification at once by simply changing the name of the `style` group to `n!style`. This greatly reduces the effort required to change prompts.

- Realistic Lion

  ![Realistic Lion Image](https://kagari-markdown.s3.ap-northeast-1.amazonaws.com/202503/lion-real.png)

- Illustration-style Lion

  ![Illustration-style Lion Image](https://kagari-markdown.s3.ap-northeast-1.amazonaws.com/202503/lion-manga.png)

## How to Use

Open the txt2img tab of WebUI and use the extension UI displayed at the bottom of the prompt input field.

- **Add Group:** Click the Add Group button and enter a group name
- **Add Word:** Click the Add Word button within a group and enter a word
- **Temporal Disabling:** Right click on groups/words. The clicked DOM remains, but removed from prompt
- **Re-Enable:** Left click on Disabled groups/words
- **Remove Group/Word:** Right click on disabled groups/words
- **Set Importance:** Enter a number in the importance input field next to the word
- **Positive/Negative Inversion:** Enter `n!` at the beginning of the group name
- **Change Order:** Drag and drop groups/words to change the order

## License

MIT
