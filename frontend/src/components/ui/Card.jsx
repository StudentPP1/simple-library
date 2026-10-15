export default function Card({ title, subtitle, children, className = '', headerAction }) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
          <div>
            {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}