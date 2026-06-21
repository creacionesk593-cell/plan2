// js/admin.js

async function verificarAccesoAdmin() {
    const { data: { session } } = await window._supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: perfil, error } = await window._supabase
        .from('perfiles')
        .select('rol, email, plan_activo')
        .eq('id', session.user.id)
        .single();

    if (error || !perfil || perfil.rol !== 'admin' || !perfil.plan_activo) {
        alert("ACCESO RECHAZADO: Tu cuenta no tiene permisos de Administrador o carece de plan activo.");
        await window._supabase.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('admin-tag').textContent = `Admin: ${perfil.email}`;
    cargarUsuariosDeLaSuite();
    await cargarListaParaResetear();
}

async function cargarListaParaResetear() {
    const selectUser = document.getElementById('reset-user-select');
    if (!selectUser) return;

    try {
        const { data: perfiles, error } = await window._supabase
            .from('perfiles')
            .select('id, email')
            .order('email', { ascending: true });

        if (error) throw error;

        selectUser.innerHTML = '<option value="">Seleccionar Cuenta de Usuario</option>';
        perfiles.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.email;
            selectUser.appendChild(opt);
        });
    } catch (err) {
        console.error("Error al cargar lista de usuarios:", err);
    }
}

// Renderizar la tabla mapeando tus estados reales de plan_activo
async function cargarUsuariosDeLaSuite() {
    const tbody = document.getElementById('tabla-usuarios-body');
    try {
        const { data: perfiles, error } = await window._supabase
            .from('perfiles')
            .select('id, email, rol, suscripcion_vence, plan_activo')
            .order('email', { ascending: true });

        if (error) throw error;

        tbody.innerHTML = '';
        perfiles.forEach(p => {
            const fila = document.createElement('tr');
            
            let fechaFormateada = "";
            if (p.suscripcion_vence) {
                fechaFormateada = p.suscripcion_vence.split('T')[0];
            }

            fila.innerHTML = `
                <td>${p.email}</td>
                <td><strong style="color: ${p.rol === 'admin' ? '#00e676' : p.rol === 'vendedor' ? '#ffaa00' : '#0071e3'}">${p.rol.toUpperCase()}</strong></td>
                <td>
                    <input type="date" value="${fechaFormateada}" 
                        onchange="cambiarFechaVencimiento('${p.id}', this.value)" 
                        style="padding: 5px; background: #202024; border: 1px solid #29292e; color: white; border-radius: 4px; font-size: 13px;">
                </td>
                <td>
                    <select onchange="cambiarEstadoUsuario('${p.id}', this.value)" 
                        style="padding: 5px; background: #202024; border: 1px solid #29292e; color: white; border-radius: 4px; font-weight: bold; font-size: 13px;">
                        <option value="vitalicio" ${p.plan_activo === 'vitalicio' ? 'selected' : ''}>Vitalicio</option>
                        <option value="1_ano" ${p.plan_activo === '1_ano' ? 'selected' : ''}>1 Año</option>
                        <option value="1_mes" ${p.plan_activo === '1_mes' ? 'selected' : ''}>1 Mes</option>
                        <option value="1_dia" ${p.plan_activo === '1_dia' ? 'selected' : ''}>1 Día</option>
                        <option value="" ${!p.plan_activo ? 'selected' : ''} style="color: #ff3366;">Inhabilitado (NULL)</option>
                    </select>
                </td>
            `;
            tbody.appendChild(fila);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color: #ff3366; text-align: center;">Error de sincronización: ${err.message}</td></tr>`;
    }
}

async function cambiarFechaVencimiento(perfilId, nuevaFecha) {
    if (!nuevaFecha) return;
    try {
        const { error } = await window._supabase
            .from('perfiles')
            .update({ suscripcion_vence: nuevaFecha })
            .eq('id', perfilId);

        if (error) throw error;
    } catch (err) {
        alert("Error al cambiar la fecha: " + err.message);
        cargarUsuariosDeLaSuite();
    }
}

async function cambiarEstadoUsuario(perfilId, nuevoEstado) {
    const valorParaGuardar = nuevoEstado === "" ? null : nuevoEstado;
    try {
        const { error } = await window._supabase
            .from('perfiles')
            .update({ plan_activo: valorParaGuardar })
            .eq('id', perfilId);

        if (error) throw error;
        alert(`Plan de cuenta modificado con éxito.`);
        cargarUsuariosDeLaSuite();
    } catch (err) {
        alert("Error al cambiar el plan: " + err.message);
        cargarUsuariosDeLaSuite();
    }
}

// Cambiar credenciales de forma forzada por el Administrador
document.getElementById('form-resetear-pass').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-ejecutar-reset');
    const usuarioId = document.getElementById('reset-user-select').value;
    const nuevaPass = document.getElementById('reset-new-pass').value;

    if (!usuarioId) {
        alert("Por favor, selecciona un usuario de la lista.");
        return;
    }

    btn.textContent = "Modificando Credenciales...";
    btn.disabled = true;

    try {
        const { data, error } = await window._supabase.rpc('forzar_password_usuario', {
            p_usuario_id: usuarioId,
            p_nueva_password: nuevaPass
        });

        if (error) throw error;

        alert("¡Contraseña reescrita con éxito absoluto!");
        document.getElementById('reset-new-pass').value = '';
        document.getElementById('reset-user-select').value = '';
    } catch (err) {
        alert("Error al actualizar contraseña: " + err.message);
    } finally {
        btn.textContent = "Ejecutar Reseteo Inmediato";
        btn.disabled = false;
    }
};

// Crear usuario evitando el error de llaves duplicadas
document.getElementById('form-crear-usuario').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-ejecutar-registro');
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const rol = document.getElementById('reg-rol').value;

    btn.textContent = "Ejecutando Query en la Nube...";
    btn.disabled = true;

    try {
        const { data, error } = await window._supabase.rpc('crear_usuario_desde_admin', {
            p_email: email,
            p_password: pass,
            p_rol: rol
        });

        if (error) throw error;

        if (data.startsWith('ERROR')) {
            alert(data);
        } else {
            alert(`¡Éxito absoluto! Cuenta [${email}] dada de alta de forma segura.`);
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-pass').value = '';
            cargarUsuariosDeLaSuite();
            cargarListaParaResetear();
        }
    } catch (err) {
        alert("Error al inyectar registro: " + err.message);
    } finally {
        btn.textContent = "Crear Cuenta";
        btn.disabled = false;
    }
};

document.getElementById('btn-cerrar-sesion').onclick = async () => {
    if (confirm("¿Deseas cerrar la sesión administrativa?")) {
        await window._supabase.auth.signOut();
        window.location.href = 'login.html';
    }
};

window.cambiarFechaVencimiento = cambiarFechaVencimiento;
window.cambiarEstadoUsuario = cambiarEstadoUsuario;

verificarAccesoAdmin();
