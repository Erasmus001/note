import React, { useRef, useCallback, useLayoutEffect } from 'react';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

/**
 * A textarea component that automatically resizes based on content
 */
const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  disabled,
  placeholder,
  className,
  minHeight = '1.5em'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, []);

  useLayoutEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        adjustHeight();
        onChange(e);
      }}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      style={{ minHeight }}
      rows={1}
    />
  );
};

export default AutoResizeTextarea;
