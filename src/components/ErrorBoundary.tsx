import React from "react";

interface State { hasError: boolean }

class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) return <h2>로그인 컴포넌트에서 오류가 발생했습니다.</h2>;
    return this.props.children;
  }
}

export default ErrorBoundary;
