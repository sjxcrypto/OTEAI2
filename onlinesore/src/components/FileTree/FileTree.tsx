import React from 'react';
import styled from '@emotion/styled';
import { FileNode } from '../../types';

const FileItem = styled.div`
  padding: 4px 8px;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

interface FileTreeProps {
  files: FileNode[];
  onSelect: (path: string) => void;
}

export const FileTreeComponent: React.FC<FileTreeProps> = ({ files, onSelect }) => {
  console.log('Rendering file tree with files:', files);
  return (
    <>
      {files.map((file) => (
        <FileItem
          key={file.id}
          onClick={() => onSelect(file.path)}
          role="treeitem"
        >
          {file.name}
        </FileItem>
      ))}
    </>
  );
}; 