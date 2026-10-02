import { createClient, User, Session, RealtimeChannel } from '@supabase/supabase-js';
import { QuotationBundle } from './utils/storeManager';
import { PurchaseOrder } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yidgipbzxsknauvolhre.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9p5AZmEZPmhzFHBQYIUzHQ_NEmH42r7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type { User, Session };

/**
 * Autenticação via Google OAuth usando Supabase
 */
export async function signInWithGoogle() {
  const redirectUrl = window.location.origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  if (error) {
    console.error('Supabase Google OAuth error:', error);
    throw error;
  }
  return data;
}

/**
 * Autenticação via E-mail e Senha
 */
export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error('Supabase Login error:', error);
    throw error;
  }
  return data.user;
}

/**
 * Cadastro de novo usuário via E-mail e Senha
 */
export async function signUpWithEmail(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
    console.error('Supabase Register error:', error);
    throw error;
  }
  return data.user;
}

/**
 * Logout
 */
export async function logOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Supabase Logout error:', error);
    throw error;
  }
}

/**
 * Obter usuário atual
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.warn('Erro ao obter usuário atual:', err);
    return null;
  }
}

/**
 * Teste de conectividade com o Supabase
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('quotations').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase connection note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase connection offline or unreachable:', err);
    return false;
  }
}

/**
 * Salvar bundle de cotação no Supabase
 */
export async function saveQuotationToSupabase(bundle: QuotationBundle, userId?: string | null): Promise<void> {
  try {
    const code = bundle.quotation.code;
    if (!code) return;

    // Tenta upsert na tabela quotations
    const { error } = await supabase.from('quotations').upsert(
      {
        code: code,
        title: bundle.quotation.title,
        status: bundle.quotation.status,
        deadline_at: bundle.quotation.deadlineAt || null,
        user_id: userId || null,
        bundle: bundle,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'code' }
    );

    if (error) {
      // Se a coluna bundle ainda não existir, tenta salvar os campos básicos
      console.warn('Aviso ao salvar cotação completa no Supabase:', error.message);
      await supabase.from('quotations').upsert(
        {
          code: code,
          title: bundle.quotation.title,
          status: bundle.quotation.status,
          deadline_at: bundle.quotation.deadlineAt || null,
          user_id: userId || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'code' }
      );
    }
  } catch (err) {
    console.warn('Supabase save quotation error (mantendo local):', err);
  }
}

/**
 * Buscar bundle de cotação pelo código (aceita 'cot9345', 'COT-9345', 'COT9345')
 */
export async function getQuotationFromSupabase(code: string): Promise<QuotationBundle | null> {
  try {
    // 1. Busca exata direta
    const { data } = await supabase
      .from('quotations')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (data && data.bundle) {
      return data.bundle as QuotationBundle;
    }

    // 2. Variações comuns (com traço, sem traço, maiúsculas/minúsculas)
    const cleanDigits = code.replace(/[^0-9]/g, '');
    const codeWithHyphen = cleanDigits ? `COT-${cleanDigits}` : code.toUpperCase();
    const codeWithoutHyphen = cleanDigits ? `COT${cleanDigits}` : code.toUpperCase();

    const { data: altData } = await supabase
      .from('quotations')
      .select('*')
      .or(`code.eq.${codeWithHyphen},code.eq.${codeWithoutHyphen},code.ilike.${code}`)
      .maybeSingle();

    if (altData && altData.bundle) {
      return altData.bundle as QuotationBundle;
    }

    // 3. Fallback: buscar nas cotações mais recentes
    const { data: recents } = await supabase
      .from('quotations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(25);

    if (recents && recents.length > 0) {
      const cleanTarget = code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = recents.find((r) => {
        const c = (r.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const bc = (r.bundle?.quotation?.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return c === cleanTarget || (cleanDigits && c.includes(cleanDigits)) || (cleanDigits && bc.includes(cleanDigits));
      });
      if (found && found.bundle) {
        return found.bundle as QuotationBundle;
      }
    }

    return null;
  } catch (err) {
    console.warn('Falha na consulta ao Supabase:', err);
    return null;
  }
}

/**
 * Escuta em tempo real (Realtime) para atualizações de uma cotação
 */
export function subscribeToQuotationRealtime(
  code: string,
  onUpdate: (bundle: QuotationBundle) => void
): () => void {
  try {
    const cleanDigits = code.replace(/[^0-9]/g, '');
    const cleanSlug = code.toLowerCase().replace(/[^a-z0-9]/g, '');

    const channel: RealtimeChannel = supabase
      .channel(`quotation-${cleanSlug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotations',
        },
        (payload) => {
          if (payload.new && (payload.new as any).bundle) {
            const rowCode = ((payload.new as any).code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (rowCode === cleanSlug || (cleanDigits && rowCode.includes(cleanDigits))) {
              onUpdate((payload.new as any).bundle as QuotationBundle);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Erro ao iniciar Realtime channel:', err);
    return () => {};
  }
}

/**
 * Salvar proposta/preços do fornecedor no Supabase
 */
export async function saveSupplierProposalToSupabase(
  code: string,
  updatedBundle: QuotationBundle
): Promise<void> {
  try {
    await saveQuotationToSupabase(updatedBundle);
  } catch (err) {
    console.warn('Erro ao salvar proposta do fornecedor no Supabase:', err);
  }
}

/**
 * Salvar pedido de compra (Purchase Order) no Supabase
 */
export async function saveOrderToSupabase(order: PurchaseOrder, userId?: string | null): Promise<void> {
  try {
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      user_id: userId || null,
      vendor_name: order.vendorName,
      company: order.company,
      total_amount: order.totalAmount,
      items_count: order.itemsCount,
      items_json: order.items,
      status: order.status,
      created_at: order.createdAt,
    });

    if (error) {
      console.warn('Aviso ao salvar pedido no Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Falha ao salvar pedido no Supabase:', err);
  }
}

/**
 * Carregar pedidos de compra do usuário no Supabase
 */
export async function loadOrdersFromSupabase(userId: string): Promise<PurchaseOrder[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar pedidos do Supabase:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      quotationId: d.quotation_id || '',
      vendorId: d.vendor_id || '',
      vendorName: d.vendor_name,
      company: d.company,
      totalAmount: Number(d.total_amount) || 0,
      itemsCount: Number(d.items_count) || 0,
      items: d.items_json || [],
      status: d.status || 'Emitido',
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.warn('Falha ao buscar pedidos do Supabase:', err);
    return [];
  }
}

/**
 * Excluir cotação do Supabase
 */
export async function deleteQuotationFromSupabase(code: string): Promise<void> {
  try {
    await supabase.from('quotations').delete().eq('code', code);
  } catch (err) {
    console.warn('Erro ao excluir cotação do Supabase:', err);
  }
}

