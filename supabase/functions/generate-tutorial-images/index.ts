import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TUTORIAL_PROMPTS = [
  {
    category_id: 'primeiros-passos',
    tutorial_id: 'intro-1',
    title: 'Visão Geral do Sistema',
    description: 'Conheça o painel principal e suas funcionalidades',
    prompt: 'Create a clean, modern barbershop admin dashboard mockup. Dark theme with gold accents. Show sidebar menu with icons for Dashboard, Appointments, Professionals, Services. Main area shows welcome message and quick stats cards. Professional UI design, no text, clean layout.',
    step_order: 1
  },
  {
    category_id: 'primeiros-passos',
    tutorial_id: 'intro-2',
    title: 'Navegação do Painel',
    description: 'Aprenda a navegar entre as seções do admin',
    prompt: 'Barbershop admin panel navigation mockup. Dark premium theme. Highlight tabs: Dashboard, Agendamentos, Profissionais, Serviços, Financeiro. Show tab bar with icons and active state indicator. Clean modern UI, minimalist design.',
    step_order: 2
  },
  {
    category_id: 'agendamentos',
    tutorial_id: 'agenda-1',
    title: 'Calendário de Agendamentos',
    description: 'Visualize e gerencie todos os agendamentos',
    prompt: 'Barbershop appointment calendar interface mockup. Dark theme with gold accents. Show weekly calendar view with time slots, some appointments filled with client names. Status badges: confirmed (green), pending (yellow). Clean professional UI.',
    step_order: 1
  },
  {
    category_id: 'agendamentos',
    tutorial_id: 'agenda-2',
    title: 'Fluxo de Agendamento',
    description: 'Entenda como funciona o processo de agendamento',
    prompt: 'Visual flow diagram of booking process for barbershop. Dark theme. Show 4 connected steps with icons: 1-Client books online, 2-Notification sent, 3-Confirmation, 4-Service completed. Clean infographic style, arrows connecting steps.',
    step_order: 2
  },
  {
    category_id: 'agendamentos',
    tutorial_id: 'agenda-3',
    title: 'Sistema de Notificações',
    description: 'Configure alertas e lembretes',
    prompt: 'Notification settings panel mockup for barbershop admin. Dark theme. Show bell icon with badge, list of notification types with toggle switches: SMS, WhatsApp, Push. Time selector for reminders. Clean modern UI.',
    step_order: 3
  },
  {
    category_id: 'profissionais',
    tutorial_id: 'prof-1',
    title: 'Cadastro de Profissional',
    description: 'Como adicionar um novo barbeiro',
    prompt: 'Barber registration form mockup. Dark theme with gold accents. Show form fields: profile photo upload circle, name input, specialties checkboxes (corte, barba, design), working hours selector. Add button at bottom. Clean professional UI.',
    step_order: 1
  },
  {
    category_id: 'profissionais',
    tutorial_id: 'prof-2',
    title: 'Lista de Profissionais',
    description: 'Gerencie sua equipe',
    prompt: 'Team management panel for barbershop. Dark theme. Show grid of professional cards with photo, name, rating stars, specialties tags. Edit and delete buttons on each card. Add new button. Clean modern dashboard UI.',
    step_order: 2
  },
  {
    category_id: 'servicos',
    tutorial_id: 'serv-1',
    title: 'Gerenciar Serviços',
    description: 'Adicione e edite serviços oferecidos',
    prompt: 'Services management panel for barbershop admin. Dark premium theme. Show service cards in grid: haircut, beard trim, combo. Each card shows image, price in R$, duration in minutes. Add service button. Clean modern UI.',
    step_order: 1
  },
  {
    category_id: 'servicos',
    tutorial_id: 'serv-2',
    title: 'Formulário de Serviço',
    description: 'Preencha os dados do serviço',
    prompt: 'Service creation form mockup. Dark theme with gold accents. Show form: service name input, description textarea, price field with R$ prefix, duration dropdown in minutes, image upload area. Save button. Clean professional form UI.',
    step_order: 2
  },
  {
    category_id: 'financeiro',
    tutorial_id: 'fin-1',
    title: 'Dashboard Financeiro',
    description: 'Acompanhe o faturamento',
    prompt: 'Financial dashboard for barbershop. Dark theme with gold accents. Show revenue cards: total income, expenses, profit. Bar chart showing daily revenue. Pie chart showing services breakdown. Clean data visualization UI.',
    step_order: 1
  },
  {
    category_id: 'financeiro',
    tutorial_id: 'fin-2',
    title: 'Filtros por Período',
    description: 'Filtre dados por data',
    prompt: 'Date filter panel mockup. Dark theme. Show date range picker with calendar dropdown, quick filters: Today, This Week, This Month, Custom Range. Apply button. Clean minimal UI for data filtering.',
    step_order: 2
  },
  {
    category_id: 'financeiro',
    tutorial_id: 'fin-3',
    title: 'Relatório de Performance',
    description: 'Analise o desempenho mensal',
    prompt: 'Performance report mockup for barbershop. Dark theme with gold highlights. Show line graph of monthly revenue trend, best performing days highlighted. Comparison with previous month. Clean analytical dashboard UI.',
    step_order: 3
  },
  {
    category_id: 'dashboard',
    tutorial_id: 'dash-1',
    title: 'Métricas Principais',
    description: 'Entenda os cards de estatísticas',
    prompt: 'Dashboard metrics cards mockup. Dark premium theme with gold accents. Show 4 metric cards: Total Clients (user icon), Today Appointments (calendar), Monthly Revenue (money), Return Rate % (chart). Clean card-based UI.',
    step_order: 1
  },
  {
    category_id: 'dashboard',
    tutorial_id: 'dash-2',
    title: 'Gráficos de Evolução',
    description: 'Visualize tendências ao longo do tempo',
    prompt: 'Analytics charts for barbershop dashboard. Dark theme. Show line chart with two lines: income (gold) and expenses (gray) over 12 months. Legend and tooltips. Clean data visualization, modern chart design.',
    step_order: 2
  },
  {
    category_id: 'assinatura',
    tutorial_id: 'sub-1',
    title: 'Criar Plano de Assinatura',
    description: 'Configure planos para clientes VIP',
    prompt: 'Subscription plan creation form. Dark theme with gold accents. Show form: plan name, monthly price in R$, included services checkboxes, max services per month, discount percentage. Create button. Clean premium form UI.',
    step_order: 1
  },
  {
    category_id: 'assinatura',
    tutorial_id: 'sub-2',
    title: 'Status das Assinaturas',
    description: 'Monitore assinaturas ativas',
    prompt: 'Subscription status cards mockup. Dark theme. Show 3 status types: Active (green badge), Pending (yellow badge), Expired (red badge). Each with client name and plan details. Clean status indicator UI.',
    step_order: 2
  },
  {
    category_id: 'personalizacao',
    tutorial_id: 'custom-1',
    title: 'Dados da Barbearia',
    description: 'Configure nome, logo e endereço',
    prompt: 'Barbershop settings form. Dark theme with gold accents. Show: logo upload area with preview, business name input, address field, phone/WhatsApp fields, opening hours selector. Save button. Clean settings page UI.',
    step_order: 1
  },
  {
    category_id: 'personalizacao',
    tutorial_id: 'custom-2',
    title: 'Redes Sociais',
    description: 'Conecte suas redes sociais',
    prompt: 'Social media settings panel. Dark theme. Show input fields with icons: Instagram, TikTok, WhatsApp links. Each with the platform icon on the left. Preview links at bottom. Clean form with social icons.',
    step_order: 2
  },
  {
    category_id: 'personalizacao',
    tutorial_id: 'custom-3',
    title: 'Prévia do Site',
    description: 'Veja como sua página ficará',
    prompt: 'Website preview mockup for barbershop. Dark theme with gold accents. Show phone mockup displaying the public barbershop page: logo, name, services list, book now button. Professional landing page preview.',
    step_order: 3
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { barbershop_id, tutorial_id } = await req.json();

    if (!barbershop_id) {
      throw new Error('barbershop_id is required');
    }

    // Filter tutorials to generate
    const tutorialsToGenerate = tutorial_id 
      ? TUTORIAL_PROMPTS.filter(t => t.tutorial_id === tutorial_id)
      : TUTORIAL_PROMPTS;

    console.log(`Generating ${tutorialsToGenerate.length} tutorial images for barbershop ${barbershop_id}`);

    const results = [];

    for (const tutorial of tutorialsToGenerate) {
      try {
        console.log(`Generating image for: ${tutorial.tutorial_id}`);

        // Generate image using Lovable AI
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: tutorial.prompt
              }
            ],
            modalities: ["image", "text"]
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI gateway error for ${tutorial.tutorial_id}:`, response.status, errorText);
          
          if (response.status === 429) {
            results.push({ tutorial_id: tutorial.tutorial_id, status: 'rate_limited' });
            continue;
          }
          if (response.status === 402) {
            results.push({ tutorial_id: tutorial.tutorial_id, status: 'payment_required' });
            continue;
          }
          
          results.push({ tutorial_id: tutorial.tutorial_id, status: 'error', error: errorText });
          continue;
        }

        const data = await response.json();
        const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          console.error(`No image returned for ${tutorial.tutorial_id}`);
          results.push({ tutorial_id: tutorial.tutorial_id, status: 'no_image' });
          continue;
        }

        // Extract base64 data
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to storage
        const fileName = `${barbershop_id}/${tutorial.tutorial_id}.png`;
        const { error: uploadError } = await supabase.storage
          .from('tutorial-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${tutorial.tutorial_id}:`, uploadError);
          results.push({ tutorial_id: tutorial.tutorial_id, status: 'upload_error', error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('tutorial-images')
          .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;

        // Upsert tutorial record
        const { error: dbError } = await supabase
          .from('tutorial_images')
          .upsert({
            barbershop_id,
            category_id: tutorial.category_id,
            tutorial_id: tutorial.tutorial_id,
            title: tutorial.title,
            description: tutorial.description,
            image_url: imageUrl,
            step_order: tutorial.step_order,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'barbershop_id,tutorial_id'
          });

        if (dbError) {
          console.error(`DB error for ${tutorial.tutorial_id}:`, dbError);
          results.push({ tutorial_id: tutorial.tutorial_id, status: 'db_error', error: dbError.message });
          continue;
        }

        console.log(`Successfully generated: ${tutorial.tutorial_id}`);
        results.push({ tutorial_id: tutorial.tutorial_id, status: 'success', image_url: imageUrl });

        // Small delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error generating ${tutorial.tutorial_id}:`, error);
        results.push({ tutorial_id: tutorial.tutorial_id, status: 'error', error: errorMessage });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      generated: results.filter(r => r.status === 'success').length,
      total: tutorialsToGenerate.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-tutorial-images:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
