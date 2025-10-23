import React from 'react';

interface CallToastProps {
  callerName: any;
  onAnswer: () => void;
  onDecline: () => void;
}

const CallToast: React.FC<CallToastProps> = ({ callerName, onAnswer, onDecline }) => (
  <div className="flex flex-col space-y-3 p-2">
    <div className="text-sm font-medium">
      📞 Incoming call from {callerName}
    </div>
    <div className="flex space-x-2">
      <button
        onClick={onAnswer}
        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium"
      >
        Answer
      </button>
      <button
        onClick={onDecline}
        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium"
      >
        Decline
      </button>
    </div>
  </div>
);

export default CallToast;