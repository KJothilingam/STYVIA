import { useCallback, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import assistantService from '@/services/assistantService';
import authService from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; text: string; source?: string };

export function ShopAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: 'Hi — I can help with fit & Fit Studio, wardrobe, donations, nearby shops, or checkout. Sign in for full AI when your server has an OpenAI key configured.',
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const send = useCallback(async () => {
    const t = input.trim();
    if (!t || loading) return;
    if (!authService.isAuthenticated()) {
      toast({ title: 'Sign in to chat', description: 'The assistant uses your secure session.', variant: 'destructive' });
      return;
    }
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: t }]);
    setLoading(true);
    try {
      const r = await assistantService.chat(t);
      setMessages((m) => [...m, { role: 'assistant', text: r.reply, source: r.source }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Something went wrong. Try again, or browse /products and /donations.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }
  }, [input, loading, toast]);

  return (
    <>
      <Button
        type="button"
        size="icon"
        className={cn(
          'fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-2xl shadow-xl',
          'bg-gradient-to-br from-[hsl(var(--intelligence-deep))] to-rose-700 text-white',
          'ring-2 ring-white/30 hover:scale-[1.03] active:scale-[0.98] transition-transform',
        )}
        onClick={() => setOpen(true)}
        aria-label="Open style assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-[hsl(var(--intelligence-mid)/0.2)]">
          <SheetHeader className="px-4 pt-4 pb-2 border-b text-left space-y-1">
            <SheetTitle className="flex items-center gap-2 font-display-hero text-lg pr-8">
              <Sparkles className="h-5 w-5 text-[hsl(var(--intelligence-accent))]" aria-hidden />
              Style assistant
            </SheetTitle>
            <SheetDescription className="text-xs">
              Answers use Styvia rules + optional OpenAI on the server. Demo: set <code className="text-[10px]">OPENAI_API_KEY</code> in backend env.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-[50vh] px-4 py-3">
            <div className="space-y-3 pr-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-2xl px-3 py-2.5 text-sm leading-relaxed max-w-[95%]',
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'mr-auto bg-muted/80 text-foreground border border-border/50',
                  )}
                >
                  {m.text}
                  {m.source && m.role === 'assistant' && (
                    <p className="mt-1 text-[10px] uppercase tracking-wide opacity-60">Source: {m.source}</p>
                  )}
                </div>
              ))}
              {loading && <p className="text-xs text-muted-foreground animate-pulse">Thinking…</p>}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t flex gap-2 bg-background/95 backdrop-blur">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Find a shirt that fits me"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              disabled={loading}
            />
            <Button type="button" size="icon" onClick={send} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
