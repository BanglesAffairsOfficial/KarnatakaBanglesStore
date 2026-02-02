import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "b2b_notice_dismissed_v1";

export default function B2BNotice() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch (e) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />

      <div className="relative max-w-lg mx-4 w-full rounded-xl border-2 border-gold/70 bg-gradient-to-br from-white/95 to-yellow-50 shadow-2xl p-5 animate-[fadeIn_300ms_ease]">
        <button
          aria-label="Close notice"
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-white/80"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground">Important</h3>
            <p className="mt-2 text-sm sm:text-base text-foreground">for B2B price Login and for B2C price no login just direct order</p>
          </div>

          <div className="flex gap-2 mt-3 sm:mt-0">
            <Button variant="secondary" onClick={() => { dismiss(); navigate('/shop'); }} className="min-w-[120px]">Order now</Button>
            <Button onClick={() => { dismiss(); navigate('/login'); }} className="min-w-[120px]">Login (B2B)</Button>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">You can dismiss this notice. It won't reappear on this device.</div>
      </div>
    </div>
  );
}
