-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  category text NOT NULL DEFAULT '其他'::text,
  icon text NOT NULL DEFAULT 'mdi:trophy-outline'::text,
  stat_key text NOT NULL,
  threshold integer NOT NULL DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.channels (
  id text NOT NULL,
  name text NOT NULL,
  icon text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT channels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.characters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT characters_pkey PRIMARY KEY (id),
  CONSTRAINT characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.friend_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT friend_requests_pkey PRIMARY KEY (id),
  CONSTRAINT friend_requests_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES auth.users(id),
  CONSTRAINT friend_requests_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.game_room_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  CONSTRAINT game_room_applications_pkey PRIMARY KEY (id),
  CONSTRAINT game_room_applications_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.game_rooms(id),
  CONSTRAINT game_room_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.game_room_module_options (
  id text NOT NULL,
  name text NOT NULL,
  icon text,
  CONSTRAINT game_room_module_options_pkey PRIMARY KEY (id)
);
CREATE TABLE public.game_room_tag_options (
  tag text NOT NULL,
  category text NOT NULL DEFAULT '其他'::text,
  CONSTRAINT game_room_tag_options_pkey PRIMARY KEY (tag)
);
CREATE TABLE public.game_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  module text,
  tags ARRAY DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'recruiting'::text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  module_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_players integer NOT NULL DEFAULT 6,
  module_entries jsonb DEFAULT '[]'::jsonb,
  backstory text,
  CONSTRAINT game_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT game_rooms_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  user_id uuid,
  user_name text,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text'::text,
  speaker_role text,
  speaker_id text,
  speaker_name text,
  created_at timestamp with time zone DEFAULT now(),
  speaker_portrait text,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.modules (
  id text NOT NULL,
  name text NOT NULL,
  icon text,
  owner_id uuid NOT NULL,
  sub_channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT ''::text,
  content text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  images jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'system'::text CHECK (type = ANY (ARRAY['system'::text, 'friend_request'::text, 'room_invite'::text, 'room_apply'::text])),
  title text NOT NULL DEFAULT ''::text,
  content text NOT NULL DEFAULT ''::text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  decision text CHECK (decision = ANY (ARRAY['accepted'::text, 'rejected'::text])),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text,
  avatar text,
  updated_at timestamp with time zone DEFAULT now(),
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.room_characters (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  character_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT room_characters_pkey PRIMARY KEY (id),
  CONSTRAINT room_characters_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.game_rooms(id),
  CONSTRAINT room_characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT room_characters_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
CREATE TABLE public.room_clues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT ''::text,
  images ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT room_clues_pkey PRIMARY KEY (id),
  CONSTRAINT room_clues_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.game_rooms(id),
  CONSTRAINT room_clues_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.room_log_novels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  date text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT room_log_novels_pkey PRIMARY KEY (id),
  CONSTRAINT room_log_novels_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.game_rooms(id)
);
CREATE TABLE public.system_settings (
  id text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.update_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT update_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_achievements (
  user_id uuid NOT NULL,
  achievement_id text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (user_id, achievement_id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);