import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RejectedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 text-center">
        <CardHeader className="pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl">
              ✕
            </div>
          </div>
          <CardTitle className="text-white text-xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-400 text-sm leading-relaxed">
            Your account request was not approved. Please contact the admin if
            you believe this is a mistake.
          </p>
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300"
          >
            <Link href="/auth/signin">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
