import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export function EmailVerificationDialog({
  open,
  onOpenChange,
  email,
}: EmailVerificationDialogProps) {
  const [resending, setResending] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        toast({
          title: t("authPage.verification.resendFailed"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("authPage.verification.resendSuccess"),
          description: t("authPage.verification.resendDesc"),
        });
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">
            {t("authPage.verification.title")}
          </DialogTitle>
          <DialogDescription className="text-base pt-2 space-y-2">
            <div>
              {t("authPage.verification.desc")}{" "}
              <span className="font-semibold text-foreground">{email}</span>.
            </div>
            <div className="text-sm text-muted-foreground leading-snug">
              {t("authPage.verification.steps")}
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-muted text-foreground border">
                From: noreply@mail.app.supabase.io
              </span>
              <span className="px-2 py-1 rounded-full bg-muted text-foreground border">
                Subject: “Confirm Your Signup”
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg mt-2">
          <p className="text-sm text-muted-foreground text-center">
            {t("authPage.verification.note")}
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            {t("authPage.verification.close")}
          </Button>
          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full"
          >
            {resending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("authPage.verification.resend")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
