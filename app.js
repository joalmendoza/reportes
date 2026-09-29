// Capturador preventivo de errores para la depuración en vivo
window.onerror = function(message, source, lineno) {
  alert("Error lógico detectado: " + message + "\nLínea: " + lineno);
  return false;
};

const firebaseConfig = {
  apiKey: "AIzaSyAWSDgj6gQjGyOYblCIBXKC15s7Y7qnnsA",
  authDomain: "://firebaseapp.com",
  projectId: "appformatosmtto",
  storageBucket: "appformatosmtto.firebasestorage.app",
  messagingSenderId: "729388358915",
  appId: "1:729388358915:web:d6db0be41af4e60a5c5d36"
};

// Validación asíncrona robusta del núcleo de Firebase
if (typeof firebase === 'undefined') {
  alert("Error crítico: No se pudo enlazar el script base de Firebase. Revisa tus archivos o conexión.");
} else {
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  if (window.emailjs) {
    emailjs.init("l_6FNZetkO_cSgx5A");
  }

  let padTech, padAdmin;
  let urlParams = new URLSearchParams(window.location.search);
  let modoAprobar = urlParams.get('mode') === 'aprobar';

  document.addEventListener("DOMContentLoaded", () => {
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-form-screen');
    const loginForm = document.getElementById('login-form');
    const errorDiv = document.getElementById('error-message');
    const userDisplay = document.getElementById('user-display');
    const btnLogout = document.getElementById('btn-logout');
    const btnSubmit = document.getElementById('btn-submit-main');
    
    const canvasTech = document.getElementById('signature-tech');
    const canvasAdmin = document.getElementById('signature-admin');
    const imgTechSig = document.getElementById('img-tech-sig');
    const clientInput = document.getElementById('client-name');
    const workInput = document.getElementById('work-description');

    function resizeCanvas(canvas, pad) {
      if (!canvas || canvas.classList.contains('hidden')) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      if (pad) pad.clear();
    }

    // GESTIÓN DE ROLES (ADMINISTRADOR DESDE LINK DE WHATSAPP / TÉCNICO NORMAL)
    if (modoAprobar) {
      loginScreen.classList.add('hidden');
      mainScreen.classList.remove('hidden');
      btnLogout.classList.add('hidden');
      
      document.getElementById('view-badge').innerText = "Modo Aprobación";
      document.getElementById('view-badge').style.background = "#dcfce7";
      document.getElementById('view-badge').style.color = "#15803d";
      document.getElementById('view-title').innerText = "Aprobación de Formato";
      userDisplay.innerText = "Administrador";

      clientInput.value = urlParams.get('cliente') || '';
      workInput.value = urlParams.get('detalle') || '';
      clientInput.disabled = true;
      workInput.disabled = true;

      canvasTech.classList.add('hidden');
      document.getElementById('btn-clear-tech').classList.add('hidden');
      imgTechSig.classList.remove('hidden');
      imgTechSig.src = urlParams.get('techSig') || '';

      document.getElementById('block-admin-sig').classList.remove('hidden');
      btnSubmit.innerText = "Firmar y Enviar PDF";
      btnSubmit.style.background = "#2563eb";

      if (window.SignaturePad) {
        padAdmin = new SignaturePad(canvasAdmin, { backgroundColor: 'rgba(0,0,0,0)', penColor: 'rgb(220, 38, 38)' });
        setTimeout(() => resizeCanvas(canvasAdmin, padAdmin), 300);
      }
    } else {
      auth.onAuthStateChanged((user) => {
        if (user) {
          loginScreen.classList.add('hidden');
          mainScreen.classList.remove('hidden');
          userDisplay.innerText = user.email;
          errorDiv.innerText = "";
          
          if (!padTech && canvasTech && window.SignaturePad) {
            padTech = new SignaturePad(canvasTech, { backgroundColor: 'rgba(0,0,0,0)', penColor: 'rgb(0, 0, 128)' });
            setTimeout(() => resizeCanvas(canvasTech, padTech), 300);
          }
        } else {
          mainScreen.classList.add('hidden');
          loginScreen.classList.remove('hidden');
        }
      });
    }

    // MANEJO FORMULARIO INICIO SESIÓN
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      auth.signInWithEmailAndPassword(document.getElementById('email').value.trim().toLowerCase(), document.getElementById('password').value)
        .catch(() => errorDiv.innerText = "Error: Credenciales incorrectas.");
    });

    document.getElementById('btn-clear-tech').addEventListener('click', () => padTech && padTech.clear());
    document.getElementById('btn-clear-admin').addEventListener('click', () => padAdmin && padAdmin.clear());

    // EJECUCIÓN CENTRALIZADA DE ENVÍOS
    btnSubmit.addEventListener('click', async () => {
      if (!modoAprobar) {
        if (!padTech || padTech.isEmpty()) { alert("Por favor, estampe su firma."); return; }
        const base64TechSig = encodeURIComponent(padTech.toDataURL());
        const link = `${window.location.origin}${window.location.pathname}?mode=aprobar&cliente=${encodeURIComponent(clientInput.value)}&detalle=${encodeURIComponent(workInput.value)}&techSig=${base64TechSig}`;
        window.open(`https://wa.me REPORTE*%0ACliente: ${clientInput.value}%0AEnlace de aprobación: ${link}`, '_blank');
      } else {
        if (!padAdmin || padAdmin.isEmpty()) { alert("Falta tu firma administrador."); return; }
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Enviando...";
        try {
          const pdfBase64 = await html2pdf().set({ margin: 10, filename: 'Reporte.pdf' }).from(document.getElementById('pdf-area')).outputPdf('datauristring');
          await emailjs.send("service_m3xvu2j", "template_loi9vam", { cliente: urlParams.get('cliente'), detalle: urlParams.get('detalle'), content_pdf: pdfBase64 });
          alert("¡Reporte enviado con éxito por EmailJS!");
          window.location.href = window.location.origin + window.location.pathname;
        } catch (err) {
          alert("Error: " + err.message);
          btnSubmit.disabled = false;
        }
      }
    });

    btnLogout.addEventListener('click', () => auth.signOut());
  });
}
