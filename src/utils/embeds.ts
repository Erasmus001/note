/**
 * Extract YouTube video ID from URL
 */
export const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

/**
 * Extract Tweet ID from Twitter/X URL
 */
export const getTweetId = (url: string): string | null => {
  const match = url.match(
    /^https?:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?\w+\/status(?:es)?\/(\d+)/,
  );
  return match ? match[1] : null;
};
