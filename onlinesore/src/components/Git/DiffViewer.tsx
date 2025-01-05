import React from 'react';
import styled from '@emotion/styled';

const DiffContainer = styled.div`
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  overflow: auto;
  padding: 8px;
`;

const DiffLine = styled.div<{ type: 'add' | 'remove' | 'context' }>`
  padding: 0 8px;
  white-space: pre;
  background: ${({ type }) => {
    switch (type) {
      case 'add':
        return 'rgba(80, 200, 80, 0.2)';
      case 'remove':
        return 'rgba(200, 80, 80, 0.2)';
      default:
        return 'transparent';
    }
  }};
`;

const DiffHeader = styled.div`
  padding: 8px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
  font-weight: bold;
`;

interface DiffViewerProps {
  diffs: {
    path: string;
    hunks: {
      oldStart: number;
      oldLines: number;
      newStart: number;
      newLines: number;
      lines: string[];
    }[];
  }[];
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffs }) => {
  return (
    <DiffContainer>
      {diffs.map((diff, diffIndex) => (
        <div key={diffIndex}>
          <DiffHeader>{diff.path}</DiffHeader>
          {diff.hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex}>
              {hunk.lines.map((line, lineIndex) => {
                const type = line.startsWith('+')
                  ? 'add'
                  : line.startsWith('-')
                  ? 'remove'
                  : 'context';
                return (
                  <DiffLine key={lineIndex} type={type}>
                    {line}
                  </DiffLine>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </DiffContainer>
  );
}; 