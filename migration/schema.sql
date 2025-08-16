CREATE TYPE condition AS ENUM ('ceil', 'floor', 'round','roundfloor');
CREATE TABLE public.companies (
  name character varying NOT NULL UNIQUE,
  address character varying,
  contact character varying UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.field_types (
  type character varying NOT NULL UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT field_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.modules (
  name character varying NOT NULL UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT modules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fields (
  condition condition NOT NULL ,
  priority integer NOT NULL DEFAULT 0,
  calculation text,
  field_name character varying NOT NULL,
  field_type_id uuid NOT NULL,
  module_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  description text,
  label character varying NOT NULL,
  is_editable boolean DEFAULT true,
  CONSTRAINT fields_pkey PRIMARY KEY (id),
  CONSTRAINT fields_field_type_id_fkey FOREIGN KEY (field_type_id) REFERENCES public.field_types(id),
  CONSTRAINT fields_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.goals (
  field_id uuid NOT NULL,
  value character varying NOT NULL,
  year integer NOT NULL CHECK (year >= 2000),
  user_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT goals_pkey PRIMARY KEY (id),
  CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT goals_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id)
);

CREATE TABLE public.user_types (
  type character varying NOT NULL UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT user_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  email text,
  user_id uuid NOT NULL UNIQUE,
  user_type_id uuid NOT NULL,
  company_id uuid,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  avatar_url text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT profiles_user_type_id_fkey FOREIGN KEY (user_type_id) REFERENCES public.user_types(id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_schedule (
  user_id uuid NOT NULL,
  year integer NOT NULL CHECK (year >= 2000),
  weekdays BOOL[] NOT NULL CHECK (array_length(weekdays, 1) = 7),
  working_days integer NOT NULL CHECK (working_days >= 0),
  non_working_days integer NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_schedule_pkey PRIMARY KEY (id),
  CONSTRAINT user_schedule_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.schedule_exceptions (
  user_schedule_id uuid NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  reason text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  is_day_on boolean DEFAULT true,
  CONSTRAINT schedule_exceptions_pkey PRIMARY KEY (id),
  CONSTRAINT schedule_exceptions_user_schedule_id_fkey FOREIGN KEY (user_schedule_id) REFERENCES public.user_schedule(id)
);
CREATE TABLE public.statuses (
  status character varying NOT NULL,
  module_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT statuses_pkey PRIMARY KEY (id),
  CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.tracker (
  field_id uuid NOT NULL,
  value character varying NOT NULL,
  record_date date NOT NULL,
  user_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tracker_pkey PRIMARY KEY (id),
  CONSTRAINT tracker_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT tracker_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id)
);
CREATE TABLE public.transaction_types (
  type character varying NOT NULL UNIQUE,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT transaction_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  closed_date date,
  user_id uuid NOT NULL,
  name character varying NOT NULL,
  commission numeric NOT NULL,
  pending_date date NOT NULL CHECK (pending_date >= '2000-01-01'::date),
  transaction_type_id uuid NOT NULL,
  status_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT transactions_transaction_type_id_fkey FOREIGN KEY (transaction_type_id) REFERENCES public.transaction_types(id),
  CONSTRAINT transactions_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.statuses(id)
);
CREATE TABLE public.user_schedule_history (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  start_date date,
  end_date date,
  weekdays BOOL[],
  working_days integer,
  non_working_days integer,
  CONSTRAINT user_schedule_history_pkey PRIMARY KEY (id),
  CONSTRAINT user_schedule_history_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_schedule_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);
CREATE OR REPLACE VIEW user_profiles_with_company AS
SELECT 
    profiles.id,
    profiles.first_name,
    profiles.last_name,
    profiles.user_id,
    profiles.is_active,
    profiles.created_at,
    profiles.company_id,
    companies.name AS company_name,
    companies.address AS company_address,
    companies.contact AS company_contact,
    auth.users.email
FROM 
    profiles
LEFT JOIN 
    companies ON profiles.company_id = companies.id
LEFT JOIN 
    auth.users ON profiles.user_id = auth.users.id
WHERE 
    profiles.user_type_id = 'e224bca1-89a3-46d2-900d-5dca599d8bd0';




