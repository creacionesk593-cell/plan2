// js/login.js

document.getElementById('form-login').onsubmit = async (e) => {
    e.preventDefault(); 

    const emailBox = document.getElementById('login-email');
    const passBox = document.getElementById('login-pass');
    const errorBox = document.getElementById('error-message');
    const btnSubmit = document.getElementById('btn-submit');

    errorBox.style.display = "none";
    errorBox.textContent = "";

    const email = emailBox.value.trim();
    const password = passBox.value;

    btnSubmit.textContent = "Validando Credenciales...";
    btnSubmit.disabled = true;

    try {
        // 1. Loguearse en Supabase Auth
        const { data: authData, error: authError } = await window._supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // 2. Traer el perfil con tus columnas reales
        const { data: perfilData, error: perfilError } = await window._supabase
            .from('perfiles')
            .select('rol, plan_activo')
            .eq('id', authData.user.id)
            .single();

        if (perfilError) {
            throw new Error("No se encontró tu configuración de perfil en la base de datos.");
        }
        
        // Validación basada en tus opciones reales de Supabase
        if (!perfilData.plan_activo) {
            throw new Error("Tu cuenta no tiene un plan activo asignado o está vencida.");
        }

        const userRol = perfilData.rol;
        alert("¡Acceso concedido como: " + userRol.toUpperCase() + "!");

        // Redirección inteligente exacta
        if (userRol === 'admin') {
            window.location.href = 'admin.html';
        } else if (userRol === 'vendedor') {
            window.location.href = 'vendedor.html';
        } else {
            window.location.href = 'cliente.html';
        }

    } catch (err) {
        console.error(err);
        errorBox.textContent = err.message || "Error de credenciales o conexión.";
        errorBox.style.display = "block";
        btnSubmit.textContent = "Ingresar al Sistema";
        btnSubmit.disabled = false;
        
        // Si falla, se desloguea para no arrastrar sesiones rotas
        await window._supabase.auth.signOut();
    }
};

// Función para el enlace "¿Olvidaste tu contraseña?"
async function recuperarPasswordSoporte() {
    const email = prompt("Ingresa tu correo electrónico registrado para enviarte un enlace de restablecimiento:");
    if (!email) return;

    try {
        const { error } = await window._supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin + '/plan2/login.html',
        });

        if (error) throw error;
        alert("Se ha enviado un correo seguro a tu bandeja de entrada para cambiar la contraseña.");
    } catch (err) {
        alert("Error al procesar la solicitud: " + err.message);
    }
}

window.recuperarPasswordSoporte = recuperarPasswordSoporte;
