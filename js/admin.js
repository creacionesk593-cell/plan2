// js/admin.js
import { supabase } from './supabase-client.js';

export async function listarUsuariosRegistrados() {
    const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('creado_en', { ascending: false });
    if (error) throw error;
    return data;
}

export async function crearNuevoUsuario(email, password, rol) {
    // Llama a una Edge Function segura de Supabase o crea el registro en la tabla de auth indirectamente
    // Para entornos frontend puros sin servidor, se usa el cliente de gestión o una tabla de pre-registro segura
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { rol_inicial: rol } }
    });
    if (error) throw error;
    return data;
}

export async function forzarCambioContrasenaUsuario(userId, nuevaContrasena) {
    // Utiliza RPC criptográfico configurado en la base de datos para saltarse la restricción del cliente local
    const { data, error } = await supabase.rpc('admin_reset_password_user', {
        target_user_id: userId,
        new_password: nuevaContrasena
    });
    if (error) throw error;
    return true;
}
