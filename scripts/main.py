import modules.scripts as scripts
import gradio as gr

class TemplateScript(scripts.Script):
    def __init__(self):
        super().__init__()

    def title(self):
        return "Template Extension"

    def show(self, is_img2img):
        return scripts.AlwaysVisible

    def show_modal(self):
        return "Hello"

    def ui(self, is_img2img):
        if not is_img2img:
            with gr.Blocks():
                with gr.Row(elem_id="prompt-kun-container"):
                    with gr.Accordion("プロンプト君", open=False, elem_id="prompt-kun-accordion"):
                        with gr.Column():
                            gr.HTML('<div id="prompt-kun-form"></div>')
        return []

    def run(self, p, *args):
        return p 