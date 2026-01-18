import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const ADMIN_EMAIL = "admin@admin.com";
    const ADMIN_PASSWORD = "Admin@2024!";
    const ADMIN_NAME = "Administrador";

    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let userId: string;
    
    const existingUser = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);
    
    if (existingUser) {
      userId = existingUser.id;
      console.log("User already exists:", userId);
    } else {
      // Create user in Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_NAME,
        },
      });

      if (authError) throw authError;
      userId = authData.user.id;
      console.log("User created:", userId);
    }

    // 2. Create/update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        user_id: userId,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
      }, { onConflict: "user_id" });

    if (profileError) console.error("Profile error:", profileError);

    // 3. Check for existing barbershop or create one
    let barbershopId: string;
    let barbershopSlug: string;
    
    const { data: existingBarbershop } = await supabaseAdmin
      .from("barbershops")
      .select("id, slug, name")
      .limit(1)
      .maybeSingle();

    if (existingBarbershop) {
      barbershopId = existingBarbershop.id;
      barbershopSlug = existingBarbershop.slug;
      console.log("Using existing barbershop:", existingBarbershop.name);
    } else {
      // Create new barbershop
      const { data: newBarbershop, error: barbershopError } = await supabaseAdmin
        .from("barbershops")
        .insert({
          name: "Imperio Barber",
          slug: "imperio-barber",
          address: "Rua Principal, 123 - Centro",
          description: "A melhor barbearia da região",
          phone: "(11) 99999-9999",
          whatsapp: "5511999999999",
          is_active: true,
          theme_primary_color: "#D4AF37",
          theme_secondary_color: "#1a1a1a",
        })
        .select("id, slug")
        .single();

      if (barbershopError) throw barbershopError;
      
      barbershopId = newBarbershop.id;
      barbershopSlug = newBarbershop.slug;
      console.log("Barbershop created:", barbershopSlug);
    }

    // 4. Create admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: userId,
        barbershop_id: barbershopId,
        role: "admin",
      }, { onConflict: "user_id,barbershop_id,role" });

    if (roleError) console.error("Role error:", roleError);

    // 5. Create super_admin role
    await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: userId,
        barbershop_id: barbershopId,
        role: "super_admin",
      }, { onConflict: "user_id,barbershop_id,role" });

    // 6. Create some sample services
    const { data: existingServices } = await supabaseAdmin
      .from("services")
      .select("id")
      .eq("barbershop_id", barbershopId)
      .limit(1);

    if (!existingServices?.length) {
      await supabaseAdmin.from("services").insert([
        {
          barbershop_id: barbershopId,
          name: "Corte Masculino",
          description: "Corte tradicional ou moderno",
          price: 45.00,
          duration_minutes: 30,
          is_active: true,
        },
        {
          barbershop_id: barbershopId,
          name: "Barba",
          description: "Aparar e modelar barba",
          price: 30.00,
          duration_minutes: 20,
          is_active: true,
        },
        {
          barbershop_id: barbershopId,
          name: "Corte + Barba",
          description: "Combo completo",
          price: 65.00,
          duration_minutes: 45,
          is_active: true,
        },
      ]);
      console.log("Sample services created");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin configurado com sucesso!",
        credentials: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        },
        barbershop: {
          slug: barbershopSlug,
          adminUrl: `/b/${barbershopSlug}/admin`,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Setup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
