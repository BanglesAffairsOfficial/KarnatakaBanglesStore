import { useState } from "react";
import { Link } from "react-router-dom";
import { Megaphone, X } from "lucide-react";
import { Button } from "./ui/button";

const AttentionBanner = () => {
  const [visible, setVisible] = useState(true);

  const dismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-white/15 p-2">
            <Megaphone className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-snug">
            <p className="text-sm font-semibold tracking-wide">Attention !</p>
            <p className="text-sm">
              Log in to place bulk (B2B) orders. Single (B2C) orders can be placed directly—no
              login required.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="bg-white text-orange-700 hover:bg-white/90"
          >
            <Link to="/login">Log in</Link>
          </Button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss notice"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttentionBanner;
