import { Attachment } from "../../types";

const MAX_FILE_SIZE = 2.5 * 1024 * 1024; // 2.5MB

/**
 * Process uploaded files and convert them to Attachment objects
 */
export const processFiles = async (files: File[]): Promise<Attachment[]> => {
  const results = await Promise.all(
    files.map((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" exceeds the 2.5MB limit.`);
        return null;
      }
      return new Promise<Attachment>((resolve) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          let type: Attachment["type"] = "document";

          if (file.type.startsWith("audio/")) type = "audio";
          else if (file.type.startsWith("video/")) type = "video";
          else if (file.type.startsWith("image/")) type = "image";

          const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          resolve({ id, name: file.name, type, url: base64, size: file.size });
        };

        reader.onerror = () =>
          resolve({
            id: `err-${Date.now()}`,
            name: file.name,
            type: "document",
            url: "",
          });

        reader.readAsDataURL(file);
      });
    }),
  );

  return results.filter(
    (r): r is Attachment => r !== null && !r.id.startsWith("err"),
  );
};
