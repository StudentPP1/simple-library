export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`p-4 mb-4 rounded-lg border text-sm font-medium flex justify-between items-center ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-70 hover:opacity-100 ml-4">
          ✕
        </button>
      )}
    </div>
  );
}