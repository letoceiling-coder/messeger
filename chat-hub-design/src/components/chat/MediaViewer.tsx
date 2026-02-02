import { X, Download, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Media Viewer — spec: Fullscreen, Swipe, Zoom, Download / Share / Delete
 * Placeholder: fullscreen overlay with close and actions. Zoom/swipe can be added with gesture lib.
 */
interface MediaViewerProps {
  open: boolean;
  onClose: () => void;
  src?: string;
  type?: 'image' | 'video';
  onDownload?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

const MediaViewer = ({
  open,
  onClose,
  src,
  type = 'image',
  onDownload,
  onShare,
  onDelete,
}: MediaViewerProps) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-safe bg-gradient-to-b from-black/60 to-transparent">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button variant="ghost" size="icon" onClick={onDownload} className="text-white">
                <Download className="h-5 w-5" />
              </Button>
            )}
            {onShare && (
              <Button variant="ghost" size="icon" onClick={onShare} className="text-white">
                <Share2 className="h-5 w-5" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content — placeholder when no src */}
        <div className="flex-1 flex items-center justify-center p-4">
          {src ? (
            type === 'video' ? (
              <video src={src} controls className="max-w-full max-h-full object-contain" />
            ) : (
              <img src={src} alt="" className="max-w-full max-h-full object-contain" />
            )
          ) : (
            <p className="text-white/60 text-sm">Медиа не загружено</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaViewer;
