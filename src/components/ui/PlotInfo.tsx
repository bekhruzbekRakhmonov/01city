'use client';

interface PlotInfoProps {
  username: string;
  description: string;
  creatorInfo?: string;
  onClose: () => void;
}

export function PlotInfo({ username, description, creatorInfo, onClose }: PlotInfoProps) {
  return (
    <div 
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-64 border border-gray-200 dark:border-gray-700"
      onClick={(e) => e.stopPropagation()} // Prevent click from propagating to parent
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{username}'s Plot</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{description}</p>
      
      {creatorInfo && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">{creatorInfo}</p>
        </div>
      )}
      
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button 
          className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          onClick={(e) => {
            e.stopPropagation();
            // This would navigate to the creator's profile in a real implementation
            console.log(`Visit ${username}'s profile`);
          }}
        >
          Visit Profile
        </button>
      </div>
    </div>
  );
}