// Variables globales
let filteredTransactions = [];
let currentFilter = 'all';
let searchTerm = '';
let totalSlides = 0;
let carouselInterval = null;

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Función para obtener el estado con estilo
function getStatusBadge(status) {
    const statusMap = {
        'completed': '<span class="status-badge status-completed">Completed</span>',
        'processing': '<span class="status-badge status-processing">Processing</span>',
        'pending': '<span class="status-badge status-pending">Pending</span>'
    };
    return statusMap[status] || statusMap['pending'];
}

// Función para renderizar transacciones
function renderTransactions(transactions) {
    const tbody = document.getElementById('transactions-table');
    const mobileContainer = document.getElementById('mobile-transactions');
    const carouselContainer = document.getElementById('carousel-container');
    const carouselDots = document.getElementById('carousel-dots');
    
    if (!tbody) return;

    tbody.innerHTML = '';
    if (mobileContainer) mobileContainer.innerHTML = '';
    if (carouselContainer) carouselContainer.innerHTML = '';
    if (carouselDots) carouselDots.innerHTML = '';

    totalSlides = transactions.length;

    transactions.forEach((transaction, index) => {
        // Renderizar fila de tabla (desktop)
        const row = document.createElement('tr');
        row.className = 'transaction-row';
        row.innerHTML = `
            <td><code>${transaction.id}</code></td>
            <td>${formatDate(transaction.date)}</td>
            <td>
                <div>
                    <strong>${transaction.beneficiary}</strong>
                    <br><small class="text-muted">${transaction.location}</small>
                </div>
            </td>
            <td><strong>$${transaction.amount.toLocaleString()}</strong></td>
            <td>
                <span class="badge bg-primary">${transaction.category}</span>
            </td>
            <td>${transaction.purpose}</td>
            <td>${getStatusBadge(transaction.status)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewTransaction('${transaction.id}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="viewBlockchain('${transaction.id}')">
                    <i class="bi bi-link-45deg"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);

        // Renderizar card móvil
        if (mobileContainer) {
            const card = document.createElement('div');
            card.className = `transaction-card-simple ${transaction.status}`;
            card.innerHTML = `
                <div class="transaction-avatar">
                    ${transaction.beneficiary.charAt(0).toUpperCase()}
                </div>
                <div class="transaction-title">${transaction.beneficiary}</div>
                <div class="transaction-subtitle">${transaction.location}</div>
                <div class="transaction-amount-simple">$${transaction.amount.toLocaleString()}</div>
                <div class="transaction-status-simple ${transaction.status}">
                    ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </div>
                <button class="btn btn-primary" onclick="showTransactionDetails('${transaction.id}')">
                    <i class="bi bi-eye me-2"></i>Ver Detalles
                </button>
            `;
            mobileContainer.appendChild(card);
        }

        // Renderizar slide del carrusel
        if (carouselContainer) {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.innerHTML = `
                <div class="transaction-card-simple ${transaction.status}">
                    <div class="transaction-avatar">
                        ${transaction.beneficiary.charAt(0).toUpperCase()}
                    </div>
                    <div class="transaction-title">${transaction.beneficiary}</div>
                    <div class="transaction-subtitle">${transaction.location}</div>
                    <div class="transaction-amount-simple">$${transaction.amount.toLocaleString()}</div>
                    <div class="transaction-status-simple ${transaction.status}">
                        ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </div>
                    <button class="btn btn-primary" onclick="showTransactionDetails('${transaction.id}')">
                        <i class="bi bi-eye me-2"></i>Ver Detalles
                    </button>
                </div>
            `;
            carouselContainer.appendChild(slide);
        }

        // Renderizar dots del carrusel
        if (carouselDots) {
            const dot = document.createElement('div');
            dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(index);
            carouselDots.appendChild(dot);
        }
    });

    // Actualizar contador
    updateTransactionCount();
}

// Función para filtrar transacciones
async function filterTransactions(filter) {
    currentFilter = filter;
    await applyFilters();
}

// Función para buscar transacciones
async function searchTransactions(term) {
    searchTerm = term.toLowerCase();
    await applyFilters();
}

// Función para aplicar filtros y búsqueda
async function applyFilters() {
    try {
        const response = await fetch(`http://localhost:3000/api/transparency/transactions?filter=${currentFilter}&search=${searchTerm}`);
        const result = await response.json();
        if (result.success) {
            filteredTransactions = result.data;
            renderTransactions(filteredTransactions);
        } else {
            console.error('Error al obtener transacciones:', result.error);
        }
    } catch (error) {
        console.error('Error al aplicar filtros:', error);
    }
}

// Función para actualizar contador de transacciones
function updateTransactionCount() {
    const countElement = document.querySelector('.table-header .badge');
    if (countElement) {
        countElement.textContent = `${filteredTransactions.length} transactions`;
    }
}

// Función para ver detalles de transacción
function viewTransaction(transactionId) {
    const transaction = filteredTransactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const modal = document.getElementById('transaction-modal');
    const modalInfo = document.getElementById('modal-info');
    
    modalInfo.innerHTML = `
        <div class="info-row">
            <span class="info-label">Transaction ID:</span>
            <span class="info-value"><code>${transaction.id}</code></span>
        </div>
        <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${formatDate(transaction.date)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Beneficiary:</span>
            <span class="info-value">${transaction.beneficiary}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Location:</span>
            <span class="info-value">${transaction.location}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Amount:</span>
            <span class="info-value">$${transaction.amount.toLocaleString()}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Category:</span>
            <span class="info-value">${transaction.category}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Purpose:</span>
            <span class="info-value">${transaction.purpose}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">${getStatusBadge(transaction.status)}</span>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Función para ver en blockchain
function viewBlockchain(transactionId) {
    alert(`Opening blockchain explorer for transaction ${transactionId}...\n\nThis would open the actual blockchain explorer in a real implementation.`);
}

// Función para actualizar estadísticas en tiempo real
async function updateStats() {
    try {
        const response = await fetch('http://localhost:3000/api/transparency/stats');
        const result = await response.json();
        if (result.success) {
            const stats = result.data;
            document.getElementById('total-raised').textContent = `$${stats.totalRaised.toLocaleString()}`;
            document.getElementById('total-beneficiaries').textContent = stats.totalBeneficiaries.toLocaleString();
            document.getElementById('transparency-score').textContent = `${stats.transparencyScore}%`;
        }
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
    }
}

// Función para actualizar timestamp
function updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = timeString;
    }
}

// Función para cambiar slide del carrusel
function changeSlide(direction) {
    const newSlide = currentSlide + direction;
    if (newSlide >= 0 && newSlide < totalSlides) {
        goToSlide(newSlide);
    }
}

// Función para ir a un slide específico
function goToSlide(slideIndex) {
    const container = document.getElementById('carousel-container');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (container && dots.length > 0) {
        currentSlide = slideIndex;
        container.style.transform = `translateX(-${slideIndex * 100}%)`;
        
        // Actualizar dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === slideIndex);
        });
        // Reiniciar el intervalo automático
        startCarouselAutoSlide();
    }
}

// Función para iniciar el auto-carrusel
function startCarouselAutoSlide() {
    // Limpiar si ya existe
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        const container = document.getElementById('carousel-container');
        if (!container) return;
        const slides = container.children.length;
        if (slides === 0) return;
        let nextSlide = currentSlide + 1;
        if (nextSlide >= slides) nextSlide = 0;
        goToSlide(nextSlide);
    }, 4000); // 4 segundos
}

// Función para mostrar detalles de transacción en modal
function showTransactionDetails(transactionId) {
    const transaction = filteredTransactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const modal = document.getElementById('transaction-modal');
    const modalInfo = document.getElementById('modal-info');
    
    modalInfo.innerHTML = `
        <div class="info-row">
            <span class="info-label">Transaction ID:</span>
            <span class="info-value"><code>${transaction.id}</code></span>
        </div>
        <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${formatDate(transaction.date)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Beneficiary:</span>
            <span class="info-value">${transaction.beneficiary}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Location:</span>
            <span class="info-value">${transaction.location}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Amount:</span>
            <span class="info-value">$${transaction.amount.toLocaleString()}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Category:</span>
            <span class="info-value">${transaction.category}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Purpose:</span>
            <span class="info-value">${transaction.purpose}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">${getStatusBadge(transaction.status)}</span>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Función para cerrar modal
function closeModal() {
    const modal = document.getElementById('transaction-modal');
    modal.style.display = 'none';
}

// Agregar evento para cerrar modal al hacer clic fuera
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('transaction-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Agregar evento de tecla ESC para cerrar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar transacciones desde el backend
    await applyFilters();
    await updateStats();
    
    // Configurar búsqueda
    const searchInput = document.getElementById('search-transactions');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTransactions(e.target.value);
        });
    }
    
    // Configurar filtros
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            filterTransactions(e.target.dataset.filter);
        });
    });
    
    // Actualizar timestamp cada segundo
    setInterval(updateTimestamp, 1000);
    
    // Iniciar auto-carrusel
    startCarouselAutoSlide();
});
