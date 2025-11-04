import React from 'react';

class SilkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Silk component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback to a simple colored background if Silk fails
      return (
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            background: this.props.color || '#10B981',
            opacity: 0.3,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }} 
        />
      );
    }

    return this.props.children;
  }
}

export default SilkErrorBoundary;

