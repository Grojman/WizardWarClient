// Static bilingual privacy-policy copy. Kept separate from the component so
// it reads like a document rather than markup, and independent of the
// server-fed TranslationService: legal text must not depend on a websocket
// round-trip to render, and must not silently change if the game's in-match
// dictionary is edited.
//
// Site owner (Summer Productions), contact email, and production domain
// (game.wizardbar.es — also set in seo.service.ts, index.html, robots.txt
// and sitemap.xml) are filled in below.
//
// This is a plain-language draft, not legal advice — have it checked
// (especially the Spain-specific consent/tax angles) before going live with
// AdSense.

export interface PrivacySection {
  heading: string;
  paragraphs: string[];
}

export interface StorageRow {
  name: string;
  purpose: string;
  duration: string;
}

export interface PrivacyContent {
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: PrivacySection[];
  storageTableHeading: string;
  storageColumns: { name: string; purpose: string; duration: string };
  storageRows: StorageRow[];
  manage: {
    heading: string;
    description: string;
    currentLabel: string;
    accepted: string;
    rejected: string;
    notSet: string;
    acceptBtn: string;
    rejectBtn: string;
  };
  backLabel: string;
}

export const PRIVACY_CONTENT: Record<string, PrivacyContent> = {
  es: {
    title: 'Política de privacidad',
    lastUpdated: 'Última actualización: 8 de septiembre de 2026',
    backLabel: 'Volver',
    intro: [
      'El Bar de los Magos (en adelante, "el juego" o "el sitio") es un juego de cartas online gratuito que no requiere registro ni cuenta de usuario. Esta página explica qué información se procesa cuando juegas, para qué se usa y qué opciones tienes.',
      'Responsable del sitio: Summer Productions, contactable en summer.productions.games@gmail.com. Este documento es una explicación en lenguaje llano, no un dictamen legal; para las particularidades fiscales y de consentimiento en España conviene revisarlo con un profesional.',
    ],
    sections: [
      {
        heading: '1. Qué información se procesa',
        paragraphs: [
          'No pedimos registro, correo electrónico ni contraseña para jugar. La información que se procesa es la mínima necesaria para que la partida funcione:',
          '• El nombre que escribes para jugar: se usa solo durante tu partida y no se guarda de forma permanente en el servidor.',
          '• Un identificador aleatorio de reconexión, guardado en tu navegador, que permite recuperar una partida en curso si se corta la conexión.',
          '• Tu dirección IP: el servidor la usa de forma transitoria para limitar conexiones abusivas (rate limiting) y aparece en los registros técnicos (logs) del servidor, que se conservan un máximo de 14 días y después se eliminan automáticamente.',
          '• Estadísticas agregadas y anónimas de partidas (victorias, derrotas, mazos usados) — no están vinculadas a ninguna persona identificable.',
          '• Si envías una sugerencia desde el formulario del sitio, el texto se guarda tal cual lo escribes; te pedimos que no incluyas datos personales en él.',
        ],
      },
      {
        heading: '2. Almacenamiento en tu dispositivo',
        paragraphs: [
          'El sitio usa el almacenamiento local del navegador (localStorage), no cookies tradicionales, para recordar tus preferencias y mantener tu partida. Ninguno de estos datos sale de tu dispositivo salvo el identificador de reconexión, que se envía al servidor solo para recuperar tu partida. Puedes ver el detalle en la tabla más abajo.',
        ],
      },
      {
        heading: '3. Publicidad (Google AdSense)',
        paragraphs: [
          'Este sitio no muestra publicidad de terceros en este momento. Si en el futuro se activa Google AdSense, Google y sus socios publicitarios podrán utilizar cookies u otras tecnologías similares en tu navegador para mostrar anuncios, incluyendo, si lo autorizas, anuncios personalizados según tus intereses.',
          'Llegado ese momento, el anuncio solo se cargará si has aceptado la casilla de "no esenciales" en el aviso de cookies de este sitio. Puedes cambiar tu decisión en cualquier momento desde la sección "Gestionar mis preferencias" al final de esta página.',
          'Google Ireland Limited actúa como responsable del tratamiento de los datos que recoge a través de sus propios servicios publicitarios, conforme a su Política de consentimiento de la UE. Puedes consultar cómo Google utiliza los datos en https://policies.google.com/technologies/partner-sites y gestionar la personalización de anuncios en https://myadcenter.google.com/.',
          'No accedemos ni solicitamos tu ubicación precisa. Los sistemas publicitarios de Google, si están activos, pueden inferir una ubicación aproximada a partir de tu IP para mostrar anuncios relevantes; eso lo gestiona Google, no este sitio.',
        ],
      },
      {
        heading: '4. Base legal',
        paragraphs: [
          'Tratamos tu IP y aplicamos límites de conexión por interés legítimo en mantener el servicio disponible y seguro. El almacenamiento estrictamente necesario para jugar (reconexión, partida activa) se basa en que es imprescindible para el servicio que has solicitado. El almacenamiento no esencial (y cualquier cookie publicitaria futura) se basa en tu consentimiento, que puedes dar o retirar libremente.',
        ],
      },
      {
        heading: '5. Tus derechos',
        paragraphs: [
          'Como no recogemos cuentas ni datos identificables de forma permanente, hay poco que rectificar o eliminar por nuestra parte. Aun así, puedes escribir a summer.productions.games@gmail.com para solicitar acceso, rectificación o eliminación de cualquier dato personal que consideres que tenemos sobre ti (por ejemplo, el contenido de una sugerencia enviada), o para cualquier duda sobre este documento. Tienes derecho a reclamar ante la Agencia Española de Protección de Datos (aepd.es) si consideras que no se ha atendido tu solicitud.',
        ],
      },
      {
        heading: '6. Menores',
        paragraphs: [
          'Este sitio no está dirigido específicamente a menores de edad y no solicitamos ni recogemos conscientemente datos personales de menores.',
        ],
      },
      {
        heading: '7. Cambios en esta política',
        paragraphs: [
          'Podemos actualizar este documento si cambia el funcionamiento del sitio (por ejemplo, al activar la publicidad). La fecha de "última actualización" al principio de la página indica la versión vigente.',
        ],
      },
    ],
    storageTableHeading: 'Detalle del almacenamiento local',
    storageColumns: { name: 'Clave', purpose: 'Para qué se usa', duration: 'Duración' },
    storageRows: [
      { name: 'wizardwar_client_id', purpose: 'Identificador de reconexión de partida', duration: 'Hasta que borres los datos del sitio' },
      { name: 'wizardwar_active_game', purpose: 'Recordar si tienes una partida sin terminar', duration: 'Hasta que termine o abandones la partida' },
      { name: 'wizardwar_language', purpose: 'Idioma de la interfaz', duration: 'Hasta que lo cambies o borres los datos del sitio' },
      { name: 'wizardwar_music_volume / wizardwar_sfx_volume / wizardwar_music_enabled / wizardwar_sfx_enabled', purpose: 'Preferencias de audio', duration: 'Hasta que las cambies o borres los datos del sitio' },
      { name: 'wizardwar_animation_speed', purpose: 'Velocidad de las animaciones', duration: 'Hasta que la cambies o borres los datos del sitio' },
      { name: 'wizardwar_cookie_consent / wizardwar_cookie_consent_date', purpose: 'Recordar tu decisión sobre este aviso', duration: '180 días, después se vuelve a preguntar' },
    ],
    manage: {
      heading: 'Gestionar mis preferencias',
      description: 'Puedes aceptar o rechazar el almacenamiento no esencial (incluida la futura publicidad) en cualquier momento.',
      currentLabel: 'Tu elección actual:',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      notSet: 'Sin decidir todavía',
      acceptBtn: 'Aceptar',
      rejectBtn: 'Rechazar',
    },
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: September 8, 2026',
    backLabel: 'Back',
    intro: [
      'El Bar de los Magos ("the game" or "the site") is a free online card game that requires no sign-up or user account. This page explains what information is processed while you play, what it is used for, and what choices you have.',
      'Site operator: Summer Productions, reachable at summer.productions.games@gmail.com. This is a plain-language explanation, not legal advice — for the Spain-specific consent and tax angles it is worth a professional review before going live.',
    ],
    sections: [
      {
        heading: '1. What information is processed',
        paragraphs: [
          "We don't ask for sign-up, an email address, or a password to play. Only the minimum needed to run a match is processed:",
          "• The name you type to play: used only for the duration of your match and not permanently stored on the server.",
          '• A random reconnection identifier, stored in your browser, used to resume an in-progress match if the connection drops.',
          '• Your IP address: used transiently by the server to rate-limit abusive connections, and it appears in the server\'s technical logs, which are kept for at most 14 days and then automatically deleted.',
          '• Anonymous, aggregate match statistics (wins, losses, decks used) — not linked to any identifiable person.',
          "• If you submit a suggestion through the site's form, the text is stored as written; please don't include personal data in it.",
        ],
      },
      {
        heading: '2. Storage on your device',
        paragraphs: [
          "The site uses browser local storage (localStorage), not traditional cookies, to remember your preferences and keep your match going. None of this data leaves your device except the reconnection id, which is sent to the server only to resume your match. See the table below for details.",
        ],
      },
      {
        heading: '3. Advertising (Google AdSense)',
        paragraphs: [
          "This site does not currently show third-party advertising. If Google AdSense is enabled in the future, Google and its advertising partners may use cookies or similar technology in your browser to serve ads, including, where you allow it, ads personalized to your interests.",
          "Once that happens, ads will only load if you have accepted the \"non-essential\" option in this site's cookie notice. You can change that choice at any time from the \"Manage my preferences\" section at the bottom of this page.",
          "Google Ireland Limited acts as the controller for data it collects through its own advertising services, under its EU User Consent Policy. You can read how Google uses this data at https://policies.google.com/technologies/partner-sites and manage ad personalization at https://myadcenter.google.com/.",
          "We do not access or request your precise location. Google's advertising systems, if active, may infer an approximate location from your IP to show relevant ads; that is handled by Google, not by this site.",
        ],
      },
      {
        heading: '4. Legal basis',
        paragraphs: [
          "We process your IP and apply connection limits under legitimate interest in keeping the service available and secure. Storage that is strictly necessary to play (reconnection, active match) rests on it being required for the service you requested. Non-essential storage (and any future advertising cookie) rests on your consent, which you can give or withdraw freely.",
        ],
      },
      {
        heading: '5. Your rights',
        paragraphs: [
          "Since we don't keep accounts or permanent identifiable data, there is little to rectify or delete on our side. Still, you can write to summer.productions.games@gmail.com to request access to, correction of, or deletion of any personal data you believe we hold about you (for example, the content of a submitted suggestion), or with any question about this document. You have the right to file a complaint with the Spanish Data Protection Agency (aepd.es) if you feel your request wasn't addressed.",
        ],
      },
      {
        heading: '6. Children',
        paragraphs: [
          "This site is not specifically directed at children, and we do not knowingly request or collect personal data from children.",
        ],
      },
      {
        heading: '7. Changes to this policy',
        paragraphs: [
          "We may update this document if how the site works changes (for example, when advertising is switched on). The \"last updated\" date at the top of the page marks the current version.",
        ],
      },
    ],
    storageTableHeading: 'Local storage detail',
    storageColumns: { name: 'Key', purpose: 'What it is for', duration: 'Duration' },
    storageRows: [
      { name: 'wizardwar_client_id', purpose: 'Match reconnection identifier', duration: 'Until you clear site data' },
      { name: 'wizardwar_active_game', purpose: 'Remembers an unfinished match', duration: 'Until the match ends or is abandoned' },
      { name: 'wizardwar_language', purpose: 'Interface language', duration: 'Until changed or site data is cleared' },
      { name: 'wizardwar_music_volume / wizardwar_sfx_volume / wizardwar_music_enabled / wizardwar_sfx_enabled', purpose: 'Audio preferences', duration: 'Until changed or site data is cleared' },
      { name: 'wizardwar_animation_speed', purpose: 'Animation speed', duration: 'Until changed or site data is cleared' },
      { name: 'wizardwar_cookie_consent / wizardwar_cookie_consent_date', purpose: 'Remembers your choice on this notice', duration: '180 days, then you are asked again' },
    ],
    manage: {
      heading: 'Manage my preferences',
      description: 'You can accept or reject non-essential storage (including any future advertising) at any time.',
      currentLabel: 'Your current choice:',
      accepted: 'Accepted',
      rejected: 'Rejected',
      notSet: 'Not decided yet',
      acceptBtn: 'Accept',
      rejectBtn: 'Reject',
    },
  },
};
