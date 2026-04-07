type CodeBlockActionsProps = {
  content: string;
  filename: string;
  onCopy: (content: string) => Promise<void>;
  onExport: (filename: string, content: string) => void;
};

export function CodeBlockActions({ content, filename, onCopy, onExport }: CodeBlockActionsProps) {
  return (
    <div className="codeBlockShell">
      <div className="codeBlockActions">
        <button aria-label="Copiar contenido" className="iconButton inBlock" onClick={() => void onCopy(content)} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" className="iconSvg" viewBox="0 0 20 20">
            <rect x="7" y="4" width="9" height="11" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="7" width="9" height="9" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button aria-label="Descargar contenido" className="iconButton inBlock" onClick={() => onExport(filename, content)} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" className="iconSvg" viewBox="0 0 20 20">
            <path d="M10 3v8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7 8.5 10 11.5 13 8.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 14.5h11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <pre>{content}</pre>
    </div>
  );
}
