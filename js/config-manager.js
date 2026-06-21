// js/config-manager.js
import { supabase } from './supabase-client.js';

// Cargar configuraciones globales (JSONs compartidos por defecto)
export async function obtenerConfigsGlobales() {
    const { data, error } = await supabase
        .from('configs_globales')
        .select('*')
        .order('creado_en', { ascending: true });
    if (error) return [];
    return data;
}

// Cargar configuraciones exclusivas del cliente autenticado
export async function obtenerConfigsPropias(userId) {
    const { data, error } = await supabase
        .from('configs_clientes')
        .select('*')
        .eq('user_id', userId)
        .order('actualizado_en', { ascending: false });
    if (error) return [];
    return data;
}

// Guardar configuración propia del cliente
export async function guardarConfigCliente(userId, nombre, jsonConfig) {
    // OWASP: Validamos estructuralmente que venga un JSON estructurado de Bingo antes de enviar
    if(!jsonConfig.configs || !Array.isArray(jsonConfig.configs)) {
        throw new Error("Formato estructural de configuración de bingo inválido.");
    }

    const { data, error } = await supabase
        .from('configs_clientes')
        .upsert({
            user_id: userId,
            nombre_config: nombre,
            json_data: jsonConfig,
            actualizado_en: new Date().toISOString()
        }, { onConflict: 'user_id, nombre_config' });

    if (error) throw error;
    return data;
}
