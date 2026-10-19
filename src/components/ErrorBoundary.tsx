import React from 'react';
import { t } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { captureException } from '../observability/diagnostics';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  resetKey?: string;
  fullScreen?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    captureException(error, 'ui', { boundary: this.props.resetKey || 'root' });
    console.error('Unhandled UI error:', error);
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      const lang = useAppStore.getState().lang;
      const wrapperClass = this.props.fullScreen === false
        ? 'min-h-[18rem] text-slate-100 flex items-center justify-center p-6'
        : 'min-h-[100dvh] bg-[#010204] text-slate-100 flex items-center justify-center p-6';

      return (
        <div className={wrapperClass}>
          <div className="max-w-sm rounded-xl border border-white/10 bg-slate-950/70 p-5 text-center">
            <h1 className="text-base font-semibold text-white">{t('error.title', lang)}</h1>
            <p className="mt-2 text-sm text-slate-400">
              {t('error.body', lang)}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 min-h-10 rounded-lg border border-indigo-400/30 px-4 text-sm font-semibold text-indigo-200"
            >
              {t('common.retry', lang)}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
