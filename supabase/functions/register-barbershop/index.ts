import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Criar cliente com service role para operações privilegiadas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { owner, barbershop } = await req.json();

    console.log('Starting barbershop registration for:', owner.email);

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: owner.email,
      password: owner.password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: owner.full_name,
        phone: owner.phone,
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const userId = authData.user.id;
    console.log('User created:', userId);

    // 2. Atualizar profile para admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Continuar mesmo com erro, o trigger já deve ter criado o profile
    }

    // 3. Criar barbearia
    const { data: barbershopData, error: barbershopError } = await supabaseAdmin
      .from('barbershops')
      .insert({
        name: barbershop.name,
        owner_id: userId,
        address: barbershop.address,
        description: barbershop.description,
        phone: owner.phone,
        whatsapp: owner.phone,
      })
      .select()
      .single();

    if (barbershopError) {
      console.error('Error creating barbershop:', barbershopError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar barbearia: ' + barbershopError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const barbershopId = barbershopData.id;
    console.log('Barbershop created:', barbershopId);

    // 4. Criar user_role (admin)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        barbershop_id: barbershopId,
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      // Continuar, o trigger pode já ter criado
    }

    // 5. Criar notification_settings padrão
    const { error: notificationError } = await supabaseAdmin
      .from('notification_settings')
      .insert({
        barbershop_id: barbershopId,
        enabled: true,
        send_to_client: true,
        send_whatsapp: false,
        ai_enabled: true,
        custom_message: 'Olá {nome}! Seu agendamento foi confirmado para {data} às {hora}. Serviço: {servico}. Profissional: {profissional}. Aguardamos você!',
        admin_whatsapp: owner.phone,
      });

    if (notificationError) {
      console.error('Error creating notification settings:', notificationError);
      // Continuar, o trigger pode já ter criado
    }

    console.log('Barbershop registration completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: userId,
        barbershop_id: barbershopId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in register-barbershop function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
