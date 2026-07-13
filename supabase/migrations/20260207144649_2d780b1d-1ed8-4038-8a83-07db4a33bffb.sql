-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for managing admin access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policies for disputes (to view and manage all disputes)
CREATE POLICY "Admins can view all disputes"
ON public.disputes FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all disputes"
ON public.disputes FOR UPDATE
USING (public.is_admin());

-- Add admin policies for user_penalties
CREATE POLICY "Admins can view all penalties"
ON public.user_penalties FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage all penalties"
ON public.user_penalties FOR ALL
USING (public.is_admin());

-- Add admin policies for user_violations
CREATE POLICY "Admins can view all violations"
ON public.user_violations FOR SELECT
USING (public.is_admin());

-- Add admin policy for profiles (view all)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin());

-- Add admin policy for collaboration_requests (view all)
CREATE POLICY "Admins can view all collaborations"
ON public.collaboration_requests FOR SELECT
USING (public.is_admin());

-- Add admin policy for messages (view all for dispute resolution)
CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT
USING (public.is_admin());