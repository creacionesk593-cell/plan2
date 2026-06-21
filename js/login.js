// js/login.js

// Lógica de inicio de sesión estándar
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
        const { data: authData, error: authError } = await window._supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Comprobar rol y si el usuario está activo
        const { data: perfilData, error: perfilError } = await window._supabase
            .from('perfiles')
            .select('rol, activo')
            .eq('id', authData.user.id)
            .single();

        if (perfilError) throw new Error("No se encontró tu perfil en la base de datos.");
        
        if (perfilData.activo === false) {
            throw new Error("Esta cuenta ha sido inhabilitada temporal o permanentemente.");
        }

        const userRol = perfilData.rol;
        alert("¡Acceso concedido como: " + userRol.toUpperCase() + "!");

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
        // Si fue un bloqueo por inhabilitado, destruimos la cookie de auth
        await window._supabase.auth.signOut();
    }
};

// Función para el enlace "¿Olvidaste tu contraseña?"
async function recuperarPasswordSoporte() {
    const email = prompt("Ingresa tu correo electrónico registrado para enviarte un enlace de restablecimiento:");
    if (!email) return;

    try {
        const { error } = await window._supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin + '/plan2/login.html', // Ruta exacta a tu GitHub Pages
        });

        if (error) throw error;
        alert("Se ha enviado un correo seguro a tu bandeja de entrada para cambiar la contraseña.");
    } catch (err) {
        alert("Error al procesar la solicitud: " + err.message);
    }
}

// Hacemos la función pública para que el enlace HTML la llame
window.recuperarPasswordSoporte = recuperarPasswordSoporte;
