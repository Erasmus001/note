export const extractTextFromBlocks = (blocks: any[]): string => {
  if (!blocks || !Array.isArray(blocks)) return "";

  return blocks
    .map((block) => {
      switch (block.type) {
        case "header":
        case "paragraph":
        case "quote":
          return block.data.text || "";
        case "list":
        case "checklist":
          return (block.data.items || [])
            .map((item: any) => (typeof item === "string" ? item : item.text))
            .join(" ");
        case "table":
          return (block.data.content || [])
            .map((row: any[]) => row.join(" "))
            .join(" ");
        case "code":
          return block.data.code || "";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ");
};
