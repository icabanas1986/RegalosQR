 // Clave para localStorage
        const STORAGE_KEY = 'usuarios_registrados';

        // Inicializar la aplicación
        $(document).ready(function() {
            actualizarLista();
            
            // Verificar si hay parámetros en la URL para actualizar estado
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('actualizar');
            
            if (userId) {
                actualizarEstadoUsuario(userId);
            }
        });

        // Obtener todos los usuarios
        function obtenerUsuarios() {
            const usuarios = localStorage.getItem(STORAGE_KEY);
            return usuarios ? JSON.parse(usuarios) : [];
        }

        // Actualizar estado del usuario (se llama desde la URL del QR)
        function actualizarEstadoUsuario(userId) {
            let usuarios = obtenerUsuarios();
            let usuarioEncontrado = false;
            
            usuarios = usuarios.map(usuario => {
                if (usuario.id === userId && usuario.estatus === 'Pendiente') {
                    usuario.estatus = 'Entregado';
                    usuario.fechaActualizacion = new Date().toISOString();
                    usuarioEncontrado = true;
                }
                return usuario;
            });
            
            if (usuarioEncontrado) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
                mostrarNotificacion('✅ Estado actualizado a: ENTREGADO', 'success');
                actualizarLista();
                
                // Limpiar parámetros URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                mostrarNotificacion('Usuario no encontrado o ya estaba entregado', 'error');
            }
        }

        // Actualizar lista de usuarios y estadísticas
        function actualizarLista() {
            const usuarios = obtenerUsuarios();
            const container = $('#listaUsuarios');
            const statsContainer = $('#statsContainer');
            
            // Actualizar estadísticas
            const total = usuarios.length;
            const entregados = usuarios.filter(u => u.estatus === 'Entregado').length;
            const pendientes = total - entregados;
            
            if (total === 0) {
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
            
            // Mostrar estadísticas
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
            
            // Generar tabla
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
            usuarios.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
            
            usuarios.forEach(usuario => {
                const fechaRegistro = new Date(usuario.fechaRegistro).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const fechaActualizacion = new Date(usuario.fechaActualizacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const statusClass = usuario.estatus === 'Pendiente' ? 'status-pendiente' : 'status-entregado';
                const statusText = usuario.estatus === 'Pendiente' ? 'Pendiente' : 'Entregado';
                
                html += `
                    <tr>
                        <td style="font-weight: 500;">${usuario.nombre}</td>
                        <td style="color: #718096; font-size: 0.9rem;">${fechaRegistro}</td>
                        <td style="color: #718096; font-size: 0.9rem;">${fechaActualizacion}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>
                            ${usuario.estatus === 'Pendiente' ? 
                                `<button class="action-btn entregado" onclick="marcarEntregado('${usuario.id}')" title="Marcar como entregado">
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

        // Función para marcar como entregado manualmente
        function marcarEntregado(userId) {
            if (confirm('¿Marcar este registro como entregado?')) {
                actualizarEstadoUsuario(userId);
            }
        }

        // Generar y descargar Excel
        function descargarExcel() {
            const usuarios = obtenerUsuarios();
            
            if (usuarios.length === 0) {
                mostrarNotificacion('No hay datos para exportar', 'error');
                return;
            }
            
            // Preparar datos para Excel
            const datos = [
                ['ID', 'Nombre Completo', 'Fecha Registro', 'Fecha Actualización', 'Estatus']
            ];
            
            usuarios.forEach(usuario => {
                datos.push([
                    usuario.id,
                    usuario.nombre,
                    new Date(usuario.fechaRegistro).toLocaleString('es-ES'),
                    new Date(usuario.fechaActualizacion).toLocaleString('es-ES'),
                    usuario.estatus
                ]);
            });
            
            // Crear libro de Excel
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(datos);
            
            // Ajustar anchos de columnas
            const colWidths = [
                { wch: 25 }, // ID
                { wch: 35 }, // Nombre
                { wch: 25 }, // Fecha Registro
                { wch: 25 }, // Fecha Actualización
                { wch: 15 }  // Estatus
            ];
            worksheet['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
            XLSX.writeFile(workbook, `registro_usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
            mostrarNotificacion('Excel descargado exitosamente', 'success');
        }

        // Mostrar notificación
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
            
            setTimeout(() => {
                notificacion.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notificacion.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    document.body.removeChild(notificacion);
                }, 300);
            }, 3000);
        }