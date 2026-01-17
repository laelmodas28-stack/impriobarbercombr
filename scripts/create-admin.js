/**
 * Script para criar usuário admin@admin.com
 * Execute: node scripts/create-admin.js
 * 
 * IMPORTANTE: Você precisa da Service Role Key do Supabase
 * Encontre em: Supabase Dashboard > Settings > API > service_role key
 * 
 * Configure como variável de ambiente:
 * export SUPABASE_SERVICE_ROLE_KEY="sua-chave-aqui"
 * 
 * Ou edite este arquivo e coloque a chave diretamente (não recomendado para produção)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler .env manualmente
let SUPABASE_URL, SUPABASE_SERVICE_KEY;

try {
  const envContent = readFileSync('.env', 'utf-8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1].replace(/^["']|["']$/g, '');
    }
  }
} catch (e) {
  console.warn('⚠️  Não foi possível ler .env, usando variáveis de ambiente');
}

// Usar variáveis de ambiente ou valores padrão
SUPABASE_URL = SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Erro: VITE_SUPABASE_URL não encontrado!');
  console.error('Configure no arquivo .env');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não configurada!');
  console.error('\n📋 Como configurar:');
  console.error('1. Acesse: Supabase Dashboard > Settings > API');
  console.error('2. Copie a "service_role" key (não a anon key!)');
  console.error('3. Execute: export SUPABASE_SERVICE_ROLE_KEY="sua-chave-aqui"');
  console.error('4. Ou adicione no início deste script (temporariamente)');
  console.error('\n💡 Alternativa: Use o script SQL create-admin-user.sql no SQL Editor do Supabase');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Administrador';

async function createAdminUser() {
  try {
    console.log('🔧 Criando usuário admin...');

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_NAME,
      }
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        console.log('⚠️  Usuário já existe. Buscando usuário existente...');
        
        // Buscar usuário existente
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(u => u.email === ADMIN_EMAIL);
        if (!existingUser) {
          throw new Error('Usuário não encontrado');
        }
        
        authData.user = existingUser;
        console.log('✅ Usuário encontrado:', existingUser.id);
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Usuário criado no Auth:', authData.user.id);
    }

    const userId = authData.user.id;

    // 2. Criar/Atualizar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: ADMIN_NAME,
        role: 'admin'
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
    } else {
      console.log('✅ Perfil criado/atualizado');
    }

    // 3. Buscar ou criar barbearia
    let barbershopId;
    let barbershopSlug;
    let barbershopName;
    
    // Primeiro, verificar se já existe uma barbearia oficial
    const { data: existingOfficial } = await supabaseAdmin
      .from('barbershops')
      .select('id, slug, name, is_official')
      .eq('is_official', true)
      .maybeSingle();

    if (existingOfficial) {
      barbershopId = existingOfficial.id;
      barbershopSlug = existingOfficial.slug;
      barbershopName = existingOfficial.name;
      console.log(`✅ Usando barbearia oficial existente: ${barbershopName}`);
    } else {
      // Se não há oficial, buscar Imperio Barber ou primeira barbearia
      const { data: existingBarbershop } = await supabaseAdmin
        .from('barbershops')
        .select('id, slug, name')
        .or('name.ilike.%imperio%,name.ilike.%império%,slug.eq.imperio-barber')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingBarbershop) {
        barbershopId = existingBarbershop.id;
        barbershopSlug = existingBarbershop.slug;
        barbershopName = existingBarbershop.name;
        console.log(`✅ Usando barbearia existente: ${barbershopName} (${barbershopSlug})`);
      } else {
        // Criar barbearia padrão
        const { data: newBarbershop, error: barbershopError } = await supabaseAdmin
          .from('barbershops')
          .insert({
            name: 'Imperio Barber',
            slug: 'imperio-barber',
            owner_id: userId,
            address: 'Endereço da barbearia',
            description: 'Barbearia padrão',
            is_official: true  // Marcar como oficial desde o início
          })
          .select('id, slug, name')
          .single();

        if (barbershopError) throw barbershopError;
        
        barbershopId = newBarbershop.id;
        barbershopSlug = newBarbershop.slug;
        barbershopName = newBarbershop.name;
        console.log(`✅ Barbearia criada: ${barbershopName} (${barbershopSlug})`);
      }
      
      // Garantir que a barbearia esteja marcada como oficial
      const { error: updateOfficialError } = await supabaseAdmin
        .from('barbershops')
        .update({ is_official: true })
        .eq('id', barbershopId);
      
      if (updateOfficialError) {
        console.warn('⚠️  Aviso: Não foi possível marcar como oficial:', updateOfficialError.message);
      } else {
        console.log('✅ Barbearia marcada como oficial (acessível em localhost:8080/)');
      }
    }

    // 4. Criar role de admin
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin',
        barbershop_id: barbershopId
      }, {
        onConflict: 'user_id,barbershop_id,role'
      });

    if (roleError) {
      console.error('Erro ao criar role:', roleError);
    } else {
      console.log('✅ Role de admin criada');
    }

    // 5. Criar role de super_admin (se for a primeira barbearia)
    const { error: superAdminError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'super_admin',
        barbershop_id: barbershopId
      }, {
        onConflict: 'user_id,barbershop_id,role'
      });

    if (superAdminError) {
      console.warn('⚠️  Aviso ao criar super_admin:', superAdminError.message);
    } else {
      console.log('✅ Role de super_admin criada');
    }

    // Buscar dados finais da barbearia
    const { data: finalBarbershop } = await supabaseAdmin
      .from('barbershops')
      .select('slug, is_official')
      .eq('id', barbershopId)
      .single();

    console.log('\n🎉 Usuário admin criado com sucesso!');
    console.log('\n📋 Credenciais:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASSWORD}`);
    console.log(`\n🔗 Acesse o painel em:`);
    if (finalBarbershop?.is_official) {
      console.log(`   http://localhost:8080/admin (barbearia oficial - sem slug)`);
    } else {
      console.log(`   http://localhost:8080/b/${finalBarbershop?.slug || 'imperio-barber'}/admin`);
    }
    console.log(`\n💡 Funcionalidades disponíveis:`);
    console.log(`   - Dashboard: Métricas e visão geral`);
    console.log(`   - Códigos: Gerar códigos de acesso (apenas super_admin)`);
    console.log(`   - Usuários: Gerenciar pessoas cadastradas`);
    console.log(`   - Agendamentos: Ver e gerenciar agendamentos`);
    console.log(`   - Clientes: Lista de clientes da barbearia`);
    console.log(`   - Profissionais: Cadastrar barbeiros`);
    console.log(`   - Serviços: Gerenciar serviços oferecidos`);
    console.log(`   - Configurações: Personalizar barbearia`);

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.message);
    console.error('\n💡 Solução alternativa:');
    console.error('1. Acesse o Supabase Dashboard > Authentication > Users');
    console.error('2. Clique em "Add User"');
    console.error('3. Crie o usuário com email: admin@admin.com');
    console.error('4. Execute o script SQL create-admin-user.sql no SQL Editor');
    process.exit(1);
  }
}

createAdminUser();

