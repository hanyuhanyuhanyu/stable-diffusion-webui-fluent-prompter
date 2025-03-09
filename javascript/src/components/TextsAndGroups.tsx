import { Text } from "./Text";
import { createRef, useCallback, useRef, useState } from "react";
import type { GroupData, TextData } from "../types";

interface TextAndGroupData {
  childs: (TextData | GroupData)[];
}
interface Props {
  initial?: TextAndGroupData;
}
function newText(): TextData {
  return {
    id: crypto.randomUUID(),
    __type: "text",
    enabled: true,
    text: "",
    factor: null,
    isNegative: false,
  };
}
export const TextsAndGroups: React.FC<Props> = ({ initial }: Props) => {
  // add group
  // on click add text for proper place
  const [data, setData] = useState<TextAndGroupData>(
    Object.assign(
      {
        childs: [],
      } satisfies TextAndGroupData,
      initial
    )
  );
  const childRefs = useRef<
    Record<string, React.RefObject<HTMLDivElement | null>>
  >({});
  const baseRef = useRef<HTMLDivElement>(null);
  const insert = useCallback(
    (index: number, child: TextData | GroupData) => {
      setData({
        childs: [
          ...data.childs.slice(0, index),
          child,
          ...data.childs.slice(index),
        ],
      });
    },
    [data]
  );

  const findIndex = useCallback(({ x, y }: { x: number; y: number }) => {
    const current = baseRef.current;
    if (!current) return -1;
    let index = 0;

    for (; index < current.childNodes.length; index++) {
      const n = current.childNodes.item(index);
      if (n instanceof HTMLElement) {
        const { left, right } = n.getBoundingClientRect();
        // left -> assume prev to this elem|1 -> same, 2 -> same, 1->assume next to this elem|right -> continue
        // const leftMostBound = (right + left * 3) / 4;
        const rightMostBound = (left + right * 2) / 3;
        if (x < rightMostBound) break;
      }
    }
    return index;
  }, []);
  const onClick = (e: React.MouseEvent) => {
    // get clicked place for child index
    const current = baseRef.current;
    if (!current) return;
    // add text to proper place
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    const index = findIndex({ x, y });
    if (index < 0) return;
    const id = crypto.randomUUID();

    childRefs.current[id] = createRef();
    insert(index, newText());
  };
  //mock
  const handleTextChange = (textData: TextData) => {
    setData({
      childs: data.childs.map((child) => {
        if (child.id === textData.id) return textData;
        return child;
      }),
    });
  };
  const handleAdd = useCallback(
    (id: string) => {
      const index = data.childs.findIndex((child) => child.id === id);
      if (index === -1) insert(0, newText());
      else insert(index + 1, newText());
    },
    [data]
  );
  const handleDelete = useCallback(
    (id: string) => {
      setData({
        childs: data.childs.filter((child) => child.id !== id),
      });
    },
    [data]
  );
  const onDragEnd = useCallback(
    (e: React.DragEvent<HTMLDivElement>, id: string) => {
      let index = findIndex({ x: e.clientX, y: e.clientY });
      if (index < 0) return;
      const originalIndex = data.childs.findIndex((child) => child.id === id);
      if (originalIndex === -1) return;
      const child = data.childs[originalIndex];
      const former = data.childs.slice(0, originalIndex);
      const latter = data.childs.slice(originalIndex + 1);
      const newChild = [...former, ...latter];
      if (index > 0 && index > originalIndex) {
        index--;
      }
      newChild.splice(index, 0, child);

      setData({
        childs: newChild,
      });
    },
    [data]
  );
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "12px",
    minHeight: "36px",
    width: "100%",
    boxSizing: "border-box",
    background: "lightgray",
  };

  return (
    <div ref={baseRef} style={containerStyle} onClick={onClick}>
      {data.childs.map((node, index) => {
        switch (node.__type) {
          case "text":
            return (
              <Text
                key={node.id || crypto.randomUUID()}
                ref={childRefs.current[node.id]}
                data-index={index}
                initial={node}
                onChange={handleTextChange}
                newInputRequest={handleAdd}
                removeRequested={handleDelete}
                onDragEnd={onDragEnd}
              />
            );
        }
      })}
    </div>
  );
};
