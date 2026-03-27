import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Send, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import assistantService from '@/services/assistantService';
import authService from '@/services/authService';
import { useStore } from '@/context/StoreContext';
import { cn } from '@/lib/utils';

const LOGIN_PATH = '/login';

const WELCOME_LOGGED_IN =
  "Hi — I'm your style assistant. Ask about fit & Fit Studio, your wardrobe, donations, nearby shops, or checkout.";

type Msg = { role: 'user' | 'assistant'; text: string; source?: string };

export function ShopAssistant() {
  const { isLoggedIn } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const onAuthPage = location.pathname === LOGIN_PATH;
  const visible = isLoggedIn && !onAuthPage;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', text: WELCOME_LOGGED_IN }]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) {
      setOpen(false);
    }
  }, [visible]);

  useEffect(() => {
    if (onAuthPage) {
      setOpen(false);
    }
  }, [onAuthPage]);

  useEffect(() => {
    if (!isLoggedIn) {
      setOpen(false);
      setMessages([{ role: 'assistant', text: WELCOME_LOGGED_IN }]);
    }
  }, [isLoggedIn]);

  const send = useCallback(async () => {
    const t = input.trim();
    if (!t || loading) return;
    if (!authService.isAuthenticated()) return;

    setInput('');
    setMessages((m) => [...m, { role: 'user', text: t }]);
    setLoading(true);
    try {
      const r = await assistantService.chat(t);
      setMessages((m) => [...m, { role: 'assistant', text: r.reply, source: r.source }]);
      if (r.navigateTo?.trim()) {
        navigate(r.navigateTo.trim());
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: 'Something went wrong. Try again, or browse products and donations from the menu.',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }
  }, [input, loading]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {!open && (
        <div className="fixed bottom-6 right-6 z-[60] flex h-16 w-16 items-center justify-center sm:bottom-8 sm:right-8">
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-fuchsia-500 to-rose-600 opacity-35 blur-xl"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-[-4px] rounded-[1.15rem] border-2 border-primary/40 animate-assistant-ring"
            aria-hidden
          />
          <Button
            type="button"
            size="icon"
            className={cn(
              'relative h-14 w-14 rounded-2xl shadow-2xl shadow-primary/25',
              'bg-gradient-to-br from-[hsl(var(--intelligence-deep))] via-fuchsia-600 to-rose-600 text-white',
              'ring-2 ring-white/40 ring-offset-2 ring-offset-background',
              'hover:brightness-110 active:brightness-95 transition-[filter,transform] duration-200',
              'hover:scale-[1.03] active:scale-[0.98]',
            )}
            onClick={() => setOpen(true)}
            aria-label="Open style assistant"
          >
            <MessageCircle className="h-6 w-6 drop-shadow-sm" strokeWidth={2} />
          </Button>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className={cn(
            '!inset-y-auto !left-auto !top-auto flex min-h-0 !h-[min(560px,calc(100dvh-6rem))] w-[min(380px,calc(100vw-1.5rem))] flex-col !gap-0 overflow-hidden !p-0',
            '!bottom-6 !right-3 !border !border-primary/15 sm:!bottom-8 sm:!right-8 sm:!max-w-[392px]',
            '!rounded-2xl !shadow-2xl shadow-primary/10',
            'bg-gradient-to-b from-background via-background to-muted/30',
          )}
        >
          <div className="relative overflow-hidden border-b border-primary/10">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-primary/25 to-fuchsia-500/20 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-rose-400/15 to-amber-400/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
              aria-hidden
            />

            <SheetHeader className="relative space-y-2 px-5 pb-4 pt-6 text-left">
              <SheetTitle className="flex items-center gap-2.5 pr-10 font-display-hero text-xl tracking-tight">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-fuchsia-500/15 ring-1 ring-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                  Style assistant
                </span>
              </SheetTitle>
              <SheetDescription className="text-xs leading-relaxed text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/[0.06] px-2.5 py-0.5 font-medium text-foreground/80">
                  <Wand2 className="h-3 w-3 text-primary shrink-0" aria-hidden />
                  Stylist-inspired tips
                </span>
                <span className="mt-2 block">
                  Answers blend Styvia rules with optional AI — tailored to signed-in shoppers.
                </span>
              </SheetDescription>
            </SheetHeader>
          </div>

          <ScrollArea className="min-h-0 flex-1 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,hsl(var(--primary)/0.06),transparent_70%)] px-4 py-3">
            <div className="space-y-4 pr-2 pb-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'animate-assistant-message-in max-w-[92%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed shadow-sm',
                    m.role === 'user'
                      ? 'ml-auto bg-gradient-to-br from-primary via-primary to-rose-600 text-primary-foreground shadow-lg shadow-primary/20'
                      : 'mr-auto border border-primary/10 bg-card/90 text-foreground backdrop-blur-md dark:bg-card/80',
                  )}
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.24)}s` }}
                >
                  {m.text}
                  {m.source && m.role === 'assistant' && (
                    <p className="mt-2 border-t border-border/40 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Source · {m.source}
                    </p>
                  )}
                </div>
              ))}
              {loading && (
                <div className="mr-auto flex animate-assistant-message-in items-center gap-3 rounded-2xl border border-primary/10 bg-muted/50 px-4 py-3 backdrop-blur-sm">
                  <span className="text-xs font-medium text-muted-foreground">Styling your answer</span>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-rose-500 animate-bounce"
                        style={{ animationDelay: `${d * 0.12}s` }}
                      />
                    ))}
                  </span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="relative border-t border-primary/10 bg-background/90 p-4 backdrop-blur-xl">
            <div
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
              aria-hidden
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything — fit, size, stores…"
                  className={cn(
                    'h-12 rounded-xl border-primary/20 bg-background/80 pr-3 pl-4',
                    'shadow-inner shadow-primary/[0.03]',
                    'transition-all duration-300',
                    'focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20',
                  )}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  disabled={loading}
                />
              </div>
              <Button
                type="button"
                size="icon"
                onClick={send}
                disabled={loading}
                className={cn(
                  'h-12 w-12 shrink-0 rounded-xl',
                  'bg-gradient-to-br from-primary via-rose-500 to-fuchsia-600 text-white shadow-lg shadow-primary/25',
                  'transition-transform hover:scale-[1.04] active:scale-[0.96]',
                  'disabled:opacity-60 disabled:hover:scale-100',
                )}
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
