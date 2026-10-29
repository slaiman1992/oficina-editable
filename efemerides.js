// ============================================================
//  EFEMÉRIDES — calendario de la pizarra de la oficina Editable
//  Locales (República Dominicana) e internacionales del nicho
//  (marketing, redes sociales, diseño, audiovisual e IA).
//  Para agregar una fecha, copia una línea y cámbiala:
//    fija:  { m: 6, d: 30, nombre: '...', idea: '...' }        (mes 1-12, día)
//    móvil: { regla: a => fecha(a, mes, día), nombre: '...' }
// ============================================================
(function () {
  const fecha = (a, m, d) => new Date(a, m - 1, d);
  // n-ésimo día de la semana del mes (dow: 0 = domingo … 6 = sábado)
  const nesimo = (a, m, dow, n) => { const f = fecha(a, m, 1); f.setDate(1 + ((dow - f.getDay() + 7) % 7) + (n - 1) * 7); return f; };
  const ultimo = (a, m, dow) => { const f = fecha(a, m + 1, 0); f.setDate(f.getDate() - ((f.getDay() - dow + 7) % 7)); return f; };
  const mas = (f, dias) => { const g = new Date(f); g.setDate(g.getDate() + dias); return g; };
  // Domingo de Pascua (calendario gregoriano)
  function pascua(a) {
    const b = a % 19, c = Math.floor(a / 100), d = a % 100, e = Math.floor(c / 4), f = c % 4, g = Math.floor((c + 8) / 25), h = Math.floor((c - g + 1) / 3);
    const i = (19 * b + c - e - h + 15) % 30, k = Math.floor(d / 4), l = d % 4, mm = (32 + 2 * f + 2 * k - i - l) % 7, n = Math.floor((b + 11 * i + 22 * mm) / 451);
    const mes = Math.floor((i + mm - 7 * n + 114) / 31), dia = ((i + mm - 7 * n + 114) % 31) + 1;
    return fecha(a, mes, dia);
  }
  const blackFriday = a => mas(nesimo(a, 11, 4, 4), 1); // viernes después del 4.º jueves de noviembre

  const LOCALES = [
    { m: 1, d: 1, nombre: 'Año Nuevo', idea: 'Metas y propósitos de marketing para negocios dominicanos.' },
    { m: 1, d: 6, nombre: 'Día de los Santos Reyes', idea: 'Contenido familiar y de regalos; buena fecha para comercios.' },
    { m: 1, d: 21, nombre: 'Día de Nuestra Señora de la Altagracia', idea: 'Mensaje respetuoso y sobrio, sin tono promocional.' },
    { m: 1, d: 26, nombre: 'Natalicio de Juan Pablo Duarte', idea: 'Contenido patrio: valores y orgullo dominicano.' },
    { m: 1, d: 31, nombre: 'Día Nacional de la Juventud', idea: 'Talento joven, pasantías y emprendedores.' },
    { m: 2, d: 14, nombre: 'Día del Amor y la Amistad', idea: 'Promociones en pareja, regalos y reels de amistad en la oficina.' },
    { m: 2, d: 27, nombre: 'Día de la Independencia Nacional', idea: 'Contenido patrio con respeto al uso de los símbolos nacionales.' },
    { regla: a => mas(pascua(a), -3), nombre: 'Jueves Santo', idea: 'Semana Santa: baja actividad; programa contenido ligero y avisa horarios.' },
    { regla: a => mas(pascua(a), -2), nombre: 'Viernes Santo (feriado)', idea: 'Mensaje sobrio; evita promociones agresivas.' },
    { m: 4, d: 5, nombre: 'Día Nacional del Periodista', idea: 'Reconoce a la prensa; buen día para relaciones con medios.' },
    { m: 5, d: 1, nombre: 'Día del Trabajo (feriado)', idea: 'Reconocimiento al equipo; contenido detrás de cámaras.' },
    { regla: a => ultimo(a, 5, 0), nombre: 'Día de las Madres', idea: 'Una de las fechas comerciales más fuertes del país: arranca la campaña con semanas de antelación.' },
    { regla: a => mas(pascua(a), 60), nombre: 'Corpus Christi (feriado)', idea: 'Ajusta horarios y deja publicaciones programadas.' },
    { m: 6, d: 30, nombre: 'Día del Maestro', idea: 'Agradecimientos y contenido educativo.' },
    { regla: a => ultimo(a, 7, 0), nombre: 'Día de los Padres', idea: 'Campañas de regalos; historias de papás emprendedores.' },
    { m: 8, d: 16, nombre: 'Día de la Restauración (feriado)', idea: 'Contenido patrio y de identidad.' },
    { m: 9, d: 24, nombre: 'Día de Nuestra Señora de las Mercedes (feriado)', idea: 'Mensaje sobrio y respetuoso.' },
    { m: 11, d: 6, nombre: 'Día de la Constitución (feriado)', idea: 'Contenido cívico breve; revisa horarios.' },
    { m: 11, d: 26, nombre: 'Día Nacional del Merengue', idea: 'Reels con merengue, cultura y música local.' },
    { m: 12, d: 24, nombre: 'Nochebuena', idea: 'Saludo de marca y cierre de la campaña navideña.' },
    { m: 12, d: 25, nombre: 'Navidad', idea: 'Mensaje cálido del equipo; video corto de la oficina.' },
    { m: 12, d: 31, nombre: 'Despedida de año', idea: 'Resumen del año de la marca (recap en carrusel o reel).' }
  ];

  const INTERNACIONALES = [
    { regla: a => nesimo(a, 1, 1, 4), nombre: 'Día del Community Manager', idea: 'Celebra el rol y enseña cómo trabaja tu equipo de redes.' },
    { regla: a => nesimo(a, 2, 2, 2), nombre: 'Día de Internet Segura', idea: 'Tips de seguridad en redes para negocios.' },
    { m: 2, d: 13, nombre: 'Día Mundial de la Radio', idea: 'Audio, podcast y anuncios radiales para marcas locales.' },
    { m: 3, d: 8, nombre: 'Día Internacional de la Mujer', idea: 'Visibiliza a mujeres del equipo y clientas; evita promociones superficiales.' },
    { m: 3, d: 15, nombre: 'Día Mundial de los Derechos del Consumidor', idea: 'Transparencia y servicio al cliente en redes.' },
    { m: 3, d: 20, nombre: 'Día Internacional de la Felicidad', idea: 'Contenido positivo y detrás de cámaras alegres.' },
    { m: 4, d: 21, nombre: 'Día Mundial de la Creatividad y la Innovación', idea: 'Muestra el proceso creativo de Editable.' },
    { m: 4, d: 22, nombre: 'Día de la Tierra', idea: 'Solo prácticas sostenibles reales; evita el "greenwashing".' },
    { m: 4, d: 23, nombre: 'Día Internacional del Libro', idea: 'Recomienda libros de marketing, diseño y negocios.' },
    { m: 4, d: 27, nombre: 'Día Mundial del Diseño', idea: 'Antes y después de piezas; proceso de diseño.' },
    { m: 5, d: 3, nombre: 'Día Mundial de la Libertad de Prensa', idea: 'Contenido sobre información confiable.' },
    { regla: a => nesimo(a, 5, 4, 1), nombre: 'Día Mundial de la Contraseña', idea: 'Cómo proteger las cuentas de redes de un negocio.' },
    { m: 5, d: 17, nombre: 'Día de Internet', idea: 'Oportunidades digitales para negocios dominicanos.' },
    { m: 6, d: 21, nombre: 'Día del Selfie', idea: 'Selfies del equipo o reto con clientes.' },
    { m: 6, d: 30, nombre: 'Día Mundial de las Redes Sociales', idea: 'Fecha estrella para una agencia: resultados, tips y tu equipo.' },
    { m: 7, d: 17, nombre: 'Día Mundial del Emoji', idea: 'Juegos y encuestas con emojis en historias.' },
    { m: 8, d: 19, nombre: 'Día Mundial de la Fotografía', idea: 'Muestra producciones y el equipo fotográfico.' },
    { regla: a => mas(fecha(a, 1, 1), 255), nombre: 'Día del Programador', idea: 'Tecnología, automatización e IA aplicada al marketing.' },
    { m: 9, d: 27, nombre: 'Día Mundial del Turismo', idea: 'Contenido para clientes de turismo y hospitalidad en RD.' },
    { m: 9, d: 30, nombre: 'Día Internacional del Podcast', idea: 'Clips de audio o un episodio corto de la agencia.' },
    { m: 10, d: 1, nombre: 'Día Internacional del Café', idea: 'El café de la oficina: contenido cercano y divertido.' },
    { m: 10, d: 28, nombre: 'Día Internacional de la Animación', idea: 'Motion graphics y animaciones de marca.' },
    { m: 10, d: 31, nombre: 'Halloween', idea: 'Disfraces de oficina y contenido lúdico.' },
    { m: 11, d: 21, nombre: 'Día Mundial de la Televisión', idea: 'Video, spots y producción audiovisual.' },
    { regla: blackFriday, nombre: 'Black Friday', idea: 'Plan de ofertas, anuncios y calendario de publicaciones con antelación.' },
    { regla: a => mas(blackFriday(a), 3), nombre: 'Cyber Monday', idea: 'Ofertas en línea y tiendas digitales.' },
    { regla: a => mas(blackFriday(a), 4), nombre: 'Giving Tuesday', idea: 'Causas sociales y responsabilidad de marca.' }
  ];

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  function delAnio(a) {
    const r = [];
    const meter = (lista, ambito) => lista.forEach(e => {
      const f = e.regla ? e.regla(a) : fecha(a, e.m, e.d);
      r.push({ fecha: f, nombre: e.nombre, idea: e.idea || '', ambito: ambito });
    });
    meter(LOCALES, 'local'); meter(INTERNACIONALES, 'internacional');
    return r.sort((x, y) => x.fecha - y.fecha);
  }
  function delMes(a, m0) { return delAnio(a).filter(e => e.fecha.getMonth() === m0); }
  function proximas(desde, n) {
    const hoy = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
    return delAnio(hoy.getFullYear()).concat(delAnio(hoy.getFullYear() + 1)).filter(e => e.fecha >= hoy).slice(0, n || 5);
  }
  window.EFEMERIDES = {
    delMes, proximas, delAnio,
    nombreMes: f => MESES[f.getMonth()],
    mesCorto: f => MESES[f.getMonth()].slice(0, 3),
    diaCorto: f => DIAS[f.getDay()]
  };
})();
