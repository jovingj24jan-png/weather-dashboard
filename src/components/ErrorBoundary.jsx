import { Component } from 'react';
import { ErrorState } from './ErrorState.jsx';
import { WeatherError, ERROR_MESSAGES } from '../services/http.js';

// Last line of defence: if a card throws while rendering unexpected data, show
// the normal error panel instead of unmounting the whole app. `resetKey`
// clears the error once new data arrives.
export default class ErrorBoundary extends Component {
  state = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { failed: false, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('[weather] render failed:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="area-error" style={{ gridColumn: '1 / -1' }}>
        <ErrorState
          error={new WeatherError('malformed', ERROR_MESSAGES.malformed)}
          onRetry={() => {
            this.setState({ failed: false });
            this.props.onRetry();
          }}
          onFocusSearch={this.props.onFocusSearch}
        />
      </div>
    );
  }
}
