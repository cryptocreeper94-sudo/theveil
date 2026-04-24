import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    require: {
      config: (config: { paths: Record<string, string> }) => void;
      (deps: string[], callback: (...args: any[]) => void): void;
    };
    monaco: any;
  }
}

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;
  className?: string;
  'data-testid'?: string;
}

function getMonacoLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    'javascript': 'javascript',
    'typescript': 'typescript',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'markdown': 'markdown',
    'python': 'python',
    'rust': 'rust',
    'go': 'go',
    'plaintext': 'plaintext',
  };
  return languageMap[lang] || 'plaintext';
}

export function MonacoEditor({ 
  value, 
  onChange, 
  language, 
  theme = 'vs-dark',
  className = '',
  'data-testid': testId
}: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const valueRef = useRef(value);
  const isUpdatingRef = useRef(false);

  valueRef.current = value;

  const initMonaco = useCallback(async () => {
    if (!containerRef.current) return;
    if (typeof (window as any).loadMonaco === 'function') {
      await (window as any).loadMonaco();
    }
    if (!window.require) return;

    window.require(['vs/editor/editor.main'], function(monaco: any) {
      if (editorRef.current) {
        editorRef.current.dispose();
      }

      const editor = monaco.editor.create(containerRef.current!, {
        value: valueRef.current,
        language: getMonacoLanguage(language),
        theme: theme,
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        padding: { top: 16, bottom: 16 },
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
      });

      editor.onDidChangeModelContent(() => {
        if (!isUpdatingRef.current) {
          const newValue = editor.getValue();
          onChange(newValue);
        }
      });

      editorRef.current = editor;
      window.monaco = monaco;
    });
  }, [language, theme, onChange]);

  useEffect(() => {
    const checkMonaco = setInterval(() => {
      if (typeof window.require === 'function') {
        clearInterval(checkMonaco);
        initMonaco();
      }
    }, 100);

    return () => {
      clearInterval(checkMonaco);
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [initMonaco]);

  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        isUpdatingRef.current = true;
        editorRef.current.setValue(value);
        isUpdatingRef.current = false;
      }
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current && window.monaco?.editor) {
      const model = editorRef.current.getModel();
      if (model) {
        window.monaco.editor.setModelLanguage(model, getMonacoLanguage(language));
      }
    }
  }, [language]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full ${className}`}
      data-testid={testId}
    />
  );
}
