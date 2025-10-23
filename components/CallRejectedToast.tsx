import React from 'react';

interface CallRejectedToastProps {
    rejectedBy?: string;
}

const CallRejectedToast: React.FC<CallRejectedToastProps> = ({ rejectedBy }) => {
    return (
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                    Call Declined
                </p>
                <p className="text-sm text-gray-500">
                    {rejectedBy ? `${rejectedBy} declined your call` : 'Your call was declined'}
                </p>
            </div>
        </div>
    );
};

export default CallRejectedToast;