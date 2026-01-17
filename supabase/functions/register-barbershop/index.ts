import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "imperiobarberdev@gmail.com";
const BASE_URL = "https://impriobarbercombr.lovable.app";

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
    // Schema validation (code is now required)
    const registerSchema = z.object({
      code: z.string().min(6, "Código de acesso é obrigatório").max(50, "Código muito longo"),
      owner: z.object({
        email: z.string().email().max(255),
        password: z.string().min(6).max(100),
        full_name: z.string().min(2).max(100).trim(),
        phone: z.string().regex(/^\d{10,15}$/).optional()
      }),
      barbershop: z.object({
        name: z.string().min(2).max(100).trim(),
        address: z.string().max(200).nullable().optional(),
        description: z.string().max(500).nullable().optional()
      })
    });

    const body = await req.json();
    const validatedData = registerSchema.parse(body);
    const { code, owner, barbershop } = validatedData;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate registration code (now required)
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from('registration_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_used', false)
      .maybeSingle();

    if (codeError || !codeData) {
      return new Response(
        JSON.stringify({ error: 'Código de acesso inválido ou já utilizado' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Check if code is expired (only if expires_at is set)
    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Código de acesso expirado' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    console.log('Registration with access code:', code);

    console.log('Starting barbershop registration for:', owner.email);

    // 1. Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: owner.email,
      password: owner.password,
      email_confirm: true,
      user_metadata: {
        full_name: owner.full_name,
        phone: owner.phone,
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      
      // Translate common auth errors to Portuguese
      let errorMessage = authError.message;
      if (authError.code === 'email_exists' || authError.message.includes('already been registered')) {
        errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const userId = authData.user.id;
    console.log('User created:', userId);

    // 2. Update profile to admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // 3. Create barbershop
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

    // 4. Create user_role (admin)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        barbershop_id: barbershopId,
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
    }

    // 5. Create default notification_settings
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
    }

    // 6. Mark registration code as used (code is now required)
    const { error: codeUpdateError } = await supabaseAdmin
      .from('registration_codes')
      .update({ 
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('code', code.toUpperCase().trim());

    if (codeUpdateError) {
      console.error('Error updating registration code:', codeUpdateError);
    }

    // Enviar webhook para n8n com dados de acesso
    const webhookUrl = 'https://n8nwebhook.atendai.app/webhook/23f78ce8-d4c4-4ce3-bff4-374701a008a1';
    const baseUrl = 'https://impriobarbercombr.lovable.app';

    try {
      const webhookPayload = {
        event: 'barbershop_registered',
        timestamp: new Date().toISOString(),
        barbershop: {
          id: barbershopId,
          name: barbershop.name,
          slug: barbershopData.slug,
          address: barbershop.address || null,
          description: barbershop.description || null
        },
        owner: {
          id: userId,
          email: owner.email,
          full_name: owner.full_name,
          phone: owner.phone || null
        },
        access_urls: {
          barbershop_page: `${baseUrl}/b/${barbershopData.slug}`,
          admin_panel: `${baseUrl}/b/${barbershopData.slug}/admin`,
          login_page: `${baseUrl}/b/${barbershopData.slug}/auth`
        }
      };

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      
      console.log('Webhook enviado para n8n:', webhookResponse.status);
    } catch (webhookError) {
      console.error('Erro ao enviar webhook (não crítico):', webhookError);
    }

    // Enviar emails de notificação
    try {
      const accessUrls = {
        barbershop_page: `${BASE_URL}/b/${barbershopData.slug}`,
        admin_panel: `${BASE_URL}/b/${barbershopData.slug}/admin`,
        login_page: `${BASE_URL}/b/${barbershopData.slug}/auth`
      };

      // Email de boas-vindas para o dono da barbearia
      const welcomeEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #d4af37; margin: 0; font-size: 28px; font-weight: bold;">✂️ Império Barber</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestão para Barbearias</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 24px;">Bem-vindo(a), ${owner.full_name}! 🎉</h2>
                      
                      <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Sua barbearia <strong style="color: #1a1a2e;">${barbershop.name}</strong> foi cadastrada com sucesso no Império Barber!
                      </p>
                      
                      <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Agora você tem acesso a todas as ferramentas para gerenciar sua barbearia de forma profissional.
                      </p>
                      
                      <!-- Access Box -->
                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                        <h3 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 18px;">📧 Dados de Acesso</h3>
                        <p style="color: #555555; margin: 0 0 8px 0;"><strong>Email:</strong> ${owner.email}</p>
                        <p style="color: #888888; font-size: 14px; margin: 0;">Use a senha que você cadastrou para fazer login.</p>
                      </div>
                      
                      <!-- Links -->
                      <h3 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 18px;">🔗 Seus Links de Acesso</h3>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 10px 0;">
                            <a href="${accessUrls.login_page}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #1a1a2e; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">Fazer Login</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0;">
                            <a href="${accessUrls.admin_panel}" style="color: #d4af37; text-decoration: none; font-size: 14px;">🔧 Painel Administrativo: ${accessUrls.admin_panel}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0;">
                            <a href="${accessUrls.barbershop_page}" style="color: #d4af37; text-decoration: none; font-size: 14px;">🏠 Página da Barbearia: ${accessUrls.barbershop_page}</a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Instructions -->
                      <div style="background-color: #fff8e1; border-left: 4px solid #d4af37; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                        <h4 style="color: #1a1a2e; margin: 0 0 10px 0;">💡 Próximos Passos</h4>
                        <ol style="color: #555555; margin: 0; padding-left: 20px; line-height: 1.8;">
                          <li>Acesse o painel administrativo</li>
                          <li>Configure os serviços oferecidos</li>
                          <li>Cadastre seus profissionais</li>
                          <li>Personalize sua barbearia</li>
                          <li>Comece a receber agendamentos!</li>
                        </ol>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1a1a2e; padding: 25px; text-align: center;">
                      <p style="color: #888888; font-size: 14px; margin: 0;">
                        © 2024 Império Barber. Todos os direitos reservados.
                      </p>
                      <p style="color: #666666; font-size: 12px; margin: 10px 0 0 0;">
                        Dúvidas? Entre em contato conosco.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Enviar email para o dono da barbearia
      const { error: welcomeError } = await resend.emails.send({
        from: "Império Barber <onboarding@resend.dev>",
        to: [owner.email],
        subject: `🎉 Bem-vindo ao Império Barber - ${barbershop.name}`,
        html: welcomeEmailHtml,
      });

      if (welcomeError) {
        console.error('Erro ao enviar email de boas-vindas:', welcomeError);
      } else {
        console.log('Email de boas-vindas enviado para:', owner.email);
      }

      // Email de notificação para o administrador
      const adminEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px;">
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">🆕 Nova Barbearia Cadastrada</h2>
            
            <table style="width: 100%; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Barbearia:</td>
                <td style="padding: 8px 0; font-weight: bold;">${barbershop.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Slug:</td>
                <td style="padding: 8px 0;"><code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${barbershopData.slug}</code></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Proprietário:</td>
                <td style="padding: 8px 0;">${owner.full_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${owner.email}">${owner.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Telefone:</td>
                <td style="padding: 8px 0;">${owner.phone || 'Não informado'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Data/Hora:</td>
                <td style="padding: 8px 0;">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td>
              </tr>
            </table>
            
            <h3 style="color: #1a1a2e; margin-top: 25px;">Links de Acesso</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><a href="${accessUrls.barbershop_page}" style="color: #d4af37;">📍 Página da Barbearia</a></li>
              <li style="padding: 5px 0;"><a href="${accessUrls.admin_panel}" style="color: #d4af37;">⚙️ Painel Admin</a></li>
              <li style="padding: 5px 0;"><a href="${accessUrls.login_page}" style="color: #d4af37;">🔐 Página de Login</a></li>
            </ul>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              Este é um email automático do sistema Império Barber.
            </p>
          </div>
        </body>
        </html>
      `;

      // Enviar email para o administrador
      const { error: adminError } = await resend.emails.send({
        from: "Império Barber <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🆕 Nova Barbearia: ${barbershop.name}`,
        html: adminEmailHtml,
      });

      if (adminError) {
        console.error('Erro ao enviar email para admin:', adminError);
      } else {
        console.log('Email de notificação enviado para admin:', ADMIN_EMAIL);
      }

    } catch (emailError) {
      console.error('Erro ao enviar emails (não crítico):', emailError);
    }

    console.log('Barbershop registration completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: userId,
        barbershop_id: barbershopId,
        slug: barbershopData.slug,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in register-barbershop function:', error);
    
    // Handle zod validation errors
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos: ' + error.errors[0].message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});