import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface PollData {
  question: string;
  options: string[];
}

interface CreatePollSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PollData) => void;
}

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;

export default function CreatePollSheet({ open, onOpenChange, onSubmit }: CreatePollSheetProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (i: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateOption = (i: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const handleSubmit = () => {
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < MIN_OPTIONS) return;
    onSubmit({ question: q, options: opts });
    setQuestion('');
    setOptions(['', '']);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Создать опрос</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">Вопрос</label>
            <Input
              placeholder="Введите вопрос"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">Варианты ответа</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Вариант ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(i)}
                    disabled={options.length <= MIN_OPTIONS}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {options.length < MAX_OPTIONS && (
              <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={addOption}>
                <Plus className="h-4 w-4" />
                Добавить вариант
              </Button>
            )}
          </div>
        </div>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!question.trim() || options.filter((o) => o.trim()).length < MIN_OPTIONS}
        >
          Создать опрос
        </Button>
      </SheetContent>
    </Sheet>
  );
}
