import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{ onOpenChange: (open: boolean) => void } | null>(null);

function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-[9999]">
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => onOpenChange(false)} 
          aria-hidden="true"
        />
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>,
    document.body
  );
}

function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const context = React.useContext(DialogContext);
  
  const handleClose = () => {
    if (onClose) onClose();
    if (context) context.onOpenChange(false);
  };

  return (
    <div
      className={cn(
        "relative z-[10000] w-full max-w-lg rounded-xl border border-white/5 bg-background shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 pointer-events-auto flex flex-col max-h-[90vh] sm:max-h-[85vh]",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 rounded-full p-2 bg-white/5 text-muted-foreground opacity-70 transition-all hover:opacity-100 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-campaign-gold focus:ring-offset-2 focus:ring-offset-background z-10"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 no-scrollbar">
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
