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
        // Usa la conexión global window._supabase
        const { data: authData, error: authError } = await window._supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Obtener el rol del usuario desde la tabla perfiles
        const { data: perfilData, error: perfilError } = await window._supabase
            .from('perfiles')
            .select('rol')
            .eq('id', authData.user.id)
            .single();

        if (perfilError) throw new Error("No se encontró tu rol en la tabla de perfiles.");

        const userRol = perfilData.rol;
        alert("¡Acceso concedido como: " + userRol.toUpperCase() + "!");

        // Redirección inteligente
        if (userRol === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'cliente.html';
        }

    } catch (err) {
        console.error(err);
        errorBox.textContent = err.message || "Error de credenciales o conexión.";
        errorBox.style.display = "block";
        btnSubmit.textContent = "Ingresar al Sistema";
        btnSubmit.disabled = false;
    }
};
