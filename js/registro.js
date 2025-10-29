// URL de tu Google Apps Script (REEMPLAZA ESTA URL)
        const SCRIPT_URL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(
    'https://script.google.com/macros/s/AKfycbwToUIvEM25C5yTq61ZpBEOCqv8jkWGiA-r3eOMNXpulfS3Yt-A96A7LsaE8FByITp6Vg/exec');
        
        // Función para registrar usuario
        async function registrarUsuario() {
            const nombre = $('#nombre').val().trim();
            const btnRegistrar = $('#btnRegistrar');
            const loading = $('#loading');
            
            if (!nombre) {
                mostrarNotificacion('Por favor ingrese un nombre completo', 'error');
                return;
            }

            // Mostrar loading
            btnRegistrar.prop('disabled', true);
            loading.show();

            try {
                const response = await fetch(`${SCRIPT_URL}?action=registrar&nombre=${encodeURIComponent(nombre)}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    generarQR(data.data.id);
                    $('#nombre').val('');
                    mostrarNotificacion('Usuario registrado exitosamente!', 'success');
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al registrar usuario: ' + error.message, 'error');
            } finally {
                btnRegistrar.prop('disabled', false);
                loading.hide();
            }
        }

        // Generar QR
        function generarQR(userId) {
            const updateUrl = `${window.location.origin}${window.location.pathname.replace('registro.html', 'lista.html')}?actualizar=${userId}`;
            
            $('#qrcode').empty();
            
            try {
                const qrcode = new QRCode(document.getElementById("qrcode"), {
                    text: updateUrl,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                
                $('#qrSection').show();
                window.currentQRUrl = updateUrl;
                window.currentUserId = userId;
                
            } catch (error) {
                console.error('Error generando QR:', error);
                generarQRAlternativo(updateUrl);
            }
        }

        // Resto de funciones permanecen igual...
        function generarQRAlternativo(url) {
            $('#qrcode').empty();
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
            const img = document.createElement('img');
            img.src = qrUrl;
            img.alt = 'Código QR';
            $('#qrcode').append(img);
            $('#qrSection').show();
        }

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

        // Enter key
        $(document).ready(function() {
            $('#nombre').keypress(function(e) {
                if (e.which === 13) registrarUsuario();
            });
        });