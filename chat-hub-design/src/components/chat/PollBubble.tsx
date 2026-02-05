import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ParsedPoll {
  question: string;
  options: { id: string; text: string; votes?: number }[];
}

function parsePollContent(content: string): ParsedPoll | null {
  try {
    const data = JSON.parse(content);
    if (data._type === 'poll' && data.question && Array.isArray(data.options)) {
      return {
        question: String(data.question),
        options: data.options.map((o: string | { id: string; text: string; votes?: number }, i: number) =>
          typeof o === 'string'
            ? { id: `opt-${i}`, text: o, votes: 0 }
            : { id: o.id || `opt-${i}`, text: o.text || '', votes: o.votes ?? 0 }
        ),
      };
    }
  } catch {
    // not JSON
  }
  return null;
}

interface PollBubbleProps {
  content: string;
  isOutgoing: boolean;
  formatTime: (date: Date) => string;
  timestamp: Date;
  renderStatus?: () => React.ReactNode;
}

export default function PollBubble({
  content,
  isOutgoing,
  formatTime,
  timestamp,
  renderStatus,
}: PollBubbleProps) {
  const poll = parsePollContent(content);
  if (!poll) {
    return (
      <div className="text-sm text-muted-foreground italic">[Опрос не распознан]</div>
    );
  }

  const totalVotes = poll.options.reduce((s, o) => s + (o.votes ?? 0), 0);

  return (
    <div
      className={cn(
        'min-w-[var(--message-bubble-min-w)] max-w-[var(--message-bubble-max-w)] rounded-bubble px-3 py-2 shadow-soft',
        isOutgoing
          ? 'rounded-bubble-outgoing bg-[hsl(var(--message-outgoing))] text-[hsl(var(--message-outgoing-foreground))]'
          : 'rounded-bubble-incoming bg-[hsl(var(--message-incoming))] text-[hsl(var(--message-incoming-foreground))]'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <p className="font-medium">{poll.question}</p>
      </div>
      <div className="space-y-1.5">
        {poll.options.map((opt) => {
          const pct = totalVotes > 0 ? ((opt.votes ?? 0) / totalVotes) * 100 : 0;
          return (
            <div key={opt.id} className="relative">
              <div
                className="absolute inset-0 bg-primary/20 rounded-lg transition-all"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between px-2 py-1.5 rounded-lg border border-border/50">
                <span className="text-sm truncate">{opt.text || '(пусто)'}</span>
                {(opt.votes ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {opt.votes} ({Math.round(pct)}%)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{formatTime(timestamp)}</span>
        {renderStatus?.()}
      </div>
    </div>
  );
}

export { parsePollContent };
