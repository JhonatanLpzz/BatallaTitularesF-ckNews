import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  return createPortal(
    <DialogContext.Provider value={{ onOpenChange }}>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
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
        )}
      </AnimatePresence>
    </DialogContext.Provider>,
    document.body
  );
}

function DialogContent({
  className,
  children,
  onClose,
  animation = "bottom",
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
  animation?: "top" | "bottom";
}) {
  const context = React.useContext(DialogContext);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const [canScrollDown, setCanScrollDown] = React.useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    if (context) context.onOpenChange(false);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 5);
    setCanScrollDown(Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight - 5);
  };

  React.useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [children]);

  // Dynamic edge mask depending on scroll state
  let maskStyle = "none";
  if (canScrollUp && canScrollDown) {
    maskStyle = "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 24px), transparent 100%)";
  } else if (canScrollUp) {
    maskStyle = "linear-gradient(to bottom, transparent, black 24px, black 100%)";
  } else if (canScrollDown) {
    maskStyle = "linear-gradient(to bottom, black 0%, black calc(100% - 24px), transparent 100%)";
  }

  const variants = {
    top: {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 },
    },
    bottom: {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 },
    }
  };

  return (
    <motion.div
      variants={variants[animation]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={cn(
        "relative z-[10000] w-full max-w-lg glass-heavy border border-white/10 shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] sm:max-h-[85vh]",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 rounded-full p-2 bg-secondary text-muted-foreground opacity-70 transition-all hover:opacity-100 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-campaign-gold focus:ring-offset-2 focus:ring-offset-background z-10"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 no-scrollbar transition-[mask-image] duration-300"
        style={{
          maskImage: maskStyle,
          WebkitMaskImage: maskStyle
        }}
      >
        {children}
      </div>
    </motion.div>
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
