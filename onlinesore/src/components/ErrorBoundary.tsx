import React, { Component, ErrorInfo } from 'react';
import styled from '@emotion/styled';

const ErrorContainer = styled.div`
  padding: 20px;
  background: #ff5555;
  color: white;
`;

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
} 