import React from "react";

interface TypingIndicatorProps {
  typingPeers: Array<{ name: string; email: string }>;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingPeers,
}) => {
  if (typingPeers.length === 0) return null;

  const getTypingText = () => {
    if (typingPeers.length === 1) {
      return `${typingPeers[0].name} is typing...`;
    }
    if (typingPeers.length === 2) {
      return `${typingPeers[0].name} and ${typingPeers[1].name} are typing...`;
    }
    return `${typingPeers[0].name} and ${typingPeers.length - 1} others are typing...`;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border-t border-zinc-100">
      {/* Animated dots */}
      <div className="flex gap-0.5">
        <span
          className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-sm text-zinc-500 italic font-medium">{getTypingText()}</span>
    </div>
  );
};
