// ===== ELEMENTOS DEL DOM =====
const dia1Input = document.getElementById('dia1');
const calcularBtn = document.getElementById('calcular-btn');
const exportarBtn = document.getElementById('exportar-btn');
const guardarBtn = document.getElementById('guardar-btn');
const resultsSection = document.getElementById('results-section');
const fechasTbody = document.getElementById('fechas-tbody');
const savedSection = document.getElementById('saved-section');
const savedDatesSelect = document.getElementById('saved-dates-select');
const deleteSavedBtn = document.getElementById('delete-saved-btn');

// ===== DATOS GLOBALES =====
let fechasCalculadas = [];

// ===== FUNCIONES DE UTILIDAD =====

/**
 * Obtiene el nombre del día de la semana en español
 */
function obtenerDiaSemana(fecha) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
}

/**
 * Formatea una fecha en formato DD/MM/YYYY
 */
function formatearFecha(fecha) {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
}

/**
 * Calcula todas las fechas desde el día -10 hasta el día 32
 */
function calcularFechas(dia1) {
    const fechas = [];
    const fechaBase = new Date(dia1);

    // Calcular desde el día -10 hasta el día 32
    // El Día 1 debe ser exactamente la fecha seleccionada
    for (let i = -10; i <= 32; i++) {
        const fecha = new Date(fechaBase);
        // Restar 1 porque el Día 1 debe ser la fecha base, no base + 1
        fecha.setDate(fechaBase.getDate() + i - 1);

        fechas.push({
            dia: i,
            fecha: fecha,
            fechaFormateada: formatearFecha(fecha),
            diaSemana: obtenerDiaSemana(fecha)
        });
    }

    return fechas;
}

/**
 * Renderiza la tabla de fechas
 */
function renderizarTabla(fechas) {
    fechasTbody.innerHTML = '';

    fechas.forEach(item => {
        const tr = document.createElement('tr');

        // Resaltar el día 1
        if (item.dia === 1) {
            tr.style.background = 'linear-gradient(135deg, #e8f4f8 0%, #d4e9f2 100%)';
            tr.style.fontWeight = '600';
        }

        // Resaltar días negativos
        if (item.dia < 0) {
            tr.style.color = '#7f8c8d';
        }

        tr.innerHTML = `
            <td>Día ${item.dia}</td>
            <td>${item.fechaFormateada}</td>
            <td>${item.diaSemana}</td>
        `;

        fechasTbody.appendChild(tr);
    });
}

/**
 * Guarda las fechas calculadas en el navegador
 */
function guardarFechas() {
    if (fechasCalculadas.length === 0) {
        alert('No hay datos para guardar. Por favor, calcula las fechas primero.');
        return;
    }

    // Obtener fechas guardadas existentes
    const fechasGuardadas = obtenerFechasGuardadas();

    // Crear un ID único basado en la fecha del Día 1
    const id = dia1Input.value;

    // Preparar los datos para guardar
    const datosGuardados = {
        id: id,
        dia1: dia1Input.value,
        fechaGuardado: new Date().toISOString(),
        fechas: fechasCalculadas
    };

    // Agregar o actualizar en el array
    const index = fechasGuardadas.findIndex(f => f.id === id);
    if (index >= 0) {
        fechasGuardadas[index] = datosGuardados;
        mostrarMensajeExito('✓ Fechas actualizadas exitosamente', '#27ae60');
    } else {
        fechasGuardadas.push(datosGuardados);
        mostrarMensajeExito('✓ Fechas guardadas exitosamente', '#27ae60');
    }

    // Guardar en localStorage
    localStorage.setItem('fechasEdiciones', JSON.stringify(fechasGuardadas));

    // Actualizar el desplegable
    actualizarDesplegable();
}

/**
 * Obtiene todas las fechas guardadas del localStorage
 */
function obtenerFechasGuardadas() {
    const datos = localStorage.getItem('fechasEdiciones');
    if (!datos) return [];

    try {
        const parsed = JSON.parse(datos);
        // Si es el formato antiguo (objeto único), convertir a array
        if (!Array.isArray(parsed)) {
            if (parsed.dia1) {
                // Agregar el campo id si no existe (migración de formato antiguo)
                return [{
                    id: parsed.id || parsed.dia1,
                    dia1: parsed.dia1,
                    fechaGuardado: parsed.fechaGuardado || parsed.fechaCalculada || new Date().toISOString(),
                    fechas: parsed.fechas
                }];
            }
            return [];
        }
        return parsed;
    } catch (e) {
        console.error('Error al cargar fechas guardadas:', e);
        return [];
    }
}

/**
 * Actualiza el desplegable con las fechas guardadas
 */
function actualizarDesplegable() {
    const fechasGuardadas = obtenerFechasGuardadas();

    // Limpiar opciones existentes (excepto la primera)
    savedDatesSelect.innerHTML = '<option value="">Selecciona una fecha guardada...</option>';

    if (fechasGuardadas.length === 0) {
        savedSection.classList.add('hidden');
        return;
    }

    // Mostrar la sección
    savedSection.classList.remove('hidden');

    // Ordenar por fecha de guardado (más reciente primero)
    fechasGuardadas.sort((a, b) => new Date(b.fechaGuardado) - new Date(a.fechaGuardado));

    // Agregar opciones
    fechasGuardadas.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;

        const fecha = new Date(item.dia1);
        const fechaFormateada = formatearFecha(fecha);
        const fechaGuardado = new Date(item.fechaGuardado);
        const horaGuardado = fechaGuardado.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        option.textContent = `Día 1: ${fechaFormateada} (guardado: ${horaGuardado})`;
        savedDatesSelect.appendChild(option);
    });
}

/**
 * Carga una fecha guardada seleccionada
 */
function cargarFechaGuardada() {
    const selectedId = savedDatesSelect.value;
    if (!selectedId) return;

    const fechasGuardadas = obtenerFechasGuardadas();
    const fechaGuardada = fechasGuardadas.find(f => f.id === selectedId);

    if (!fechaGuardada) {
        alert('No se pudo cargar la fecha guardada. Intenta eliminarla y guardarla nuevamente.');
        return;
    }

    // Verificar que tenga los datos necesarios
    if (!fechaGuardada.dia1 || !fechaGuardada.fechas) {
        alert('Los datos guardados están incompletos. Por favor, elimina esta fecha y guárdala nuevamente.');
        return;
    }

    try {
        // Establecer el Día 1
        dia1Input.value = fechaGuardada.dia1;

        // Cargar las fechas
        fechasCalculadas = fechaGuardada.fechas;

        // Renderizar la tabla
        renderizarTabla(fechasCalculadas);

        // Mostrar la sección de resultados
        resultsSection.classList.remove('hidden');

        // Mensaje de confirmación
        mostrarMensajeExito('✓ Fechas cargadas exitosamente', '#3498db');
    } catch (error) {
        console.error('Error al cargar fecha guardada:', error);
        alert('Hubo un error al cargar la fecha. Por favor, intenta eliminarla y guardarla nuevamente.');
    }
}

/**
 * Elimina la fecha guardada seleccionada
 */
function eliminarFechaGuardada() {
    const selectedId = savedDatesSelect.value;
    if (!selectedId) {
        alert('Por favor, selecciona una fecha guardada para eliminar.');
        return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta fecha guardada?')) {
        return;
    }

    let fechasGuardadas = obtenerFechasGuardadas();
    fechasGuardadas = fechasGuardadas.filter(f => f.id !== selectedId);

    // Guardar en localStorage
    localStorage.setItem('fechasEdiciones', JSON.stringify(fechasGuardadas));

    // Actualizar el desplegable
    actualizarDesplegable();

    // Mensaje de confirmación
    mostrarMensajeExito('✓ Fecha eliminada exitosamente', '#e74c3c');
}

/**
 * Exporta los datos a un archivo Excel
 */
function exportarAExcel() {
    if (fechasCalculadas.length === 0) {
        alert('No hay datos para exportar. Por favor, calcula las fechas primero.');
        return;
    }

    // Preparar los datos para Excel
    const datosExcel = fechasCalculadas.map(item => ({
        'Día': `Día ${item.dia}`,
        'Fecha': item.fechaFormateada,
        'Día de la Semana': item.diaSemana
    }));

    // Crear el libro de trabajo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);

    // Ajustar el ancho de las columnas
    ws['!cols'] = [
        { wch: 10 },  // Día
        { wch: 15 },  // Fecha
        { wch: 20 }   // Día de la Semana
    ];

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Fechas de Ediciones');

    // Generar el nombre del archivo con la fecha actual
    const fechaActual = new Date();
    const nombreArchivo = `Fechas_Ediciones_${fechaActual.getDate()}-${fechaActual.getMonth() + 1}-${fechaActual.getFullYear()}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, nombreArchivo);

    // Mostrar mensaje de éxito
    mostrarMensajeExito('✓ Archivo Excel descargado exitosamente', '#3498db');
}

/**
 * Muestra un mensaje de éxito temporal
 */
function mostrarMensajeExito(texto = '✓ Operación exitosa', color = '#27ae60') {
    const mensaje = document.createElement('div');
    mensaje.textContent = texto;

    const colorSecundario = color === '#27ae60' ? '#229954' : '#2980b9';
    const colorSombra = color === '#27ae60' ? 'rgba(39, 174, 96, 0.3)' : 'rgba(52, 152, 219, 0.3)';

    mensaje.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${color} 0%, ${colorSecundario} 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px ${colorSombra};
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(mensaje);

    setTimeout(() => {
        mensaje.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => mensaje.remove(), 300);
    }, 3000);
}

// ===== EVENT LISTENERS =====

/**
 * Maneja el clic en el botón calcular
 */
calcularBtn.addEventListener('click', () => {
    const dia1Valor = dia1Input.value;

    if (!dia1Valor) {
        alert('Por favor, selecciona una fecha para el Día 1');
        dia1Input.focus();
        return;
    }

    // Calcular las fechas
    fechasCalculadas = calcularFechas(dia1Valor);

    // Renderizar la tabla
    renderizarTabla(fechasCalculadas);

    // Mostrar la sección de resultados
    resultsSection.classList.remove('hidden');

    // Scroll suave hacia los resultados
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

/**
 * Maneja el clic en el botón exportar
 */
exportarBtn.addEventListener('click', exportarAExcel);

/**
 * Maneja el clic en el botón guardar
 */
guardarBtn.addEventListener('click', guardarFechas);

/**
 * Maneja el cambio en el desplegable de fechas guardadas
 */
savedDatesSelect.addEventListener('change', cargarFechaGuardada);

/**
 * Maneja el clic en el botón de eliminar fecha guardada
 */
deleteSavedBtn.addEventListener('click', eliminarFechaGuardada);

/**
 * Permite calcular presionando Enter en el input de fecha
 */
dia1Input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        calcularBtn.click();
    }
});

// ===== ANIMACIONES CSS ADICIONALES =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== INICIALIZACIÓN =====
// Establecer la fecha actual como valor por defecto
const hoy = new Date();
const fechaHoy = hoy.toISOString().split('T')[0];
dia1Input.value = fechaHoy;

// Cargar fechas guardadas al iniciar
actualizarDesplegable();

console.log('✓ Calculadora de Fechas de Ediciones cargada correctamente');
