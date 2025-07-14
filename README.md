# 🌐 TrustFundChain

**TrustFundChain** es una plataforma descentralizada desarrollada sobre **Stellar** y **Soroban**, que busca resolver dos grandes desafíos sociales:

1. 💳 Brindar **identidad digital auto-soberana** a personas sin documentación formal.
2. 📊 Garantizar **transparencia y trazabilidad** en la distribución de fondos sociales mediante contratos inteligentes.

---

## ✨ ¿Qué es?

TrustFundChain permite a personas sin cédula o pasaporte crear una **identidad digital única y segura**, para luego acceder a beneficios como:

- Donaciones humanitarias
- Becas educativas
- Microcréditos comunitarios

Por otro lado, permite que **organizaciones sociales, ONGs y donantes** verifiquen públicamente cómo se distribuyen los fondos, generando confianza, trazabilidad y rendición de cuentas.

---

## 🧩 ¿Para qué y por qué?

### 🔐 Para quienes no tienen documentos:
- Obtener una identidad digital validada
- Vincular esa identidad a ayudas sociales verificables

### 🤝 Para ONGs y donantes:
- Monitorear el destino real de los fondos
- Automatizar reglas de distribución con contratos inteligentes (Soroban)
- Evitar fraudes o desvíos

---

## 🛠 Tecnologías utilizadas

| Tecnología     | Uso principal                                 |
|----------------|-----------------------------------------------|
| **Stellar SDK**  | Manejo de cuentas, transacciones y wallets   |
| **Soroban**      | Contratos inteligentes para fondos y reglas  |
| **MongoDB**      | Base de datos de usuarios y registros        |
| **Express + Node.js** | API REST para el backend                    |
| **Bootstrap 5**   | Estilos modernos y responsivos del frontend |
| **JWT**          | Autenticación de usuarios                    |
| **Leaflet (futuro)** | Visualización geográfica de ONGs o fondos  |

---

## 🔧 Instalación

### 1. Clona el repositorio

```bash
git clone https://github.com/tu-usuario/trustfundchain.git
cd trustfundchain
2. Backend
bash
Copiar
Editar
cd trustfundchain-backend
npm install
Configura tus variables en .env:

env
Copiar
Editar
PORT=3000
MONGODB_URI=mongodb://localhost:27017/trustfundchain
JWT_SECRET=una_clave_segura
STELLAR_NETWORK=testnet
Inicia el backend:

bash
Copiar
Editar
npm run dev
3. Frontend
Abre el archivo index.html desde la carpeta del frontend (puedes servirlo con Live Server o cualquier servidor estático).

📦 Estructura del proyecto
css
Copiar
Editar
trustfundchain/
├── trustfundchain-backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── .env
│   └── server.js
├── trustfundchain-frontend/
│   ├── index.html
│   ├── styles.css
│   └── main.js
🛡 Seguridad y ética
TrustFundChain respeta la privacidad de las personas no documentadas. Se utilizan técnicas descentralizadas para garantizar que:

La identidad digital es auto-soberana (la controla la persona)

Los datos no son usados sin consentimiento

Los fondos solo se entregan si se cumplen reglas transparentes

🌍 Aplicaciones futuras
Identidades para migrantes y refugiados

Programas de ayuda alimentaria con distribución automática

Programas de reputación para educación informal (certificados descentralizados)

Votaciones comunitarias digitales

👥 Equipo
Desarrollado por:

Carmelo Enrique Meza Meza – Full Stack Developer, Blockchain Enthusiast

🏁 Estado del proyecto
🚧 En desarrollo — buscando validación con ONGs y expandiendo integración con Soroban.

💡 Licencia
Este proyecto es de código abierto bajo la licencia MIT.
Puedes usarlo, modificarlo o contribuir libremente.

📬 Contacto
¿Quieres colaborar o usar TrustFundChain en tu organización?

📧 carmelomeza093@email.com
🔗 linkedin.com/in/carmelomeza
🌐 trustfundchain.org (Próximamente)
