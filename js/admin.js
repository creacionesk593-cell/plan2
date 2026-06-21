// Renderizar la tabla usando tus columnas reales: plan_activo y suscripcion_vence
async function cargarUsuariosDeLaSuite() {
    const tbody = document.getElementById('tabla-usuarios-body');
    try {
        const { data: perfiles, error } = await window._supabase
            .from('perfiles')
            .select('id, email, rol, suscripcion_vence, plan_activo')
            .order('rol', { ascending: true });

        if (error) throw error;

        tbody.innerHTML = '';
        perfiles.forEach(p => {
            const fila = document.createElement('tr');
            
            let fechaFormateada = "";
            if (p.suscripcion_vence) {
                fechaFormateada = p.suscripcion_vence.split('T')[0];
            }

            // Validamos si está inhabilitado o activo
            const estaActivo = p.plan_activo !== 'inhabilitado'; 

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
                        <option value="vitalicio" ${p.plan_activo === 'vitalicio' ? 'selected' : ''} style="color: #00e676;">Vitalicio / Activo</option>
                        <option value="mensual" ${p.plan_activo === 'mensual' ? 'selected' : ''} style="color: #0071e3;">Mensual</option>
                        <option value="inhabilitado" ${p.plan_activo === 'inhabilitado' ? 'selected' : ''} style="color: #ff3366;">Inhabilitado</option>
                    </select>
                </td>
            `;
            tbody.appendChild(fila);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color: #ff3366; text-align: center;">Error de sincronización: ${err.message}</td></tr>`;
    }
}

// Cambiar el valor de plan_activo en la base de datos
async function cambiarEstadoUsuario(perfilId, nuevoEstado) {
    try {
        const { error } = await window._supabase
            .from('perfiles')
            .update({ plan_activo: nuevoEstado })
            .eq('id', perfilId);

        if (error) throw error;
        alert(`Estado del plan actualizado a [${nuevoEstado.toUpperCase()}] con éxito.`);
        cargarUsuariosDeLaSuite();
    } catch (err) {
        alert("Error al cambiar el estado del plan: " + err.message);
        cargarUsuariosDeLaSuite();
    }
}

window.cambiarEstadoUsuario = cambiarEstadoUsuario;
