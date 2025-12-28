interface SavePlanButtonProps {
  onSave: () => void;
  onAccept: () => void;
  isSaving: boolean;
  isAccepting: boolean;
  hasChanges: boolean;
  hasMeals: boolean;
}

export function SavePlanButton({ 
  onSave, 
  onAccept, 
  isSaving, 
  isAccepting, 
  hasChanges, 
  hasMeals 
}: SavePlanButtonProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onSave}
        disabled={!hasChanges || isSaving}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          isSaving
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : hasChanges
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isSaving ? 'Saving Draft...' : 'Save Draft'}
      </button>
      
      <button
        onClick={onAccept}
        disabled={!hasMeals || isAccepting}
        className={`px-6 py-2 rounded-md font-medium transition-colors ${
          isAccepting
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : hasMeals
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isAccepting ? 'Accepting...' : 'Accept Plan'}
      </button>
    </div>
  );
}
