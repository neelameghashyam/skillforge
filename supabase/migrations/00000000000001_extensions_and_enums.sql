-- ============================================================================
-- SkillForge — Initial schema: extensions & enums
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists pg_cron;

-- Task / project status
create type task_status as enum ('todo', 'in_progress', 'done', 'archived');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type project_status as enum ('planning', 'active', 'on_hold', 'completed', 'cancelled');
create type skill_level as enum ('beginner', 'novice', 'intermediate', 'advanced', 'expert', 'master');
create type resource_type as enum ('article', 'video', 'course', 'book', 'documentation', 'tool', 'other');
create type notification_channel as enum ('push', 'email', 'in_app');
create type notification_type as enum (
  'daily_digest', 'task_due', 'project_deadline',
  'streak_risk', 'badge_earned', 'level_up', 'custom'
);
create type badge_rarity as enum ('common', 'rare', 'epic', 'legendary');
