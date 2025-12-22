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

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        toast({
          title: "Failed to resend",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email sent",
          description: "Verification email has been resent to your inbox.",
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
            Verify Your Email Address
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Please check your inbox and click the verification link we just sent to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg mt-2">
          <p className="text-sm text-muted-foreground text-center">
            You must verify your email to complete registration and access your
            account.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            OK
          </Button>
          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full"
          >
            {resending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Resend Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
