const containerIds = {
    root: 'prompt-kun-container',
    form: 'prompt-kun-form',
}
onUiLoaded(function() {
    const formRoot = document.getElementById(containerIds.form)
    if (!formRoot) return
    // Gradioのコンポーネントを配置
    const toprow = document.getElementById('txt2img_toprow');
    const container = document.getElementById(containerIds.root);
    if (toprow && container) {
        toprow.parentNode.insertBefore(container, toprow.nextSibling);
    }
})