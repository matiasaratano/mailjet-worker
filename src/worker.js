export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Solo POST permitido', { status: 405 });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response('JSON inválido', { status: 400 });
    }

    const { email, cursos = [] } = data;
    if (!email || cursos.length === 0) {
      return new Response('Faltan datos', { status: 400 });
    }

    const html = `
      <p>Hola!</p>
      <p>Confirmamos tu inscripción a los siguientes talleres:</p>
      <ul>${cursos.map(c => `<li>${c}</li>`).join('')}</ul>
      <p>Para confirmar tu lugar, realizá el pago:</p>
      <p><b>CBU:</b> 0000003100000000000001<br>
      <b>Alias:</b> talleres.gesell<br>
      <b>Concepto:</b> ${email}</p>
      <p>Gracias por participar!</p>
    `;

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
          Subject: 'Confirmación de inscripción a talleres',
          HTMLPart: html
        }]
      })
    });

    const result = await response.json();
    if (response.ok) {
      return new Response('Mail enviado', { status: 200 });
    } else {
      return new Response(JSON.stringify(result), { status: 500 });
    }
  }
};