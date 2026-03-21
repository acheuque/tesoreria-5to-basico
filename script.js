const API_URL = 'https://script.google.com/macros/s/AKfycbxpoB1Rbs3qyTX43HYqOcBnxIewTnD4jIn3M8PJPhknh_r_8Lj9-mN5mn4lLPFnErkB6w/exec';

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
    }
}

loadData();