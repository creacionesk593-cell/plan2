// js/vendedor.js
import { supabase } from './supabase-client.js';

export async function listarMisClientesAsociados(vendedorId) {
    const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('creado_por', vendedorId)
        .eq('rol', 'cliente');
    if (error) throw error;
    return data;
}
