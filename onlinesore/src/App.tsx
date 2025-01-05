import React from 'react';
import { Editor } from './components/Editor/Editor';
import styled from '@emotion/styled';

const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const App: React.FC = () => {
  return (
    <AppContainer>
      <Editor />
    </AppContainer>
  );
};

export default App; 