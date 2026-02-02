import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Разбивает подпись на текст и хештеги; хештеги — кликабельные ссылки на поиск. */
const HASHTAG_REGEX = /#[\wа-яА-ЯёЁ]+/gi;

interface PostCaptionWithHashtagsProps {
  caption: string;
  className?: string;
  lineClamp?: 2 | 3 | 'none';
}

const PostCaptionWithHashtags = ({
  caption,
  className,
  lineClamp = 'none',
}: PostCaptionWithHashtagsProps) => {
  const navigate = useNavigate();

  const parts: { type: 'text' | 'hashtag'; value: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(HASHTAG_REGEX.source, 'gi');
  while ((match = re.exec(caption)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: caption.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'hashtag', value: match[0].slice(1) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < caption.length) {
    parts.push({ type: 'text', value: caption.slice(lastIndex) });
  }
  if (parts.length === 0 && caption) {
    parts.push({ type: 'text', value: caption });
  }

  return (
    <p
      className={cn(
        'text-sm text-foreground',
        lineClamp === 2 && 'line-clamp-2',
        lineClamp === 3 && 'line-clamp-3',
        className
      )}
    >
      {parts.map((part, i) =>
        part.type === 'hashtag' ? (
          <button
            key={i}
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() => navigate(`/feed/search?q=${encodeURIComponent(part.value)}`)}
          >
            #{part.value}
          </button>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </p>
  );
};

export default PostCaptionWithHashtags;
