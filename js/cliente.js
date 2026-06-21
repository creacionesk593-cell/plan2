// js/cliente.js

async function verificarSesionSuite() {
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

    // Bloqueo inmediato si no tiene plan activo asignado
    if (error || !perfil || !perfil.plan_activo) {
        alert("Acceso denegado: Tu plan ha expirado o tu cuenta fue inhabilitada.");
        await window._supabase.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    // Coloca el correo del usuario en la barra superior de la interfaz
    const userTag = document.getElementById('user-tag');
    if (userTag) userTag.textContent = perfil.email;

    // Si es admin, le dejamos visible el botón para saltar al panel de control
    if (perfil.rol === 'admin') {
        const btnAdmin = document.getElementById('btn-nav-admin');
        if (btnAdmin) btnAdmin.style.display = 'inline-block';
    }
}

function cambiarModulo(numeroModulo) {
    document.getElementById('btn-tab1').classList.toggle('active', numeroModulo === 1);
    document.getElementById('btn-tab2').classList.toggle('active', numeroModulo === 2);
    
    document.getElementById('modulo-app1').classList.toggle('active', numeroModulo === 1);
    document.getElementById('modulo-app2').classList.toggle('active', numeroModulo === 2);
    
    const nuevaURL = window.location.pathname + (numeroModulo === 2 ? '?app=2' : '');
    window.history.pushState({}, '', nuevaURL);
}

function actualizarArchivo(appNum) {
    const fileInput = document.getElementById(`file-app${appNum}`);
    const txtDisplay = document.getElementById(`txt-file${appNum}`);
    const btnExecute = document.getElementById(`btn-run${appNum}`);
    const statusBar = document.getElementById(`status${appNum}`);

    if (fileInput.files.length > 0) {
        const nombreArchivo = fileInput.files[0].name;
        txtDisplay.innerHTML = `✅ <strong>Archivo cargado:</strong> ${nombreArchivo}`;
        
        btnExecute.disabled = false;
        btnExecute.classList.add('ready');
        statusBar.textContent = "Módulo listo. Presiona el botón verde para iniciar el procesamiento.";
    }
}

document.getElementById('btn-cerrar-sesion').onclick = async () => {
    if (confirm("¿Seguro que deseas salir de TuBingo Pro Suite?")) {
        await window._supabase.auth.signOut();
        window.location.href = 'login.html';
    }
};

window.onload = () => {
    verificarSesionSuite();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('app') === '2') {
        cambiarModulo(2);
    }
};
