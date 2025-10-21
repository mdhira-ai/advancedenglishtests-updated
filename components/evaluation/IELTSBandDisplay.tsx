'use client';

interface IELTSBandDisplayProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function IELTSBandDisplay({ score, size = 'md', showLabel = true }: IELTSBandDisplayProps) {
  const getBandColor = (bandScore: number) => {
    if (bandScore >= 8.5) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (bandScore >= 7.5) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (bandScore >= 6.5) return 'bg-green-100 text-green-800 border-green-200';
    if (bandScore >= 5.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (bandScore >= 4.5) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getBandDescription = (bandScore: number) => {
    if (bandScore >= 8.5) return 'Expert';
    if (bandScore >= 7.5) return 'Very Good';
    if (bandScore >= 6.5) return 'Competent';
    if (bandScore >= 5.5) return 'Modest';
    if (bandScore >= 4.5) return 'Limited';
    return 'Extremely Limited';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm px-2 py-1';
      case 'lg':
        return 'text-lg px-4 py-2';
      default:
        return 'text-base px-3 py-1.5';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      <div className={`inline-flex items-center font-bold border rounded-full ${getBandColor(score)} ${getSizeClasses()}`}>
        {showLabel && <span className="mr-1">Band</span>}
        <span>{score.toFixed(1)}</span>
      </div>
      {size !== 'sm' && (
        <div className="text-xs text-gray-600 text-center">
          {getBandDescription(score)}
        </div>
      )}
    </div>
  );
}
