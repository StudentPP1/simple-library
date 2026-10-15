export default function Badge({ status, text }) {
  const statusStyles = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-200',
    Reserved: 'bg-amber-100 text-amber-800 border-amber-200',
    Active: 'bg-green-100 text-green-800 border-green-200',
    Issued: 'bg-green-100 text-green-800 border-green-200',
    Returned: 'bg-gray-100 text-gray-700 border-gray-200',
    Overdue: 'bg-red-100 text-red-800 border-red-200',
  };

  const defaultStyle = 'bg-blue-100 text-blue-800 border-blue-200';
  const appliedStyle = statusStyles[status] || defaultStyle;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${appliedStyle}`}>
      {text || status}
    </span>
  );
}