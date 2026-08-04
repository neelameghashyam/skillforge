"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSettingsSchema } from "@/lib/validations/schemas";
import { useProfile, useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Bell, BellOff, Loader2, Moon, Sun, Monitor, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { subscribeToPush, unsubscribeFromPush, getPushPermissionState, isPushSubscribed } from "@/lib/push/client";
import { api } from "@/lib/api/fetcher";
import type { z } from "zod";

type Values = z.infer<typeof profileSettingsSchema>;

const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : ["UTC"];

export default function SettingsPage() {
  const { user } = useUser();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [pushState, setPushState] = useState<"unsupported" | "denied" | "default" | "granted" | "granted-no-subscription" | "loading">("loading");
  const showEnablePushButton = pushState !== "granted";
  const enablePushButtonDisabled = pushState === "unsupported" || pushState === "loading";

  const { register, handleSubmit, watch, setValue, reset } = useForm<Values>({
    resolver: zodResolver(profileSettingsSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name ?? "",
        timezone: profile.timezone,
        theme: profile.theme,
        daily_digest_time: profile.daily_digest_time.slice(0, 5),
        notification_prefs: profile.notification_prefs,
      });
    }
  }, [profile, reset]);

  useEffect(() => {
    async function loadPushState() {
      const permission = await getPushPermissionState();
      if (permission !== "granted") {
        setPushState(permission as any);
        return;
      }

      const subscribed = await isPushSubscribed();
      if (!subscribed) {
        setPushState("granted-no-subscription");
        return;
      }

      try {
        await subscribeToPush();
        setPushState("granted");
      } catch (error) {
        console.error("Failed to sync existing push subscription:", error);
        setPushState("granted-no-subscription");
      }
    }

    loadPushState();
  }, []);

  async function onSubmit(values: Values) {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name,
        timezone: values.timezone,
        theme: values.theme,
        daily_digest_time: values.daily_digest_time + ":00",
        notification_prefs: values.notification_prefs,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setTheme(values.theme);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Settings saved");
  }

  async function handleEnablePush() {
    try {
      await subscribeToPush();
      setPushState("granted");
      toast.success("Push notifications enabled");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDisablePush() {
    await unsubscribeFromPush();
    setPushState("default");
    toast.success("Push notifications disabled");
  }

  async function handleTestNotification() {
    try {
      const data = await api.post<{ sent: number; failed: number; errors?: unknown }>(
        "/api/push/send",
        { title: "SkillForge test", body: "Push notifications are working! 🎉" }
      );

      if (data.sent > 0) {
        toast.success(`Sent ${data.sent} notification(s)`);
      } else if (data.failed > 0) {
        toast.error(`Push failed: ${data.failed} delivery error(s)`);
        console.error("Push send errors:", data.errors);
      } else {
        toast.error("No push subscriptions found. Please enable browser push first.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleSendTestEmail() {
    try {
      const data = await api.post<{ ok: boolean; error?: string }>("/api/email/test");
      if (data.ok) {
        toast.success("Test email sent — check your inbox.");
      } else {
        toast.error(data.error ?? "Failed to send test email.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDeleteAccount() {
    toast.info("Please contact support to permanently delete your account and all associated data.");
  }

  if (isLoading || !profile) return <p className="text-muted-foreground">Loading settings...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, notifications, and preferences.</p>
        </div>
        <Button variant="secondary" asChild>
          <Link href="/settings/import">Import curriculum</Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register("full_name")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={watch("timezone")} onValueChange={(v) => setValue("timezone", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIMEZONES.map((tz: string) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {[
                { value: "light", icon: Sun, label: "Light" },
                { value: "dark", icon: Moon, label: "Dark" },
                { value: "system", icon: Monitor, label: "System" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("theme", opt.value as any)}
                  className={`flex-1 flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                    watch("theme") === opt.value ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                >
                  <opt.icon className="h-5 w-5" />
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Control how and when SkillForge reaches out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">In-app notifications</p>
                <p className="text-xs text-muted-foreground">Badge earned, level ups, reminders</p>
              </div>
              <Switch
                checked={watch("notification_prefs")?.in_app}
                onCheckedChange={(v) => setValue("notification_prefs", { ...watch("notification_prefs"), in_app: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Email digest</p>
                <p className="text-xs text-muted-foreground">Daily summary sent via email</p>
              </div>
              <Switch
                checked={watch("notification_prefs")?.email}
                onCheckedChange={(v) => setValue("notification_prefs", { ...watch("notification_prefs"), email: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Push notifications</p>
                <p className="text-xs text-muted-foreground">Browser push for reminders & digests</p>
              </div>
              <Switch
                checked={watch("notification_prefs")?.push}
                onCheckedChange={(v) => setValue("notification_prefs", { ...watch("notification_prefs"), push: v })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_digest_time">Daily digest time</Label>
              <Input id="daily_digest_time" type="time" {...register("daily_digest_time")} className="w-40" />
            </div>

            <div className="pt-2 border-t flex items-center gap-2 flex-wrap">
              {showEnablePushButton ? (
                <Button type="button" variant="outline" onClick={handleEnablePush} disabled={enablePushButtonDisabled}>
                  <Bell className="h-4 w-4" /> Enable browser push
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleDisablePush}>
                  <BellOff className="h-4 w-4" /> Disable browser push
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={handleTestNotification}>Send test notification</Button>
              <Button type="button" variant="ghost" onClick={handleSendTestEmail}>Send test email</Button>
              {pushState === "unsupported" && <p className="text-xs text-muted-foreground">Not supported in this browser.</p>}
              {pushState === "granted-no-subscription" && <p className="text-xs text-muted-foreground">Notifications are allowed, but your browser needs to be subscribed before test messages can be sent.</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Irreversible actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="h-4 w-4" /> Delete account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all associated data — tasks, skills, notes, and progress. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount}>Yes, delete my account</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
