const API_URL = 'https://script.google.com/macros/s/AKfycbxpoB1Rbs3qyTX43HYqOcBnxIewTnD4jIn3M8PJPhknh_r_8Lj9-mN5mn4lLPFnErkB6w/exec';

const CUOTAS_TOTAL_ANUAL = 10;

/** Año del período marzo–diciembre usado para calcular cuotas esperadas y retrasadas. */
const ANIO_ACADEMICO = 2026;

let codigosList = [];

/**
 * Cuotas que ya debieron pagarse entre marzo y la fecha de referencia (inclusive),
 * dentro del año marzo–diciembre de `anioAcademico` (marzo = mes 1 … diciembre = 10).
 */
function cuotasEsperadasHastaFecha(anioAcademico, fecha) {
    const y = fecha.getFullYear();
    const m = fecha.getMonth();
    const dia = fecha.getDate();
    const ref = new Date(y, m, dia);
    const inicio = new Date(anioAcademico, 2, 1);
    const fin = new Date(anioAcademico, 11, 31);
    if (ref < inicio) {
        return 0;
    }
    if (ref > fin) {
        return CUOTAS_TOTAL_ANUAL;
    }
    return m - 2 + 1;
}

function normalizeCodigo(str) {
    return String(str).replace(/\s/g, '').toUpperCase();
}

function parseCuotasPagadas(val) {
    const n = Number(val);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function buscarCodigo() {
    const input = document.getElementById('codigo-search-input');
    const resultEl = document.getElementById('codigos-result');
    resultEl.innerHTML = '';
    const q = normalizeCodigo(input.value);
    if (!q) {
        const p = document.createElement('p');
        p.className = 'codigos-result-msg error';
        p.textContent = 'Ingresa un código para buscar.';
        resultEl.appendChild(p);
        return;
    }
    const matches = codigosList.filter((c) => normalizeCodigo(c.codigo) === q);
    if (!matches.length) {
        const p = document.createElement('p');
        p.className = 'codigos-result-msg error';
        p.textContent = 'No se encontró el código.';
        resultEl.appendChild(p);
        return;
    }
    const hoy = new Date();
    const esperadas = cuotasEsperadasHastaFecha(ANIO_ACADEMICO, hoy);

    const table = document.createElement('table');
    table.className = 'codigos-result-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Código</th>
            <th>Cuotas pagadas</th>
            <th>Cuotas retrasadas</th>
            <th>Total cuotas</th>
        </tr>
    `;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    matches.forEach((m) => {
        const pagadas = parseCuotasPagadas(m.cuotas);
        const retrasadas = Math.max(0, esperadas - pagadas);
        const tr = document.createElement('tr');
        const tdCodigo = document.createElement('td');
        tdCodigo.textContent = m.codigo;
        const tdPagadas = document.createElement('td');
        tdPagadas.textContent = String(pagadas);
        const tdRetrasadas = document.createElement('td');
        tdRetrasadas.textContent = String(retrasadas);
        if (retrasadas > 0) {
            tdRetrasadas.classList.add('codigos-retrasadas');
        }
        const tdTotal = document.createElement('td');
        tdTotal.textContent = String(CUOTAS_TOTAL_ANUAL);
        tr.appendChild(tdCodigo);
        tr.appendChild(tdPagadas);
        tr.appendChild(tdRetrasadas);
        tr.appendChild(tdTotal);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    resultEl.appendChild(table);
}

const formatCurrency = (amount) => {
    // Format as Chilean Pesos
    return new Intl.NumberFormat('es-CL', { 
        style: 'currency', 
        currency: 'CLP',
        maximumFractionDigits: 0 // No decimal places for CLP
    }).format(amount);
};

function createCuotasTable(cuotas) {
    const table = document.createElement('table');
    table.className = 'cuotas-table';
    
    // Create header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Mes</th>
            <th>Cuotas Pagadas</th>
            <th>Cuotas Pendientes</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    cuotas.forEach(cuota => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cuota.mes}</td>
            <td class="pagadas">${cuota.cuotasPagadas}</td>
            <td class="pendientes">${cuota.cuotasPendientes}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    return table;
}

function createEgresosTable(egresos) {
    // Keep backwards compatibility in case old negative rows still exist.
    const egresosFiltered = egresos.filter(egreso => egreso.monto >= 0);
    
    if(!egresosFiltered.length) {
        return;
    }

    const table = document.createElement('table');
    table.className = 'egresos-table';
    
    // Create header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Fecha</th>
            <th>Monto</th>
            <th>Glosa</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    egresosFiltered.forEach(egreso => {
        const fecha = new Date(egreso.fecha);
        const formattedFecha = fecha.toLocaleDateString('es-CL');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fecha">${formattedFecha}</td>
            <td class="monto">${formatCurrency(egreso.monto)}</td>
            <td class="glosa">${egreso.glosa}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    return table;
}

function createIngresosAdicionalesTable(donaciones) {
    if(!donaciones || !donaciones.length) {
        return;
    }

    const table = document.createElement('table');
    table.className = 'ingresos-adicionales-table';
        
    // Create header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Fecha</th>
            <th>Monto</th>
            <th>Glosa</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    donaciones.forEach(donacion => {
        const fecha = new Date(donacion.fecha);
        const formattedFecha = fecha.toLocaleDateString('es-CL');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fecha">${formattedFecha}</td>
            <td class="monto">${formatCurrency(donacion.monto)}</td>
            <td class="glosa">${donacion.glosa}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    return table;
}

async function loadData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data) {
            console.log(data);
            const ingresos = data.totals["Total Ingresos"];
            console.log(ingresos);
            const egresos = data.totals["Total Egresos"];
            console.log(egresos);
            const balance = ingresos - egresos;
            console.log(balance);
            document.getElementById('ingresos').textContent = formatCurrency(ingresos);
            document.getElementById('egresos').textContent = formatCurrency(egresos);
            document.getElementById('balance').textContent = formatCurrency(balance);

            // Add color to balance based on value
            const balanceElement = document.getElementById('balance');
            balanceElement.style.color = balance >= 0 ? '#2e7d32' : '#c62828';

            codigosList = Array.isArray(data.codigos) ? data.codigos : [];
            document.getElementById('codigo-search-input').disabled = false;
            document.getElementById('codigo-search-btn').disabled = false;

            // Create and add cuotas table
            const cuotasTable = createCuotasTable(data.cuotas);
            const cuotasContainer = document.getElementById('cuotas-container');
            const cuotasLoadingElement = document.getElementById('cuotas-loading');
            cuotasLoadingElement.remove();
            cuotasContainer.appendChild(cuotasTable);

            // Create and add egresos table
            const egresosTable = createEgresosTable(data.egresos); 
            const ingresosAdicionalesTable = createIngresosAdicionalesTable(data.donaciones);
            const egresosContainer = document.getElementById('egresos-container');
            const egresosLoadingElement = document.getElementById('egresos-loading');
            const ingresosAdicionalesContainer = document.getElementById('ingresos-adicionales-container');
            const ingresosAdicionalesLoadingElement = document.getElementById('ingresos-adicionales-loading');
            egresosLoadingElement.remove();
            if (egresosTable) {
                egresosContainer.appendChild(egresosTable);
            } else {
                egresosContainer.innerHTML += '<div class="amount">Sin egresos registrados</div>';
            }
            ingresosAdicionalesLoadingElement.remove();
            if (ingresosAdicionalesTable) {
                ingresosAdicionalesContainer.appendChild(ingresosAdicionalesTable);
            } else {
                ingresosAdicionalesContainer.innerHTML += '<div class="amount">Sin donaciones registradas</div>';
            }
        }
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('ingresos').textContent = 'Error al cargar datos';
        document.getElementById('egresos').textContent = 'Error al cargar datos';
        document.getElementById('balance').textContent = 'Error al cargar datos';
        document.getElementById('cuotas-loading').textContent = 'Error al cargar datos';
        document.getElementById('egresos-loading').textContent = 'Error al cargar datos';
        document.getElementById('ingresos-adicionales-loading').textContent = 'Error al cargar datos';
        const codigosResult = document.getElementById('codigos-result');
        if (codigosResult) {
            codigosResult.innerHTML = '<p class="codigos-result-msg error">No se pudieron cargar los códigos.</p>';
        }
    }
}

document.getElementById('codigo-search-btn').addEventListener('click', buscarCodigo);
document.getElementById('codigo-search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        buscarCodigo();
    }
});

loadData();