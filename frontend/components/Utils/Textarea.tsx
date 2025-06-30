import React, { useRef, useEffect } from "react";

type AutoGrowTextareaProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  minRows?: number;
  maxHeight?: string;
  className?: string;
};

const AutoGrowTextarea: React.FC<AutoGrowTextareaProps> = ({
  value,
  placeholder = "",
  onChange,
  onBlur,
  minRows = 1,
  maxHeight = "12rem",
  className = "",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${(textareaRef.current.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = "auto";
        target.style.height = `${target.scrollHeight}px`;
      }}
      onFocus={(e) => (e.target.style.outline = "none")}
      onBlur={onBlur}
      className={`bg-transparent border-b-2 border-[#856D5E] text-black p-1 w-full resize-y overflow-hidden rounded-md text-sm ${className}`}
      style={{
        minHeight: `${minRows * 1.25}rem`,
        maxHeight,
      }}
    />
  );
};

export default AutoGrowTextarea;
