// Digital Identity Logic for identity.html

// Variable para almacenar la foto de perfil
let profilePhoto = null;

// Mostrar campos adicionales según el tipo de documento
const tipoDocSelect = document.getElementById("tipo-doc");
const docAdicionalDiv = document.getElementById("documento-adicional");

tipoDocSelect.addEventListener("change", function() {
  const tipo = this.value;
  let html = "";
  if (tipo === "ci" || tipo === "nid") {
    html = `<label for='numero-ci' class='form-label'>ID Number</label>
            <input type='text' class='form-control' id='numero-ci' required>`;
  } else if (tipo === "licencia") {
    html = `<label for='numero-licencia' class='form-label'>Driver’s License Number</label>
            <input type='text' class='form-control mb-2' id='numero-licencia' required>
            <label for='pais-licencia' class='form-label'>Country/State of Issue</label>
            <input type='text' class='form-control' id='pais-licencia' required>`;
  } else if (tipo === "residencia") {
    html = `<label for='numero-residencia' class='form-label'>Residence Permit Number</label>
            <input type='text' class='form-control mb-2' id='numero-residencia' required>
            <label for='pais-residencia' class='form-label'>Country of Issue</label>
            <input type='text' class='form-control' id='pais-residencia' required>`;
  } else if (tipo === "estudiante") {
    html = `<label for='numero-estudiante' class='form-label'>Student ID Number</label>
            <input type='text' class='form-control mb-2' id='numero-estudiante' required>
            <label for='institucion-estudiante' class='form-label'>Institution</label>
            <input type='text' class='form-control' id='institucion-estudiante' required>`;
  } else if (tipo === "militar") {
    html = `<label for='numero-militar' class='form-label'>Military ID Number</label>
            <input type='text' class='form-control mb-2' id='numero-militar' required>
            <label for='pais-militar' class='form-label'>Country of Issue</label>
            <input type='text' class='form-control' id='pais-militar' required>`;
  } else if (tipo === "trabajo") {
    html = `<label for='numero-trabajo' class='form-label'>Work Permit Number</label>
            <input type='text' class='form-control mb-2' id='numero-trabajo' required>
            <label for='pais-trabajo' class='form-label'>Country of Issue</label>
            <input type='text' class='form-control' id='pais-trabajo' required>`;
  } else if (tipo === "nacimiento") {
    html = `<label for='numero-nacimiento' class='form-label'>Birth Certificate Number</label>
            <input type='text' class='form-control mb-2' id='numero-nacimiento' required>
            <label for='lugar-nacimiento' class='form-label'>Place of Birth</label>
            <input type='text' class='form-control' id='lugar-nacimiento' required>`;
  } else if (tipo === "pasaporte") {
    html = `<label for='numero-pasaporte' class='form-label'>Passport Number</label>
            <input type='text' class='form-control mb-2' id='numero-pasaporte' required>
            <label for='pais-emision' class='form-label'>Country of Issue</label>
            <input type='text' class='form-control' id='pais-emision' required>`;
  }
  docAdicionalDiv.innerHTML = html;
});

// Inicializar por si acaso
if (tipoDocSelect.value !== "ninguno") {
  tipoDocSelect.dispatchEvent(new Event('change'));
}

// Manejar la subida de foto de perfil
document.getElementById("foto-perfil").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (file) {
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Verificar el tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      profilePhoto = e.target.result;
      // Actualizar la previsualización si el carnet ya está generado
      updateProfilePhoto();
    };
    reader.readAsDataURL(file);
  }
});

// Función para actualizar la foto de perfil en el carnet
function updateProfilePhoto() {
  const photoPlaceholder = document.querySelector('.photo-placeholder');
  if (photoPlaceholder && profilePhoto) {
    photoPlaceholder.innerHTML = `<img src="${profilePhoto}" alt="Profile Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
  }
}

document.getElementById("identity-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Obtener datos del formulario
  const nombre = document.getElementById("nombre").value;
  const tipoDoc = document.getElementById("tipo-doc").value;
  const bio = document.getElementById("bio").value;

  // Obtener datos adicionales
  let docInfo = "";
  if (tipoDoc === "ci" || tipoDoc === "nid") {
    const numeroCI = document.getElementById("numero-ci")?.value || "";
    docInfo = `${tipoDoc === "ci" ? "ID Card" : "National ID"}: ${numeroCI}`;
  } else if (tipoDoc === "licencia") {
    const numero = document.getElementById("numero-licencia")?.value || "";
    const pais = document.getElementById("pais-licencia")?.value || "";
    docInfo = `Driver’s License: ${numero} (${pais})`;
  } else if (tipoDoc === "residencia") {
    const numero = document.getElementById("numero-residencia")?.value || "";
    const pais = document.getElementById("pais-residencia")?.value || "";
    docInfo = `Residence Permit: ${numero} (${pais})`;
  } else if (tipoDoc === "estudiante") {
    const numero = document.getElementById("numero-estudiante")?.value || "";
    const inst = document.getElementById("institucion-estudiante")?.value || "";
    docInfo = `Student ID: ${numero} (${inst})`;
  } else if (tipoDoc === "militar") {
    const numero = document.getElementById("numero-militar")?.value || "";
    const pais = document.getElementById("pais-militar")?.value || "";
    docInfo = `Military ID: ${numero} (${pais})`;
  } else if (tipoDoc === "trabajo") {
    const numero = document.getElementById("numero-trabajo")?.value || "";
    const pais = document.getElementById("pais-trabajo")?.value || "";
    docInfo = `Work Permit: ${numero} (${pais})`;
  } else if (tipoDoc === "nacimiento") {
    const numero = document.getElementById("numero-nacimiento")?.value || "";
    const lugar = document.getElementById("lugar-nacimiento")?.value || "";
    docInfo = `Birth Certificate: ${numero} (${lugar})`;
  } else if (tipoDoc === "pasaporte") {
    const numeroPasaporte = document.getElementById("numero-pasaporte")?.value || "";
    const paisEmision = document.getElementById("pais-emision")?.value || "";
    docInfo = `Passport: ${numeroPasaporte} (${paisEmision})`;
  } else {
    docInfo = "Not specified";
  }

  // Enviar datos al backend
  try {
    const response = await fetch('http://127.0.0.1:3000/api/identity/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre,
        tipoDoc,
        bio,
        documents: [{
          type: tipoDoc,
          number: docInfo
        }],
        profilePhoto
      })
    });

    const result = await response.json();
    if (result.success) {
      // Llenar tarjeta con datos
      document.getElementById("card-nombre").textContent = nombre;
      document.getElementById("card-documento").textContent = docInfo;
      document.getElementById("card-clave-publica").textContent = result.data.publicKey;
      document.getElementById("card-clave-privada").textContent = result.data.secretKey;
      document.getElementById("card-bio").textContent = bio || "No description";
      document.getElementById("card-fecha").textContent = new Date().toLocaleDateString();

      // Generar QR
      generarQRSimple(nombre, result.data.publicKey);

      // Mostrar resultado
      document.getElementById("resultado").classList.remove("d-none");
      document.getElementById("resultado").scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Actualizar la foto de perfil si existe
      updateProfilePhoto();
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    console.error('Error al crear identidad:', error);
    alert('Error al crear identidad. Intenta nuevamente.');
  }
});

function generarQRSimple(nombre, clavePublica) {
  try {
    const qrContainer = document.getElementById("qr-code");
    qrContainer.innerHTML = "";
    const qrText = `TRUSTFUNDCHAIN\nName: ${nombre}\nKey: ${clavePublica}`;
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: qrText,
        width: 80,
        height: 80,
        colorDark: "#1e3a8a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      setTimeout(() => {
        const canvas = qrContainer.querySelector('canvas');
        if (canvas) {
          canvas.style.borderRadius = '8px';
          canvas.style.border = '2px solid rgba(255,255,255,0.3)';
          canvas.style.padding = '5px';
          canvas.style.background = 'white';
        }
      }, 200);
    } else {
      qrContainer.innerHTML = '<i class="bi bi-qr-code" style="font-size: 2rem; color: rgba(255,255,255,0.6);"></i>';
    }
  } catch (error) {
    console.error('QR error:', error);
    document.getElementById("qr-code").innerHTML = '<i class="bi bi-qr-code" style="font-size: 2rem; color: rgba(255,255,255,0.6);"></i>';
  }
}

// Funciones para descargar, imprimir y copiar datos
// (Mantener las funciones de descargarCarnet, imprimirCarnet y copiarIdentidad como están)
