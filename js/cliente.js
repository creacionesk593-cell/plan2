// js/cliente.js

// 1. ESCUDO DE CONTROL DE ACCESO INTERNO Y ROL SUPREMO
async function verificarSesionSuite() {
    const { data: { session } } = await window._supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Validar rol en la base de datos pública
    const { data: perfil, error } = await window._supabase
        .from('perfiles')
        .select('rol, email')
        .eq('id', session.user.id)
        .single();

    if (error || !perfil) {
        document.getElementById('user-tag').textContent = session.user.email;
        return;
    }

    // Pintar la cuenta en la barra superior
    document.getElementById('user-tag').textContent = perfil.email;

    // Se enciende el botón de administrador si tienes el rango correcto
    if (perfil.rol === 'admin') {
        document.getElementById('btn-nav-admin').style.display = 'inline-block';
    }
}

// 2. CONMUTADOR DE PESTAÑAS (APP 1 / APP 2) SIN RECARGA
function cambiarModulo(numeroModulo) {
    document.getElementById('btn-tab1').classList.toggle('active', numeroModulo === 1);
    document.getElementById('btn-tab2').classList.toggle('active', numeroModulo === 2);
    
    document.getElementById('modulo-app1').classList.toggle('active', numeroModulo === 1);
    document.getElementById('modulo-app2').classList.toggle('active', numeroModulo === 2);
    
    const nuevaURL = window.location.pathname + (numeroModulo === 2 ? '?app=2' : '');
    window.history.pushState({}, '', nuevaURL);
}

// 3. ACTUALIZACIÓN VISIBLE AL CARGAR ARCHIVOS
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

// 4. SISTEMA DE CIERRE DE SESIÓN SEGURO
document.getElementById('btn-cerrar-sesion').onclick = async () => {
    if (confirm("¿Seguro que deseas salir de TuBingo Pro Suite?")) {
        await window._supabase.auth.signOut();
        window.location.href = 'login.html';
    }
};

// 5. COMPROBACIÓN INICIAL AL ENTRAR A LA PÁGINA
window.onload = () => {
    verificarSesionSuite();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('app') === '2') {
        cambiarModulo(2);
    }
};
