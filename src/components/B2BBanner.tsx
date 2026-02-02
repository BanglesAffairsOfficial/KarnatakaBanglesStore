import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function B2BBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("b2b-banner-dismissed") === "true";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (dismissed) {
      try {
        localStorage.setItem("b2b-banner-dismissed", "true");
      } catch (e) {
        // ignore
      }
    }
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="w-full bg-amber-400 text-black text-sm font-medium py-2 px-4 flex items-center justify-between gap-4 animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <strong className="uppercase">{t("b2b.title", "Notice")}</strong>
        <span className="inline-block">{t("b2b.banner")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/auth" className="px-3 py-1 bg-black text-white rounded-md text-sm font-semibold">
          {t("b2b.login")}
        </Link>
        <button
          aria-label={t("b2b.dismiss")}
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-black/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
