// js/auth.js (Actualizar o añadir esta lógica)
import { supabase } from './supabase-client.js';

// ... (mantener funciones de login anteriores) ...

export async function verificarSesionYRol(rolesPermitidos) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }

    // Consultar datos de perfil actualizados directo de la DB (Evita clonación de sesión caducada)
    const { data: perfil, error } = await supabase
        .from('perfiles')
        .select('rol, plan_activo, suscripcion_vence')
        .eq('id', session.user.id)
        .single();

    if (error || !rolesPermitidos.includes(perfil.rol)) {
        window.location.href = 'login.html';
        return null;
    }

    // SI ES CLIENTE: Validar rigurosamente que su suscripción no haya expirado
    if (perfil.rol === 'cliente') {
        if (!perfil.suscripcion_vence) {
            window.location.href = 'login.html?error=sin_suscripcion';
            return null;
        }

        const fechaVencimiento = new Date(perfil.suscripcion_vence);
        const ahora = new Date();

        if (ahora > fechaVencimiento) {
            window.location.href = 'login.html?error=suscripcion_caducada';
            return null;
        }
        
        // Adjuntamos la info de expiración al objeto de usuario para mostrarlo en UI
        session.user.plan_activo = perfil.plan_activo;
        session.user.suscripcion_vence = perfil.suscripcion_vence;
    }

    localStorage.setItem('user_role', perfil.rol);
    return session.user;
}
