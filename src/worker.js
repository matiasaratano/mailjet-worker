// Tu Worker adaptado con CORS y mejor debugging
export default {
  async fetch(request, env, ctx) {
    // Configurar headers de CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Manejar peticiones OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    // Solo permitir POST
    if (request.method !== 'POST') {
      return new Response('Solo POST permitido', { 
        status: 405,
        headers: corsHeaders
      });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response('JSON inválido: ' + e.message, { 
        status: 400,
        headers: corsHeaders
      });
    }

    const { email, cursos = [] } = data;
    if (!email || cursos.length === 0) {
      return new Response('Faltan datos - Email: ' + email + ', Cursos: ' + JSON.stringify(cursos), { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Verificar variables de entorno
    if (!env.MJ_API_KEY || !env.MJ_SECRET_KEY) {
      return new Response('Credenciales de Mailjet no configuradas. API_KEY: ' + (env.MJ_API_KEY ? 'OK' : 'FALTA') + ', SECRET_KEY: ' + (env.MJ_SECRET_KEY ? 'OK' : 'FALTA'), { 
        status: 500,
        headers: corsHeaders
      });
    }

    const html = `
  <p>Hola!</p>
  <p>Confirmamos tu pre-inscripción a los siguientes talleres:</p>
  <ul>
    ${cursos.map(c => `<li><b>ID:</b> ${c.id} - <b>Nombre:</b> ${c.nombre} - <b>Turno:</b> ${c.turno}</li>`).join('')}
  </ul>
  <p>Para confirmar tu lugar, realizá el pago:</p>
  <b>Alias:</b> eltinglado<br>
  <b>Asociación amigos de la cerámica de Villa Gesell. Cuit: 30-71190611-4. Mercadopago</b> <br>
  </p>
  <p>Una vez hecha la transferencia, por favor envianos a esta casilla de correo 
  (<a href="mailto:bienal.vg@gmail.com">bienal.vg@gmail.com</a>) el comprobante de pago y el nombre del inscripto 
  para evitar confusiones.</p>
  <b>Si tenes alguna duda, chequeá en preguntas frecuentes de nuestra web (https://webtmc.vercel.app/preguntas) o ponete en contacto por whatsapp al +549 2255 625446</b>
  <p>Gracias por participar!</p>
`;


    try {
      const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${env.MJ_API_KEY}:${env.MJ_SECRET_KEY}`),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Messages: [{
            From: { Email: 'info@madigital.com.ar', Name: 'Talleres Gesell' },
            To: [{ Email: email, Name: email.split('@')[0] }],
            Subject: 'Confirmación de pre-inscripción a talleres',
            HTMLPart: html
          }]
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        return new Response('Mail enviado correctamente', { 
          status: 200,
          headers: corsHeaders
        });
      } else {
        return new Response('Error de Mailjet: ' + JSON.stringify(result), { 
          status: 500,
          headers: corsHeaders
        });
      }
    } catch (error) {
      return new Response('Error al conectar con Mailjet: ' + error.message, { 
        status: 500,
        headers: corsHeaders
      });
    }
  }
};