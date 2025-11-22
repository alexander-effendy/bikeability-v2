import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/features/auth/useAuthQueries"; // ⬅️ your hook
import { useNavigate } from "react-router-dom";             // ⬅️ add this

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { mutateAsync: doLogin, isPending } = useLogin();
  const navigate = useNavigate(); // ⬅️ init router navigation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await doLogin({ username: email, password });

      // ✅ Login succeeded:
      // - backend set session cookie
      // - TanStack Query "me" cache is updated (if you did that in onSuccess)
      // → now go to home page
      navigate("/");
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        err?.message ??
        "Login failed. Please check your credentials.";
      setFormError(detail);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background */}
      <img
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        src="https://images.pexels.com/photos/13383681/pexels-photo-13383681.jpeg?_gl=1*9j4qj9*_ga*OTUyNjk4NDMuMTc2MjQ4MzQzMQ..*_ga_8JE65Q40S6*czE3NjM3NzcwMjMkbzckZzEkdDE3NjM3NzczNTgkajEkbDAkaDA."
        alt="Cycling background"
      />
      <div className="absolute inset-0 bg-black opacity-70" />

      <div
        className={cn(
          "relative flex flex-col gap-6 max-w-md w-full mx-auto z-10",
          className
        )}
        {...props}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center gap-2 font-medium">
                <div className="flex h-8 w-8 items-center justify-center rounded-md">
                  <Bike className="size-6 text-white" />
                </div>
                <span className="sr-only">Bikeability</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                Welcome to Bikeability
              </h1>
              <div className="text-center text-sm text-ring">
                Don’t have an account?{" "}
                <a
                  href="https://www.unsw.edu.au/research/ncdap/cycling-infrastructure-scenario-builder-tool"
                  className="underline underline-offset-4 text-sidebar-ring"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request access here
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    className="absolute inset-y-0 right-2 flex items-center text-white"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}

              <Button
                type="submit"
                className="w-full border border-muted"
                disabled={isPending}
              >
                {isPending ? "Logging in..." : "Login"}
              </Button>
            </div>
          </div>
        </form>

        <div className="text-balance text-center text-xs [&_a]:underline [&_a]:underline-offset-4 text-white">
          For more help, please contact{" "}
          <a href="mailto:admin@ncdap.org" className="text-white underline">
            admin@ncdap.org
          </a>
          .
        </div>
      </div>
    </div>
  );
}
