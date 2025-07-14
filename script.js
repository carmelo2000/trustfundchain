// Verificar que las librerías estén cargadas
document.addEventListener('DOMContentLoaded', function() {
  console.log('Verificando librerías...');
  
  if (typeof html2canvas !== 'undefined') {
    console.log('✅ html2canvas library cargada correctamente');
  } else {
    console.error('❌ html2canvas library no está disponible');
  }
  
  // Función de prueba para html2canvas
  window.testHtml2Canvas = function() {
    const testElement = document.createElement('div');
    testElement.innerHTML = '<h1>Test</h1>';
    testElement.style.background = 'red';
    testElement.style.color = 'white';
    testElement.style.padding = '20px';
    document.body.appendChild(testElement);
    
    html2canvas(testElement).then(canvas => {
      console.log('✅ html2canvas funciona correctamente');
      document.body.removeChild(testElement);
    }).catch(error => {
      console.error('❌ html2canvas no funciona:', error);
      document.body.removeChild(testElement);
    });
  };
  
  // Iniciar simulación de donaciones
  iniciarSimulacionDonaciones();
});

// Simulación de donaciones en tiempo real
function iniciarSimulacionDonaciones() {
  const nombres = [
    "Maria Gonzalez", "Carlos Rodriguez", "Ana Martinez", "Luis Perez", "Sofia Garcia",
    "Diego Lopez", "Valentina Silva", "Andres Torres", "Camila Ruiz", "Miguel Herrera",
    "Isabella Morales", "Javier Castro", "Daniela Vargas", "Roberto Jimenez",
    "Gabriela Mendoza", "Fernando Rojas", "Carmen Vega", "Ricardo Salazar",
    "Patricia Moreno", "Alberto Flores", "Lucia Reyes", "Eduardo Cruz",
    "Natalia Ortiz", "Hector Medina", "Adriana Guzman", "Felipe Navarro",
    "Veronica Paredes", "Oscar Mendoza", "Claudia Rios", "Manuel Acosta"
  ];
  
  const mensajes = [
    "just donated $25",
    "donated $50 for the cause",
    "contributed $100",
    "supported with $75",
    "donated $30 to help",
    "contributed $45",
    "supported with $60",
    "donated $40 to the foundation",
    "contributed $80",
    "supported with $35"
  ];
  
  const cantidades = [25, 30, 35, 40, 45, 50, 60, 75, 80, 100];
  
  // Crear contenedor para las notificaciones
  const notificacionesContainer = document.createElement('div');
  notificacionesContainer.id = 'donaciones-notificaciones';
  notificacionesContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 300px;
    pointer-events: none;
  `;
  document.body.appendChild(notificacionesContainer);
  
  // Función para crear una notificación
  function crearNotificacion() {
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const mensaje = mensajes[Math.floor(Math.random() * mensajes.length)];
    const cantidad = cantidades[Math.floor(Math.random() * cantidades.length)];
    
    const notificacion = document.createElement('div');
    notificacion.className = 'donacion-notificacion';
    notificacion.style.cssText = `
      background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
      font-weight: 500;
      animation: slideInRight 0.5s ease-out;
      border-left: 4px solid #ffffff;
    `;
    
    notificacion.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-heart-fill" style="color: #ff6b6b;"></i>
        <div>
          <strong>${nombre}</strong><br>
          <small>${mensaje}</small>
        </div>
      </div>
    `;
    
    notificacionesContainer.appendChild(notificacion);
    
    // Remover notificación después de 4 segundos
    setTimeout(() => {
      notificacion.style.animation = 'slideOutRight 0.5s ease-in';
      setTimeout(() => {
        if (notificacion.parentNode) {
          notificacion.parentNode.removeChild(notificacion);
        }
      }, 500);
    }, 4000);
  }
  
  // Crear notificaciones cada 3-8 segundos
  function mostrarNotificacionAleatoria() {
    crearNotificacion();
    const tiempoAleatorio = Math.random() * 5000 + 3000; // 3-8 segundos
    setTimeout(mostrarNotificacionAleatoria, tiempoAleatorio);
  }
  
  // Iniciar después de 2 segundos
  setTimeout(mostrarNotificacionAleatoria, 2000);
}

// Agregar estilos CSS para las animaciones
const estilosAnimaciones = document.createElement('style');
estilosAnimaciones.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(estilosAnimaciones);

document.getElementById("identity-form").addEventListener("submit", (e) => {
  e.preventDefault();

  // Obtener datos del formulario
  const nombre = document.getElementById("nombre").value;
  const tipoDoc = document.getElementById("tipo-doc").value;
  const bio = document.getElementById("bio").value;

  // Generar claves
  const clavePublica = "G" + Math.random().toString(36).substring(2, 12).toUpperCase();
  const clavePrivada = "S" + Math.random().toString(36).substring(2, 16).toUpperCase();

  // Obtener fecha actual
  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Llenar el carnet con los datos
  document.getElementById("card-nombre").textContent = nombre;
  document.getElementById("card-documento").textContent = tipoDoc === "ninguno" ? "No especificado" : tipoDoc;
  document.getElementById("card-clave-publica").textContent = clavePublica;
  document.getElementById("card-clave-privada").textContent = clavePrivada;
  document.getElementById("card-bio").textContent = bio || "Sin descripción";
  document.getElementById("card-fecha").textContent = fecha;

  // Generar QR simple
  generarQRSimple(nombre, clavePublica);

  // Mostrar el resultado
  document.getElementById("resultado").classList.remove("d-none");

  // Scroll suave hacia el carnet
  document.getElementById("resultado").scrollIntoView({ 
    behavior: 'smooth',
    block: 'start'
  });
});

// Función simple para generar QR
function generarQRSimple(nombre, clavePublica) {
  try {
    const qrContainer = document.getElementById("qr-code");
    qrContainer.innerHTML = "";
    
    // Crear un QR simple con información básica
    const qrText = `TRUSTFUNDCHAIN\nNombre: ${nombre}\nClave: ${clavePublica}`;
    
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
      // Fallback simple
      qrContainer.innerHTML = '<i class="bi bi-qr-code" style="font-size: 2rem; color: rgba(255,255,255,0.6);"></i>';
    }
  } catch (error) {
    console.error('Error en QR:', error);
    document.getElementById("qr-code").innerHTML = '<i class="bi bi-qr-code" style="font-size: 2rem; color: rgba(255,255,255,0.6);"></i>';
  }
}

// Función alternativa para descargar el carnet
function descargarCarnet() {
  try {
    const card = document.querySelector('.identity-card');
    
    if (!card) {
      alert('No se encontró el carnet para descargar');
      return;
    }
    
    // Mostrar indicador de carga
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generando...';
    btn.disabled = true;
    
    // Verificar que html2canvas esté disponible
    if (typeof html2canvas === 'undefined') {
      alert('Error: La librería de generación de imágenes no está disponible');
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }
    
    // Configuración básica
    const options = {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: true
    };
    
    console.log('Iniciando generación de imagen...');
    
    html2canvas(card, options).then(canvas => {
      console.log('Canvas generado, creando descarga...');
      
      try {
        // Convertir canvas a blob
        canvas.toBlob(function(blob) {
          if (blob) {
            // Crear URL del blob
            const url = URL.createObjectURL(blob);
            
            // Crear link de descarga
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `identidad-digital-${timestamp}.png`;
            link.href = url;
            
            // Descargar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpiar URL
            URL.revokeObjectURL(url);
            
            console.log('Descarga completada');
          } else {
            throw new Error('No se pudo crear el blob');
          }
        }, 'image/png', 1.0);
        
        // Restaurar botón
        btn.innerHTML = originalText;
        btn.disabled = false;
        
      } catch (error) {
        console.error('Error al crear descarga:', error);
        alert('Error al generar la imagen. Intenta de nuevo.');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }).catch(error => {
      console.error('Error en html2canvas:', error);
      alert('Error al generar la imagen. Intenta de nuevo.');
      btn.innerHTML = originalText;
      btn.disabled = false;
    });
    
  } catch (error) {
    console.error('Error general en descarga:', error);
    alert('Error inesperado. Intenta de nuevo.');
    const btn = event.target.closest('button');
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
}

// Función mejorada para imprimir el carnet
function imprimirCarnet() {
  try {
    const card = document.querySelector('.identity-card');
    
    if (!card) {
      alert('No se encontró el carnet para imprimir');
      return;
    }
    
    // Mostrar indicador de carga
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Preparando...';
    btn.disabled = true;
    
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const cardHTML = card.outerHTML;
    const currentDate = new Date().toLocaleString('es-ES');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Identidad Digital - TRUSTFUNDCHAIN</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            background: white;
            font-family: Arial, sans-serif;
          }
          .identity-card { 
            box-shadow: none !important; 
            margin: 0 auto;
            max-width: 400px;
            border: 2px solid #ccc !important;
          }
          @media print {
            body { 
              padding: 0; 
              margin: 0;
            }
            .identity-card { 
              box-shadow: none !important;
              border: 2px solid #000 !important;
            }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="text-center mb-4 no-print">
          <h2 style="color: #1e3a8a; margin-bottom: 10px;">Identidad Digital</h2>
          <p style="color: #64748b; font-size: 14px;">TRUSTFUNDCHAIN - Carnet de Identidad</p>
        </div>
        
        ${cardHTML}
        
        <div class="text-center mt-4 no-print" style="font-size: 12px; color: #666;">
          <p>Este documento es generado automáticamente por TRUSTFUNDCHAIN</p>
          <p>Fecha de impresión: ${currentDate}</p>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Restaurar botón después de un delay
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Error al imprimir:', error);
    alert('Error al preparar la impresión. Intenta de nuevo.');
    const btn = event.target.closest('button');
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
}

// Función para copiar datos de identidad
function copiarIdentidad() {
  const nombre = document.getElementById("card-nombre").textContent;
  const clavePublica = document.getElementById("card-clave-publica").textContent;
  const clavePrivada = document.getElementById("card-clave-privada").textContent;
  const bio = document.getElementById("card-bio").textContent;
  const fecha = document.getElementById("card-fecha").textContent;
  
  const datos = `🔐 IDENTIDAD DIGITAL - TRUSTFUNDCHAIN

👤 Nombre: ${nombre}
🔑 Clave Pública: ${clavePublica}
🔐 Clave Privada: ${clavePrivada}
📝 Descripción: ${bio}
📅 Generado: ${fecha}

---
TRUSTFUNDCHAIN - Construyendo Confianza, Transformando Vidas`;
  
  navigator.clipboard.writeText(datos).then(() => {
    // Mostrar notificación
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-circle"></i> ¡Copiado!';
    btn.classList.remove('btn-warning');
    btn.classList.add('btn-success');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('btn-success');
      btn.classList.add('btn-warning');
    }, 2000);
  }).catch(err => {
    console.error('Error al copiar:', err);
    alert('Error al copiar al portapapeles. Intenta de nuevo.');
  });
}

// Función para actualizar donaciones recientes en el hero
function actualizarDonacionesRecientes() {
  const nombres = [
    "Maria G.", "Carlos R.", "Ana M.", "Luis P.", "Sofia G.",
    "Diego L.", "Valentina S.", "Andres T.", "Camila R.", "Miguel H.",
    "Isabella M.", "Javier C.", "Daniela V.", "Roberto J.",
    "Gabriela M.", "Fernando R.", "Carmen V.", "Ricardo S.",
    "Patricia M.", "Alberto F.", "Lucia R.", "Eduardo C.",
    "Natalia O.", "Hector M.", "Adriana G.", "Felipe N.",
    "Veronica P.", "Oscar M.", "Claudia R.", "Manuel A."
  ];
  
  const cantidades = [25, 30, 35, 40, 45, 50, 60, 75, 80, 100];
  
  const donacionesContainer = document.querySelector('.donaciones-recientes');
  if (!donacionesContainer) return;
  
  // Actualizar cada donación con nuevos datos
  const donaciones = donacionesContainer.querySelectorAll('.donacion-item');
  donaciones.forEach((donacion, index) => {
    setTimeout(() => {
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const cantidad = cantidades[Math.floor(Math.random() * cantidades.length)];
      
      donacion.querySelector('.donador').textContent = nombre;
      donacion.querySelector('.cantidad').textContent = `$${cantidad}`;
      
      // Agregar efecto de actualización
      donacion.style.animation = 'none';
      donacion.offsetHeight; // Trigger reflow
      donacion.style.animation = 'fadeInUp 0.5s ease-out';
    }, index * 2000); // Actualizar cada 2 segundos
  });
}

// Iniciar actualización de donaciones cada 8 segundos
setInterval(actualizarDonacionesRecientes, 8000);

// Función para manejar el formulario de contacto
function handleContactForm(event) {
  event.preventDefault();
  
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const subject = document.getElementById('contact-subject').value;
  const message = document.getElementById('contact-message').value;
  
  if (!name || !email || !subject || !message) {
    alert('Please fill in all fields');
    return;
  }
  
  // Simular envío de formulario
  alert('Thank you for your message! We will get back to you soon.');
  
  // Limpiar formulario
  event.target.reset();
}

// Función para manejar navegación suave
function smoothScroll(target) {
  const element = document.querySelector(target);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// Función para actualizar estadísticas en tiempo real
function updateStats() {
  const stats = [
    { element: '.stat-card:nth-child(1) h3', value: '$2.5M', suffix: '' },
    { element: '.stat-card:nth-child(2) h3', value: '15K+', suffix: '' },
    { element: '.stat-card:nth-child(3) h3', value: '98%', suffix: '' },
    { element: '.stat-card:nth-child(4) h3', value: '500+', suffix: '' }
  ];
  
  stats.forEach(stat => {
    const element = document.querySelector(stat.element);
    if (element) {
      element.textContent = stat.value + stat.suffix;
    }
  });
}

// Inicializar funcionalidades cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Manejar formulario de contacto
  const contactForm = document.querySelector('#contact form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactForm);
  }
  
  // Actualizar estadísticas
  updateStats();
  
  // Agregar navegación suave a los enlaces del navbar
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        smoothScroll(href);
      }
    });
  });
});
