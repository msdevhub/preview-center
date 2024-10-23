import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorToast from './ErrorToast';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('未捕获的错误:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <>
          {this.props.children}
          <ErrorToast error={this.state.error!} onClose={() => this.setState({ hasError: false, error: null })} />
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
