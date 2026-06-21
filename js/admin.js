// Reemplaza la función que guarda el usuario en tu admin.html por esta:
document.getElementById('tu-formulario-crear').onsubmit = async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('input-correo-cliente'); // Revisa que coincida con tu ID de HTML
    const passInput = document.getElementById('input-clave-cliente');   // Revisa que coincida con tu ID de HTML
    const rolSelect = document.getElementById('select-rol-cliente');    // Revisa que coincida con tu ID de HTML
    const btnCrear = e.target.querySelector('button');

    const email = emailInput.value.trim();
    const pass = passInput.value;
    const rol = rolSelect.value; // 'vendedor' o 'cliente'

    btnCrear.textContent = "Procesando registro...";
    btnCrear.disabled = true;

    try {
        // 🔥 AQUÍ ESTÁ EL TRUCO: Llamamos a la función RPC. 
        // Esto crea al usuario en la base de datos sin cerrar tu sesión actual.
        const { data, error } = await _supabase.rpc('crear_usuario_desde_admin', {
            p_email: email,
            p_password: pass,
            p_rol: rol
        });

        if (error) throw error;

        if (data.startsWith('ERROR')) {
            alert(data);
        } else {
            alert("¡Usuario creado con éxito! El cliente ya puede iniciar sesión.");
            // Limpiar campos del formulario
            emailInput.value = '';
            passInput.value = '';
            
            // Función opcional si tienes una tabla abajo para refrescar los datos en vivo
            if (typeof cargarUsuariosDeLaSuite === 'function') {
                cargarUsuariosDeLaSuite();
            }
        }

    } catch (err) {
        console.error("Error al crear usuario:", err);
        alert("No se pudo crear la cuenta: " + err.message);
    } finally {
        btnCrear.textContent = "Crear Cuenta";
        btnCrear.disabled = false;
    }
};
