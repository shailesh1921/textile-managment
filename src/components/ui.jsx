import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm active:scale-[0.98]',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/95 shadow-sm active:scale-[0.98]',
    outline: 'border border-input bg-background hover:bg-[#F3F1F7]/40 hover:text-primary shadow-sm active:scale-[0.98]',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm active:scale-[0.98]',
    ghost: 'hover:bg-secondary hover:text-primary active:scale-[0.98]',
    link: 'text-primary underline-offset-4 hover:underline',
  };
  const sizes = {
    default: 'h-11 sm:h-9 min-h-[44px] sm:min-h-[36px] px-4 py-2 text-sm',
    xs: 'h-8 min-h-[32px] px-2.5 text-xs',
    sm: 'h-10 sm:h-8 min-h-[40px] sm:min-h-[32px] px-3 text-xs',
    lg: 'h-12 px-8 text-base min-h-[48px]',
    icon: 'h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px]',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-manipulation select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export const Input = React.forwardRef(({ className, type = 'text', label, icon, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-slate-700 tracking-wide">{label}</label>}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 sm:h-9 min-h-[44px] sm:min-h-[36px] w-full rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-9' : '',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    </div>
  );
});
Input.displayName = 'Input';

export const Select = React.forwardRef(({ className, label, options = [], ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-slate-700 tracking-wide">{label}</label>}
      <select
        className={cn(
          'flex h-11 sm:h-9 min-h-[44px] sm:min-h-[36px] w-full rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});
Select.displayName = 'Select';

export const Card = ({ className, children, title, headerActions, description, ...props }) => {
  return (
    <div className={cn('rounded-[10px] border border-slate-100 bg-white text-slate-900 shadow-sm overflow-hidden', className)} {...props}>
      {(title || description || headerActions) && (
        <div className="flex flex-col space-y-1.5 p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold leading-none tracking-tight text-base text-slate-900">{title}</h3>
            {headerActions && <div>{headerActions}</div>}
          </div>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
};

export const Table = ({ className, headers = [], rows, children, ...props }) => {
  return (
    <div className="relative w-full overflow-x-auto rounded-[10px] border border-slate-100 bg-white shadow-sm touch-pan-x">
      <table className={cn('w-full caption-bottom text-sm min-w-[600px]', className)} {...props}>
        <thead className="[&_tr]:border-b bg-[#F9F8FC]">
          <tr className="border-b border-slate-100 transition-colors">
            {headers.map((h, i) => (
              <th key={i} className="h-10 px-4 text-left align-middle font-bold text-slate-500 text-xs uppercase tracking-wider select-none">
                <div className="flex items-center gap-1">
                  <span>{h}</span>
                  {/* Small sort indicator triangles */}
                  <span className="flex flex-col text-[8px] leading-[6px] text-slate-400 font-normal">
                    <span>▲</span>
                    <span>▼</span>
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 [&_tr:last-child]:border-0">
          {rows ? (
            rows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-100 transition-colors hover:bg-slate-50/50 even:bg-slate-50/20">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-3.5 sm:p-4 align-middle text-xs text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow = ({ className, ...props }) => (
  <tr className={cn('border-b border-slate-100 transition-colors hover:bg-slate-50/50 even:bg-slate-50/20', className)} {...props} />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn('p-3.5 sm:p-4 align-middle text-xs text-slate-700', className)} {...props} />
);

export const Badge = ({ className, variant = 'default', status, children, ...props }) => {
  // Standardized Color System per Hard Constraint 2
  let statusClasses = 'bg-primary/10 text-primary border-primary/20';

  if (status) {
    const s = String(status).toUpperCase();
    if (['PENDING', 'SENT', 'WAITING', 'CONFIRMED'].includes(s)) {
      statusClasses = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    } else if (['IN_PROGRESS', 'IN_PROCESS', 'IN_PRODUCTION', 'LOADING', 'UNLOADING', 'PARTIALLY RETURNED', 'PARTIALLY_DISPATCHED'].includes(s)) {
      statusClasses = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    } else if (['COMPLETED', 'RETURNED', 'PASS', 'APPROVED'].includes(s)) {
      statusClasses = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    } else if (['QC_HOLD', 'FAIL', 'DELAYED', 'CANCELLED', 'REJECTED'].includes(s)) {
      statusClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors uppercase',
        statusClasses,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// Responsive Modal Wrapper (Mobile Bottom Sheet / Fullscreen)
export const Modal = ({ isOpen, onClose, title, description, children, className }) => {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className={cn('fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-5 sm:p-6 shadow-2xl duration-200 max-h-[92vh] overflow-y-auto rounded-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', className)}>
          <div className="flex flex-col space-y-1 text-left">
            <DialogPrimitive.Title className="text-base sm:text-lg font-bold leading-none tracking-tight">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="text-xs sm:text-sm text-muted-foreground">{description}</DialogPrimitive.Description>}
          </div>
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 opacity-70 transition-opacity hover:opacity-100 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
