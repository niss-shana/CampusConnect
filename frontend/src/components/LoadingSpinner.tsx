import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-primary-600 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;