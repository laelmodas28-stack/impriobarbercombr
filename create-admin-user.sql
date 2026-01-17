-- Script para criar usuário admin@admin.com
-- Execute este script no SQL Editor do Supabase

-- IMPORTANTE: Este script precisa ser executado com privilégios de admin do Supabase
-- Use o SQL Editor no painel do Supabase ou execute via Supabase CLI

-- 1. Criar usuário no auth (usando função admin do Supabase)
-- NOTA: Você precisa executar isso manualmente no Supabase Dashboard > Authentication > Users > Add User
-- Ou usar a API do Supabase Admin para criar o usuário

-- Alternativa: Usar a função de registro de barbearia ou criar manualmente via interface

-- 2. Após criar o usuário manualmente, execute o código abaixo substituindo o USER_ID
-- Para encontrar o USER_ID: vá em Authentication > Users e copie o ID do usuário admin@admin.com

-- ============================================
-- PASSO 1: Crie o usuário manualmente no Supabase Dashboard
-- Authentication > Users > Add User
-- Email: admin@admin.com
-- Password: admin123 (ou a senha que você preferir)
-- ============================================

-- ============================================
-- PASSO 2: Execute o código abaixo substituindo USER_ID pelo ID do usuário criado
-- ============================================

-- Substitua este UUID pelo ID do usuário admin@admin.com que você criou
DO $$
DECLARE
  admin_user_id uuid;
  barbershop_uuid uuid;
  admin_email text := 'admin@admin.com';
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário % não encontrado. Crie o usuário primeiro no Supabase Dashboard > Authentication > Users', admin_email;
  END IF;

  -- Buscar ou criar barbearia padrão (primeira barbearia encontrada ou criar uma nova)
  SELECT id INTO barbershop_uuid
  FROM public.barbershops
  ORDER BY created_at ASC
  LIMIT 1;

  -- Se não houver barbearia, criar uma padrão
  IF barbershop_uuid IS NULL THEN
    INSERT INTO public.barbershops (
      name,
      slug,
      owner_id,
      address,
      description
    ) VALUES (
      'Imperio Barber',
      'imperio-barber',
      admin_user_id,
      'Endereço da barbearia',
      'Barbearia padrão'
    )
    RETURNING id INTO barbershop_uuid;
  END IF;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    role
  ) VALUES (
    admin_user_id,
    'Administrador',
    NULL,
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Administrador',
      role = 'admin';

  -- Criar role de admin para a barbearia
  INSERT INTO public.user_roles (
    user_id,
    role,
    barbershop_id
  ) VALUES (
    admin_user_id,
    'admin',
    barbershop_uuid
  )
  ON CONFLICT (user_id, barbershop_id, role) DO NOTHING;

  -- Se for a primeira barbearia, tornar super_admin também
  INSERT INTO public.user_roles (
    user_id,
    role,
    barbershop_id
  ) VALUES (
    admin_user_id,
    'super_admin',
    barbershop_uuid
  )
  ON CONFLICT (user_id, barbershop_id, role) DO NOTHING;

  RAISE NOTICE 'Usuário admin@admin.com configurado com sucesso!';
  RAISE NOTICE 'Barbearia ID: %', barbershop_uuid;
  RAISE NOTICE 'Slug da barbearia: %', (SELECT slug FROM public.barbershops WHERE id = barbershop_uuid);
  RAISE NOTICE 'Acesse o painel em: /b/%/admin', (SELECT slug FROM public.barbershops WHERE id = barbershop_uuid);
END $$;

