import React from 'react';

class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("📈 Chart Component Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px dashed #ef4444',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>📊</div>
          <h4 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>Chart failed to load</h4>
          <p style={{ color: '#888', fontSize: '14px', maxWidth: '300px', margin: '0 0 15px 0' }}>
            {this.state.error?.message || "Internal rendering error"}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '8px 16px',
              background: '#ef444422',
              color: '#ef4444',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry Chart
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ChartErrorBoundary;
