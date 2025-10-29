// URL de tu Google Apps Script (REEMPLAZA ESTA URL)
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwToUIvEM25C5yTq61ZpBEOCqv8jkWGiA-r3eOMNXpulfS3Yt-A96A7LsaE8FByITp6Vg/exec';
        
        let usuarios = [];

        // Inicializar
        $(document).ready(function() {
            cargarUsuarios();
            
            // Verificar si hay parámetros en la URL para actualizar estado
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('actualizar');
            
            if (userId) {
                actualizarEstadoUsuario(userId);
            }
        });

        // Cargar usuarios desde Google Sheets
        async function cargarUsuarios() {
            const loading = $('#loading');
            const listaUsuarios = $('#listaUsuarios');
            
            loading.show();
            listaUsuarios.html('');

            try {
                const response = await fetch(`${SCRIPT_URL}?action=obtenerUsuarios`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    usuarios = data.data.usuarios;
                    actualizarVista();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al cargar usuarios: ' + error.message, 'error');
                listaUsuarios.html(`
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <h3 style="color: #a0aec0; margin-bottom: 10px;">Error al cargar datos</h3>
                        <p style="color: #cbd5e0;">${error.message}</p>
                    </div>
                `);
            } finally {
                loading.hide();
            }
        }

        // Actualizar estado del usuario
        async function actualizarEstadoUsuario(userId) {
            try {
                const response = await fetch(`${SCRIPT_URL}?action=actualizarEstado&id=${encodeURIComponent(userId)}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    mostrarNotificacion('✅ Estado actualizado a: ENTREGADO', 'success');
                    cargarUsuarios();
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al actualizar estado: ' + error.message, 'error');
            }
        }

        // Actualizar la vista
        function actualizarVista() {
            const container = $('#listaUsuarios');
            const statsContainer = $('#statsContainer');

            if (usuarios.length === 0) {
                statsContainer.html('');
                container.html(`
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <h3 style="color: #a0aec0; margin-bottom: 10px;">No hay usuarios registrados</h3>
                        <p style="color: #cbd5e0;">Comienza registrando el primer usuario</p>
                        <a href="registro.html" class="btn btn-primary" style="margin-top: 20px;">
                            📝 Registrar Primer Usuario
                        </a>
                    </div>
                `);
                return;
            }

            // Estadísticas
            const total = usuarios.length;
            const entregados = usuarios.filter(u => u.Estatus === 'Entregado').length;
            const pendientes = total - entregados;

            statsContainer.html(`
                <div class="stats-container">
                    <div class="stat-card">
                        <span class="stat-number">${total}</span>
                        <span class="stat-label">Total Registros</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number" style="color: #38a169;">${entregados}</span>
                        <span class="stat-label">Entregados</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number" style="color: #dd6b20;">${pendientes}</span>
                        <span class="stat-label">Pendientes</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number" style="color: #667eea;">${Math.round((entregados/total)*100)}%</span>
                        <span class="stat-label">Tasa de Entrega</span>
                    </div>
                </div>
            `);

            // Tabla
            let html = `
                <div style="overflow-x: auto;">
                    <table class="user-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Fecha Registro</th>
                                <th>Última Actualización</th>
                                <th>Estatus</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            // Ordenar por fecha más reciente primero
            usuarios.sort((a, b) => new Date(b.FechaRegistro) - new Date(a.FechaRegistro));

            usuarios.forEach(usuario => {
                const fechaRegistro = new Date(usuario.FechaRegistro).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const fechaActualizacion = new Date(usuario.FechaActualizacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const statusClass = usuario.Estatus === 'Pendiente' ? 'status-pendiente' : 'status-entregado';
                const statusText = usuario.Estatus === 'Pendiente' ? 'Pendiente' : 'Entregado';
                
                html += `
                    <tr>
                        <td style="font-weight: 500;">${usuario.Nombre}</td>
                        <td style="color: #718096; font-size: 0.9rem;">${fechaRegistro}</td>
                        <td style="color: #718096; font-size: 0.9rem;">${fechaActualizacion}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>
                            ${usuario.Estatus === 'Pendiente' ? 
                                `<button class="action-btn entregado" onclick="marcarEntregado('${usuario.ID}')" title="Marcar como entregado">
                                    ✅ Entregado
                                </button>` : 
                                '<span style="color: #718096; font-size: 0.8rem;">Completado</span>'
                            }
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            container.html(html);
        }

        // Marcar como entregado manualmente
        async function marcarEntregado(userId) {
            if (confirm('¿Marcar este registro como entregado?')) {
                await actualizarEstadoUsuario(userId);
            }
        }

        // Descargar Excel
        function descargarExcel() {
            if (usuarios.length === 0) {
                mostrarNotificacion('No hay datos para exportar', 'error');
                return;
            }

            const datos = [
                ['ID', 'Nombre Completo', 'Fecha Registro', 'Fecha Actualización', 'Estatus']
            ];

            usuarios.forEach(usuario => {
                datos.push([
                    usuario.ID,
                    usuario.Nombre,
                    new Date(usuario.FechaRegistro).toLocaleString('es-ES'),
                    new Date(usuario.FechaActualizacion).toLocaleString('es-ES'),
                    usuario.Estatus
                ]);
            });

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(datos);
            
            const colWidths = [
                { wch: 25 }, { wch: 35 }, { wch: 25 }, { wch: 25 }, { wch: 15 }
            ];
            worksheet['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
            XLSX.writeFile(workbook, `registro_usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
            mostrarNotificacion('Excel descargado exitosamente', 'success');
        }

        // Notificación
        function mostrarNotificacion(mensaje, tipo) {
            const notificacion = document.createElement('div');
            notificacion.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                ${tipo === 'success' ? 'background: #38a169;' : 'background: #e53e3e;'}
            `;
            
            notificacion.textContent = mensaje;
            document.body.appendChild(notificacion);
            
            setTimeout(() => notificacion.style.transform = 'translateX(0)', 100);
            setTimeout(() => {
                notificacion.style.transform = 'translateX(100%)';
                setTimeout(() => document.body.removeChild(notificacion), 300);
            }, 3000);
        }