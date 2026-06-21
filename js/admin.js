// js/admin.js

// Escudo de protección: Si no es admin, lo expulsa
async function verificarAccesoAdmin() {
    const { data: { session } } = await window._supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: perfil, error } = await window._supabase
        .from('perfiles')
        .select('rol, email')
        .eq('id', session.user.id)
        .single();

    if (error || !perfil || perfil.rol !== 'admin') {
        alert("ACCESO RECHAZADO: No eres Administrador.");
        window.location.href = 'cliente.html';
    } else {
        document.getElementById('admin-tag').textContent = `Admin: ${perfil.email}`;
        cargarUsuariosDeLaSuite();
    }
}

// Renderizar la tabla de usuarios registrados
async function cargarUsuariosDeLaSuite() {
    const tbody = document.getElementById('tabla-usuarios-body');
    try {
        const { data: perfiles, error } = await window._supabase
            .from('perfiles')
            .select('email, rol, suscripcion_vence')
            .order('rol', { ascending: true });

        if (error) throw error;

        tbody.innerHTML = '';
        perfiles.forEach(p => {
            const fila = document.createElement('tr');
            const fecha = new Date(p.suscripcion_vence).toLocaleDateString();
            fila.innerHTML = `
                <td>${p.email}</td>
                <td><strong style="color: ${p.rol === 'admin' ? '#00e676' : '#0071e3'}">${p.rol.toUpperCase()}</strong></td>
                <td>${fecha.includes('3000') ? 'Acceso Permanente' : fecha}</td>
            `;
            tbody.appendChild(fila);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="3" style="color: #ff3366;">Error de sincronización: ${err.message}</td></tr>`;
    }
}

// Crear usuario mediante RPC (No cierra sesión del administrador)
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
            alert(`¡Éxito absoluto! Cuenta [${email}] dada de alta como [${rol.toUpperCase()}].`);
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-pass').value = '';
            cargarUsuariosDeLaSuite();
        }
    } catch (err) {
        alert("Error al inyectar registro: " + err.message);
    } finally {
        btn.textContent = "Crear Cuenta";
        btn.disabled = false;
    }
};

// Botón destruir sesión de cookies de Supabase
document.getElementById('btn-cerrar-sesion').onclick = async () => {
    if (confirm("¿Deseas cerrar la sesión administrativa?")) {
        await window._supabase.auth.signOut();
        window.location.href = 'login.html';
    }
};

// Iniciar validación al cargar la vista
verificarAccesoAdmin();
