import React from "react";
import { ChevronUp, ChevronDown, Minimize2, Maximize2, Move } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WidgetWrapperProps {
  id: string;
  title: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children: React.ReactNode;
  // Drag & drop support props
  draggable?: boolean;
  onHtmlDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onHtmlDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onHtmlDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onHtmlDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onHtmlDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDraggingCurrent?: boolean;
}

export function WidgetWrapper({
  id,
  title,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isCollapsed,
  onToggleCollapse,
  children,
  draggable,
  onHtmlDragStart,
  onHtmlDragOver,
  onHtmlDragLeave,
  onHtmlDrop,
  onHtmlDragEnd,
  isDraggingCurrent,
}: WidgetWrapperProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <motion.div
      layout
      draggable={draggable}
      onDragStart={onHtmlDragStart as any}
      onDragOver={(e) => {
        if (onHtmlDragOver) {
          onHtmlDragOver(e);
          setIsDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (onHtmlDragLeave) {
          onHtmlDragLeave(e);
        }
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        if (onHtmlDrop) {
          onHtmlDrop(e);
        }
        setIsDragOver(false);
      }}
      onDragEnd={onHtmlDragEnd as any}
      className={`relative flex flex-col w-full bg-white/5 border rounded-2xl overflow-hidden transition-all duration-300 ${
        isDraggingCurrent 
          ? "opacity-30 border-dashed border-royal-purple/60 bg-royal-purple/5 scale-95" 
          : isDragOver
          ? "border-emerald-400 bg-emerald-500/5 shadow-lg shadow-emerald-500/10 scale-[1.01]" 
          : "border-white/10 hover:border-white/20"
      }`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
    >
      {/* Widget Control Bar */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 bg-royal-purple/10 border-b border-white/5 text-xs text-lilac font-medium select-none group touch-none cursor-grab active:cursor-grabbing"
        title="Drag entire widget from bar/header to reorder"
      >
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity text-lavender animate-pulse" />
          <span className="font-semibold text-white/95 tracking-wide">{title}</span>
        </div>
        
        <div className="flex items-center gap-1.5 bg-[#0e0324]/60 px-1.5 py-0.5 rounded-lg border border-white/5 opacity-85 group-hover:opacity-100 transition-opacity">
          {/* Reordering Controls */}
          {onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={isFirst}
              className={`p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none`}
              title="Move Widget Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={isLast}
              className={`p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none`}
              title="Move Widget Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
          
          <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
          
          {/* Collapse/Minimize Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-[#c084fc] transition-colors"
            title={isCollapsed ? "Expand Widget" : "Collapse Widget"}
          >
            {isCollapsed ? (
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Widget Client Container */}
      <div className="relative">
        <AnimatePresence initial={false} mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-visible"
            >
              {/* If children has styled GlassCard directly, we override default styles slightly to look nested perfectly */}
              <div className="widget-content-override [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none [&>div]:rounded-none">
                {children}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onToggleCollapse}
              className="px-4 py-3 text-xs text-lavender/60 cursor-pointer hover:bg-white/[0.02] flex items-center justify-between"
            >
              <span className="italic font-mono">Widget minimized. Click to expand details...</span>
              <span className="text-[10px] text-royal-purple font-semibold bg-royal-purple/10 border border-royal-purple/20 px-2 py-0.5 rounded uppercase tracking-wider">
                Inactive Pane
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
