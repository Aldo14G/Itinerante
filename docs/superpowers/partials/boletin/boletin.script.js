// Boletín: alta de suscriptor vía Firestore REST (sin SDK)
const NEWSLETTER_ENDPOINT = 'https://firestore.googleapis.com/v1/projects/libreria-itineranteymas/databases/(default)/documents/boletin_suscriptores?key=FIREBASE_WEB_API_KEY';

function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  const input = document.getElementById('newsletterEmail');
  const msg = document.getElementById('newsletterMsg');
  const btn = document.getElementById('newsletterSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      msg.textContent = 'Revisa tu correo, algo no cuadra.';
      return;
    }
    btn.disabled = true;
    msg.textContent = 'Guardando tu lugar en la lista…';
    try {
      const res = await fetch(NEWSLETTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            email: { stringValue: email },
            creadoEn: { timestampValue: new Date().toISOString() },
            origen: { stringValue: 'sitio-itinerante' }
          }
        })
      });
      if (!res.ok) throw new Error('firestore ' + res.status);
      form.reset();
      msg.textContent = 'Listo. La próxima carta llega a tu correo.';
    } catch (err) {
      msg.textContent = 'No pudimos guardarlo. Intenta de nuevo o escríbenos por WhatsApp.';
    } finally {
      btn.disabled = false;
    }
  });
}
initNewsletter();
