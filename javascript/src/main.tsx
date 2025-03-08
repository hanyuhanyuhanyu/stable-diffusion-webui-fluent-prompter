import { createRoot } from "react-dom/client";
const containerIds = {
  root: "prompt-kun-container",
  form: "prompt-kun-form",
};
function Extension() {
  return <p>hello!</p>;
}
onUiLoaded(() => {
  // Gradioのコンポーネントを配置
  const container = document.getElementById(containerIds.root);
  if (container) {
    createRoot(container).render(<Extension />);
  }
});
