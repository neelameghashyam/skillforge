import { z } from "zod";

export const emailSchema = z.string().email("Enter a valid email address");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["todo", "in_progress", "done", "archived"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  scheduled_date: z.string().optional().nullable(),
  scheduled_time: z.string().optional().nullable(),
  duration_minutes: z.number().int().positive().optional().nullable(),
  skill_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
});

export const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  all_day: z.boolean().default(false),
  color: z.string().default("#6366f1"),
}).refine((d) => new Date(d.end_time) > new Date(d.start_time), {
  message: "End time must be after start time",
  path: ["end_time"],
});

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50).default("General"),
  description: z.string().max(1000).optional().nullable(),
  level: z.enum(["beginner", "novice", "intermediate", "advanced", "expert", "master"]).default("beginner"),
  target_hours: z.number().min(0).default(0),
  color: z.string().default("#6366f1"),
  icon: z.string().default("sparkles"),
});

export const skillCurriculumResourceSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  notes: z.string().max(2000).optional(),
  estimated_hours: z.number().positive().optional(),
});

export const skillCurriculumTopicSchema = z.object({
  name: z.string().min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  description: z.string().max(2000).optional(),
  resources: z.array(skillCurriculumResourceSchema).optional(),
});

export const skillCurriculumCategorySchema = z.object({
  name: z.string().min(1),
  topics: z.array(skillCurriculumTopicSchema).min(1),
});

export const skillCurriculumSchema = z.object({
  skill: z.string().min(1),
  description: z.string().max(1000).optional(),
  categories: z.array(skillCurriculumCategorySchema).min(1),
});

export type SkillCurriculum = z.infer<typeof skillCurriculumSchema>;

export const skillLogSchema = z.object({
  skill_id: z.string().uuid(),
  hours: z.number().positive("Hours must be greater than 0"),
  note: z.string().max(500).optional().nullable(),
  logged_at: z.string().optional(),
});

export const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning"),
  skill_id: z.string().uuid().optional().nullable(),
  start_date: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  color: z.string().default("#f59e0b"),
});

export const milestoneSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  due_date: z.string().optional().nullable(),
});

export const noteSchema = z.object({
  title: z.string().max(200).default("Untitled"),
  content: z.string().default(""),
  tags: z.array(z.string()).default([]),
  skill_id: z.string().uuid().optional().nullable(),
  pinned: z.boolean().default(false),
});

export const resourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url().optional().nullable().or(z.literal("")),
  type: z.enum(["article", "video", "course", "book", "documentation", "tool", "other"]).default("article"),
  skill_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
});

export const profileSettingsSchema = z.object({
  full_name: z.string().min(1).max(100),
  timezone: z.string(),
  theme: z.enum(["light", "dark", "system"]),
  daily_digest_time: z.string(),
  notification_prefs: z.object({
    push: z.boolean(),
    email: z.boolean(),
    in_app: z.boolean(),
  }),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
export type EventFormValues = z.infer<typeof eventSchema>;
export type SkillFormValues = z.infer<typeof skillSchema>;
export type NoteFormValues = z.infer<typeof noteSchema>;
export type ResourceFormValues = z.infer<typeof resourceSchema>;
export type ProjectFormValues = z.infer<typeof projectSchema>;
