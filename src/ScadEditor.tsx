import React, { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import styles from './ScadEditor.module.css';

interface ScadEditorProps {
  onCodeChange: (code: string) => void;
  initialCode?: string;
}

export const ScadEditor: React.FC<ScadEditorProps> = ({ onCodeChange, initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      onCodeChange(value);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <MonacoEditor
        height="100%"
        defaultLanguage="scad"
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: true },
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />
    </div>
  );
};