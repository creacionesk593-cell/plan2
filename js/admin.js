// js/admin.js

// Escudo de protección: Si no es admin o está inactivo, lo expulsa
async function verificarAccesoAdmin() {
    const { data: { session } } = await window._supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: perfil, error } = await window._supabase
        .from('perfiles')
        .select('rol, email, activo')
        .eq('id', session.user.id)
        .single();

    if (error || !perfil || perfil.rol !== 'admin' || perfil.activo === false) {
        alert("ACCESO RECHAZADO: Tu cuenta no tiene permisos de Administrador o está Inhabilitada.");
        await window._supabase.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('admin-tag').textContent = `Admin: ${perfil.email}`;
    cargarUsuariosDeLaSuite();
    await cargarListaParaResetear();
}

// Cargar select dinámico con los usuarios del sistema para cambiar contraseña
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

// Renderizar la tabla con controles de Estado, Fecha de Caducidad y Rol
async function cargarUsuariosDeLaSuite() {
    const tbody = document.getElementById('tabla-usuarios-body');
    try {
        const { data: perfiles, error } = await window._supabase
            .from('perfiles')
            .select('id, email, rol, suscripcion_vence, activo')
            .order('rol', { ascending: true });

        if (error) throw error;

        tbody.innerHTML = '';
        perfiles.forEach(p => {
            const fila = document.createElement('tr');
            
            let fechaFormateada = "";
            if (p.suscripcion_vence) {
                fechaFormateada = p.suscripcion_vence.split('T')[0];
            }

            const estaActivo = p.activo !== false; 

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
                        style="padding: 5px; background: #202024; border: 1px solid #29292e; color: ${estaActivo ? '#00e676' : '#ff3366'}; border-radius: 4px; font-weight: bold; font-size: 13px;">
                        <option value="true" ${estaActivo ? 'selected' : ''} style="color: #00e676;">Activo</option>
                        <option value="false" ${!estaActivo ? 'selected' : ''} style="color: #ff3366;">Inhabilitado</option>
                    </select>
                </td>
            `;
            tbody.appendChild(fila);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color: #ff3366; text-align: center;">Error de sincronización: ${err.message}</td></tr>`;
    }
}

// Cambiar Fecha de Caducidad
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

// Activar o Inhabilitar usuario
async function cambiarEstadoUsuario(perfilId, nuevoEstado) {
    const valorBooleano = (nuevoEstado === "true");
    try {
        const { error } = await window._supabase
            .from('perfiles')
            .update({ activo: valorBooleano })
            .eq('id', perfilId);

        if (error) throw error;
        alert(`Estado actualizado con éxito.`);
        cargarUsuariosDeLaSuite();
    } catch (err) {
        alert("Error al cambiar el estado: " + err.message);
        cargarUsuariosDeLaSuite();
    }
}

// Forzar Nueva Contraseña desde el panel (Usa una función RPC en Supabase para no romper la sesión del Admin)
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
        // Ejecuta la función RPC que creaste en Supabase para actualizar passwords desde administración
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

// Crear usuario mediante RPC
document.getElementById('form-crear-usuario').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-ejecutar-registro');
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const rol = document.getElementById('reg-rol').value;
    const fechaVence = document.getElementById('reg-vence').value;

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
            if (fechaVence) {
                const { data: nuevoPerfil } = await window._supabase
                    .from('perfiles')
                    .select('id')
                    .eq('email', email)
                    .single();
                
                if (nuevoPerfil) {
                    await window._supabase
                        .from('perfiles')
                        .update({ suscripcion_vence: fechaVence, activo: true })
                        .eq('id', nuevoPerfil.id);
                }
            }

            alert(`¡Éxito absoluto! Cuenta [${email}] dada de alta.`);
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-pass').value = '';
            document.getElementById('reg-vence').value = '';
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
