// Clave para localStorage
        const STORAGE_KEY = 'usuarios_registrados';

        // Inicializar la aplicación
        $(document).ready(function() {
            // Enter key en el input
            $('#nombre').keypress(function(e) {
                if (e.which === 13) {
                    registrarUsuario();
                }
            });
        });

        // Generar ID único
        function generarId() {
            return 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Registrar nuevo usuario
        function registrarUsuario() {
            const nombre = $('#nombre').val().trim();
            
            if (!nombre) {
                alert('Por favor ingrese un nombre completo');
                return;
            }

            // Crear objeto usuario
            const usuario = {
                id: generarId(),
                nombre: nombre,
                fechaRegistro: new Date().toISOString(),
                fechaActualizacion: new Date().toISOString(),
                estatus: 'Pendiente'
            };

            // Guardar en localStorage
            guardarUsuario(usuario);
            
            // Generar y mostrar QR
            generarQR(usuario.id);
            
            // Limpiar formulario
            $('#nombre').val('');
            
            // Mostrar notificación
            mostrarNotificacion('Usuario registrado exitosamente!', 'success');
        }

        // Guardar usuario en localStorage
        function guardarUsuario(usuario) {
            let usuarios = obtenerUsuarios();
            usuarios.push(usuario);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
        }

        // Obtener todos los usuarios
        function obtenerUsuarios() {
            const usuarios = localStorage.getItem(STORAGE_KEY);
            return usuarios ? JSON.parse(usuarios) : [];
        }

        // Generar QR con URL para actualizar estado
        function generarQR(userId) {
            // Crear URL que actualizará el estado al ser escaneada
            const updateUrl = `${window.location.origin}${window.location.pathname.replace('registro.html', 'lista.html')}?actualizar=${userId}`;
            
            // Limpiar contenedor QR
            $('#qrcode').empty();
            
            // Generar QR
            try {
                const qrcode = new QRCode(document.getElementById("qrcode"), {
                    text: updateUrl,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                
                // Mostrar sección QR
                $('#qrSection').show();
                
                // Guardar URL actualización para descarga
                window.currentQRUrl = updateUrl;
                window.currentUserId = userId;
                
            } catch (error) {
                console.error('Error generando QR:', error);
                generarQRAlternativo(updateUrl);
            }
        }

        // Método alternativo para generar QR
        function generarQRAlternativo(url) {
            $('#qrcode').empty();
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
            const img = document.createElement('img');
            img.src = qrUrl;
            img.alt = 'Código QR';
            $('#qrcode').append(img);
            $('#qrSection').show();
        }

        // Descargar QR como imagen
        function descargarQR() {
            const canvas = document.querySelector('#qrcode canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = `qr_${window.currentUserId}.png`;
                link.href = canvas.toDataURL();
                link.click();
                mostrarNotificacion('QR descargado exitosamente', 'success');
            } else {
                mostrarNotificacion('No hay QR generado para descargar', 'error');
            }
        }

        // Mostrar notificación
        function mostrarNotificacion(mensaje, tipo) {
            // Crear elemento de notificación
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
            
            // Animación de entrada
            setTimeout(() => {
                notificacion.style.transform = 'translateX(0)';
            }, 100);
            
            // Remover después de 3 segundos
            setTimeout(() => {
                notificacion.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    document.body.removeChild(notificacion);
                }, 300);
            }, 3000);
        }