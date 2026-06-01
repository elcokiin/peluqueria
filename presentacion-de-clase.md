## SEGURIDAD EN PWA
## Carlos Fernando Arenas
Escuela de Ingeniería de Sistemas
Electiva III –ProgressiveWeb Applications
## 2026-01

## Agenda
1.Seguridad en PWA
2.Content Security Policy(CSP)
3.Opciones para establecer HTTPS obligatorio

Seguridad en PWA

•La autenticación es el proceso mediante el cual los usuarios demuestran su identidad y verifican que
tienen la autorización adecuada para acceder a la aplicación.
•Por otro lado, la autorización garantiza que esos usuarios solo tengan acceso a las áreas y al contenido
que tienen permitido ver, al tiempo que impone restricciones sobre lo que pueden hacer.
•Para implementar una autenticación y autorización efectivas en tu PWA, existen algunas buenas
prácticas que debes seguir.
•En primer lugar, utilice contraseñas seguras que sean difíciles de adivinar o descifrar para los
hackers o los bots, así como la autenticación de dos factores (2FA) para mayor seguridad.
•En segundo lugar, utilice el control de acceso basado en roles (RBAC) para la autorización. Esto
establece permisos de usuario en función de los roles, los cuales se pueden ajustar rápidamente
cuando sea necesario.
•Por último, utilice HTTPS con cifrado SSL/TLS para todo el tráfico web de su PWA. Esto garantizará
que todos los datos enviados entre clientes y servidores estén cifrados, protegiendo la
información del usuario de agentes malintencionados.
Seguridad en PWA

•Es importante tener en cuenta que la autenticación y la autorización también pueden ser vulnerables
a ataques de usuarios malintencionados si no se implementan correctamente. Por lo tanto, es
fundamental estar al tanto de los vectores de ataque comunes, como las amenazas de inyección SQL y
los ataques de secuencias de comandos entre sitios (XSS).
•Implementando medidas de seguridad adecuadas, como la validación de entradas y las pruebas de
penetración, puede proteger su PWA de estas amenazas.
Seguridad en PWA (2)

•SSL (Secure Sockets Layer) y TLS (Transport Layer Security) son protocolos criptográficos que
proporcionan autenticación, cifrado e integridad de los datos.
•Estos protocolos permiten conexiones seguras entre navegadores web, aplicaciones y servidores
a través de Internet mediante un proceso de intercambio de claves cifrado.
•Para proteger tu PWA de forma eficaz, debes asegurarte de seguir algunas buenas prácticas para
implementar HTTPS y SSL/TLS en PWA:
•Utilice HTTPS en todas partes: asegúrese de que todas sus páginas se sirvan a través de
HTTPS, en lugar de conexiones HTTP no seguras. Esto ayudará a garantizar que los datos de
sus usuarios estén protegidos mientras navegan por su sitio web o aplicación.
•Instale un certificado SSL: Esto habilitará las conexiones HTTPS en su sitio y proporcionará
autenticación entre el servidor que aloja su PWA y los usuarios que lo visitan.
•Prueba las conexiones con regularidad: Asegúrate de que todas tus conexiones sigan siendo
seguras probándolas periódicamente para detectar cualquier vulnerabilidad o riesgo para la
seguridad.
Mejores prácticas para implementar HTTPS y
SSL/TLS en PWA

•Para proteger tu PWA de forma eficaz, debes asegurarte de seguir algunas buenas prácticas para
implementar HTTPS y SSL/TLS en PWA:
•Implementación de fijación de certificados: La fijación de certificados es una importante
medida de seguridad que consiste en vincular un dominio host a un certificado SSL
específico. Esto previene ataques de intermediario y ayudará a proteger su PWA de agentes
maliciosos.
•Mantén tus protocolos de seguridad actualizados: actualiza periódicamente los protocolos
de seguridad de tu servidor web para asegurarte de que siempre estás utilizando la versión
más segura.
•Configure las reglas de firewall adecuadas: Configure las reglas de su firewall para permitir
solo conexiones seguras y bloquear cualquier tráfico sospechoso. Esto ayudará a proteger su
PWA de ataques maliciosos.
Mejores prácticas para implementar HTTPS y
SSL/TLS en PWA (2)

•Tanto el cross-site scripting como la falsificación de solicitudes entre sitios son
amenazas de seguridad que pueden causar graves daños a las PWA.
•El ataque XSS funciona inyectando código malicioso en el navegador a través de una
aplicación web vulnerable.
•Este código puede utilizarse para extraer datos de la PWA, como contraseñas o
números de tarjetas de crédito, o para ejecutar cualquier otro código malicioso.
•Por otro lado, CSRF es una forma de ataque que manipula el navegador del usuario
para que envíe solicitudes falsificadas sin que este lo sepa.
•Esto se puede utilizar para ejecutar acciones dentro de una aplicación, como
transferir dinero o eliminar datos.
Cómo protegerse contra el XSS y la falsificación de
solicitudes entre sitios (CSRF)

•Esto implica principalmente verificar si la información ingresada por el usuario se
ajusta al formato esperado. Por ejemplo, los datos en el campo de texto del correo
electrónico deben corresponder a una dirección de correo electrónico válida, y los
datos en el campo de texto del nombre de usuario deben seguir la estructura
esperada para un nombre de usuario.
•El proceso de saneamiento limpia esta entrada eliminando cualquier dato malicioso
que pudiera usarse en ataques como XSS e inyección SQL . Estas dos medidas de
seguridad son fundamentales para cualquier aplicación web y constituyen la primera
línea de defensa contra los datos maliciosos que los usuarios puedan introducir.
Validación y saneamiento de datos

•Validación de formularios del lado del cliente
•La validación de formularios del lado del cliente es la comprobación inicial del
proceso de validación de datos. Sin embargo, nunca se debe confiar únicamente
en ella para garantizar la seguridad, ya que JavaScript puede deshabilitarse o
manipularse, eludiendo fácilmente las comprobaciones del lado del cliente.
•Tenga en cuenta el tipo de datos esperados, su longitud, sus rangos válidos y que
siempre se segure que los datos tienen el formato esperado por la aplicación:
Validación y saneamiento de datos- Implementación

•Validación del lado del servidor
•La validación del lado del servidor
garantiza que todas las entradas se
validen, independientemente del
estado de la validación del lado del
cliente.
•Aumenta la seguridad al asegurar
que los datos maliciosos nunca
lleguen a la lógica principal de la
aplicación ni a la validación de la
base de datos en el servidor.
Además, es menos vulnerable a la
manipulación.
Validación y saneamiento de datos- Implementación
## (2)

•Desinfección:
•La sanitización garantiza
que cualquier dato
potencialmente dañino se
elimine o se modifique a
un formato seguro.
Validación y sanitización de datos- Implementación (3)

Content Security Policy (CSP)

•Es una capa de seguridad adicional que ayuda a prevenir y mitigar algunos tipos de ataque,
incluyendo Cross Site Scripting ( XSS ) y ataques de inyección de datos. Estos ataques son
usados con diversos propósitos, desde robar información hasta desfiguración de sitios o
distribución de malware .
•CSP está diseñado para ser completamente retrocompatible (excepto la versión 2 de CSP,
donde hay algunas menciones explícitas de inconsistencia en la retrocompatibilidad; más
detalles aquí sección 1.1). Los navegadores que no lo soportan siguen funcionando con los
servidores que lo implementan y viceversa: los navegadores que no soportan CSP
simplemente lo ignoran, funcionando como siempre y delegando a la política mismo-origen
para contenido web. Si el sitio web no ofrece la cabecera CSP, los navegadores igualmente
usan la política estándar mismo-origen.
•Para habilitar CSP, necesitas configurar tu servidor web para que devuelva la cabecera HTTP
Content-Security-Policy (en ocasiones verás menciones de la cabecera X-Content-Security-
Policy, pero se trata de una versión antigua y no necesitas especificarla más).
Content Security Policy (CSP)

•La configuración de la Política de Seguridad del Contenido (CSP), consiste en
agregar a una página web la cabecera HTTP Content-Security-Policy, y darle
valores para controlar los recursos que el agente de usuario puede cargar para
esa página.
•Por ejemplo, una página que carga y muestra imágenes podría permitir
imágenes desde cualquier lugar, pero pudiera restringir una acción de
formulario a una ruta específica.
•Una Política de Seguridad de Contenido adecuadamente diseñada ayuda a
proteger una página contra un ataque de scripts entre sitios. Este artículo
explica cómo construir dichas cabeceras correctamente y proporciona
ejemplos.
Cómo aplicar CSP en una aplicación PWA?

•La política de seguridad de contenido (CSP) debe enviarse al navegador en el
encabezado Content-Security-Policy de respuesta. Debe aplicarse a todas las
respuestas a todas las solicitudes, no solo al documento principal.
•También puedes especificarlo mediante el atributo http-equiv del elemento de tu
documento <meta>, lo cual resulta útil en algunos casos, como en aplicaciones de
una sola página renderizadas en el lado del cliente que solo contienen recursos
estáticos, ya que así evitas depender de la infraestructura del servidor. Sin embargo,
esta opción no es compatible con todas las funciones de CSP.
•La política se especifica mediante una serie de directivas separadas por punto y
coma. Cada directiva controla un aspecto diferente de la política de seguridad. Cada
directiva tiene un nombre, seguido de un espacio y un valor. Las distintas directivas
pueden tener sintaxis diferentes.
CSP – Descripción general

•Por ejemplo, considere el siguiente CSP:
•Establece dos directivas:
•La directiva default-src está configurada para'self'
•La directiva img-src está configurada en 'self' example.com.
CSP – Descripción general (2)

•La primera directiva, default-src, le indica al navegador que cargue solo los recursos
que sean del mismo origen que el documento, a menos que otras directivas más
específicas establezcan una política diferente para otros tipos de recursos.
•La segunda, img-src, le indica al navegador que cargue las imágenes que sean del
mismo origen o que se sirvan desde example.com.
CSP – Descripción general (3)

•Una CSP se puede utilizar para controlar los recursos que un documento puede
cargar. Esto se usa principalmente para protegerse contra ataques de secuencias de
comandos entre sitios (XSS).
•Un ataque de secuencias de comandos entre sitios (XSS) es aquel en el que un
atacante puede ejecutar su código en el contexto del sitio web objetivo. Este código
puede entonces hacer cualquier cosa que el propio código del sitio web podría hacer,
incluyendo, por ejemplo:
•acceder o modificar el contenido de las páginas cargadas del sitio.
•acceder o modificar el contenido en el almacenamiento local
•realizar solicitudes HTTP con las credenciales del usuario, lo que les permite
suplantar la identidad del usuario o acceder a datos confidenciales.
CSP – Controlando la carga de recursos con XSS

•Un ataque XSS es posible cuando un sitio web acepta algún dato de entrada que
podría haber sido manipulado por un atacante (por ejemplo, parámetros de URL o un
comentario en una publicación de blog) y luego lo incluye en la página sin sanitizarlo:
es decir, sin asegurarse de que no pueda ejecutarse como JavaScript.
•Si la desinfección falla, el código malicioso inyectado puede adoptar diversas formas
en el documento, entre ellas:
•Una etiqueta  <script> que enlaza con una fuente maliciosa:
•Una etiqueta  <script> que incluye JavaScript en línea:
CSP – Controlando la carga de recursos con XSS (2)

•Al controlar la carga de recursos, un CSP puede brindar protección contra todos estos
problemas. Con un CSP, usted puede:
•Definir las fuentes permitidas para archivos JavaScript y otros recursos,
bloqueando efectivamente las cargas dehttps://evil.example.com
•Deshabilitar etiquetas de script en línea
•Permitir únicamente etiquetas de script que tengan el nonce o hash correcto.
•Deshabilitar los controladores de eventos en línea
•Deshabilitar URLS javaScript
•Deshabilitar API peligrosas como eval()
CSP – Controlando la carga de recursos con XSS (3)

•Las directivas Fetch se utilizan para especificar una categoría particular de recursos que un
documento tiene permitido cargar, como JavaScript, hojas de estilo CSS, imágenes, fuentes,
etc.
•Existen diferentes directivas de obtención para diferentes tipos de recursos. Por ejemplo:
•script-src: Establece las fuentes permitidas para JavaScript.
•style-src: Establece las fuentes permitidas para las hojas de estilo CSS.
•img-src: Establece las fuentes permitidas para las imágenes.
•Una directiva de obtención especial es default-src, que establece una política de reserva para
todos los recursos cuyas directivas no se enumeran explícitamente.
•Cada directiva de obtención se especifica mediante una sola palabra clave 'none’ o una o más
expresiones de origen , separadas por espacios. Cuando se enumeran varias expresiones de
origen, si alguno de los métodos permite el recurso, este se permite.
CSP – Directivas de obtención

•Por ejemplo, la CSP que se muestra a continuación establece dos directivas de obtención:
•default-src:  Se le da la expresión de fuente única'self'
•img-src: Se le proporcionan dos expresiones fuente: 'self’ y example.com
CSP – Directivas de obtención (2)
•El efecto de esto es que:
•Las imágenes deben ser del
mismo origen que el
documento o cargadas desde
example.com
•Todos los demás recursos
deben tener el mismo origen
que el documento.

•Para bloquear un tipo de recurso por completo, utilice la palabra 'none' clave. Por ejemplo, la siguiente
directiva bloquea todos los recursos <object> y <embed>:
•Tenga en cuenta que 'none'no se puede combinar con ningún otro método en una directiva particular:
en la práctica, si se proporcionan otras expresiones de origen junto con 'none', se ignoran.
•Nonce:
•A nonce el enfoque recomendado para restringir la carga de recursos <script> y <style>.
•Con un nonce, el servidor genera un valor aleatorio para cada respuesta HTTP y lo incluye en una
directiva script-src y/o una directiva style-src
•El servidor luego incluye este valor como el valor del atributo nonce de todas las etiquetas
<script>y/o <style>que pretende incluir en el documento.
•El navegador compara ambos valores y carga el recurso solo si coinciden. La idea es que, incluso si
un atacante logra insertar código JavaScript en la página, no sabrá qué valor aleatorio utilizará el
servidor, por lo que el navegador se negará a ejecutar el script. Para que este método funcione, no
debe ser posible que un atacante adivine el valor aleatorio (nonce).
CSP – Recursos de bloqueo

•En cada solicitud, el servidor genera un nuevo nonce, lo inserta
en la CSP y en las <script>etiquetas del documento devuelto.
Tenga en cuenta que el servidor:
•Genera un nuevo nonce para cada solicitud
•Se pueden usar nonces tanto con scripts externos como en
línea.
•Utiliza el mismo nonce para todas <script>las etiquetas del
documento
•Es importante que el servidor utilice algún tipo de plantilla para
insertar nonces, y que no los inserte simplemente en todas
<script>las etiquetas: de lo contrario, el servidor podría insertar
nonces inadvertidamente en scripts que fueron inyectados por
un atacante.
•Tenga en cuenta que los nonces solo se pueden usar para
elementos que tengan un atributo nonce: es decir, solo
elementos <script> y <style>
CSP – Recursos de bloqueo - Ejemplo

•Las directivas fetch también pueden usar un hash del script para garantizar su integridad. Con este
método, el servidor:
•Calcula un hash del contenido del script utilizando una función hash (una de SHA-256, SHA-384 o SHA-
## 512).
•Crea una codificación Base64 del resultado
•Agrega un prefijo que identifica el algoritmo hash utilizado (uno de sha256-, sha384-, o sha512).
•Luego agrega el resultado a la directiva:
•Cuando el navegador recibe el documento, aplica un hash al script, compara el resultado con el valor
del encabezado y carga el script solo si coinciden.
•Los scripts externos también deben incluir el atributo integrity para que este método funcione.
CSP – Hashes

•Tenemos un hash independiente para cada script
del documento.
•Para el script externo "main.js", también
incluimos el integrityatributo y le damos el
mismo valor.
•A diferencia del ejemplo que utiliza nonces,
tanto la CSP como el contenido pueden ser
estáticos, ya que los hashes permanecen
invariables. Esto hace que las políticas basadas
en hashes sean más adecuadas para páginas
estáticas o sitios web que dependen de la
renderización del lado del cliente.
CSP – Hashes - Ejemplo

•Las directivas Fetch pueden especificar un esquema, como https:, para permitir recursos
que se sirven utilizando ese esquema.
•Esto, por ejemplo, permite que una política requiera HTTPS para todas las cargas de
recursos:
CSP – Políticas basadas en esquemas

•Las directivas Fetch pueden controlar la carga de recursos en función de la ubicación del
recurso.
•La palabra clave 'self’ permite recursos que tienen el mismo origen que el propio
documento:
•También puedes especificar uno o más nombres de host, incluyendo comodines, y solo se
permitirán los recursos servidos desde esos hosts. Esto podría usarse, por ejemplo, para
permitir que el contenido se sirva desde una CDN de confianza.
CSP – Políticas basadas en la ubicación

•Si una CSP contiene una directiva default-src o script-src, entonces no se permitirá la
ejecución de JavaScript en línea a menos que se tomen medidas adicionales para
habilitarlo. Esto incluye:
•Código JavaScript incluido dentro de un elemento <script> en la página:
•JavaScript en un atributo de controlador de eventos en línea:
CSP – JavaScript en línea

•Esto incluye:
•Código JavaScript en un llamado a una URL javascript:
•La palabra clave unsafe-inline se puede usar para anular esta restricción. Por ejemplo,
la siguiente directiva requiere que todos los recursos sean del mismo origen, pero
permite JavaScript en línea:
•Sin embargo el uso de esta CSP contradice su propósito es una fuente de los vectores
XSS más comunes y uno de los objetivos más básicos de una CSP es prevenir su uso
incontrolado.
CSP – JavaScript en línea (2)

•Al igual que con JavaScript en línea, si una CSP contiene una directiva default-src ,
entonces no se permitirá la ejecución de API similares.
•Esto incluye, entre otras API:script-src y eval():
•El llamado a la función Eval() en sí misma:
•El constructor Function():
•El argumento de cadena para setTimeout()y setInterval():
•La palabra clave unsafe-eval se puede usar para anular este comportamiento, y al igual
que con unsafe-inline, y por las mismas razones: los desarrolladores deben evitar unsafe-
eval .
CSP – Eval() y APIs similares

•Para controlar la carga de scripts como medida de mitigación contra XSS, la práctica
recomendada es usar directivas de obtención basadas en nonce o hash . Esto se denomina
CSP estricta . Este tipo de CSP tiene dos ventajas principales sobre una CSP basada en la
ubicación (generalmente llamada CSP de lista de permitidos ):
•Las políticas de seguridad de contenido (CSP) con listas blancas son difíciles de
implementar correctamente y, a menudo, incluyen inadvertidamente dominios
inseguros en la lista blanca, por lo que no ofrecen una protección eficaz contra XSS.
•Las listas de permisos de la Política de Seguridad de Contenido (CSP) pueden ser muy
extensas y difíciles de mantener, especialmente al usar scripts que están fuera de
nuestro control. Según el artículo " Cómo aprendí a dejar de preocuparme y a amar la
Política de Seguridad de Contenido" , para integrar Google Analytics, se le pide a un
desarrollador que agregue 187 dominios de Google a la lista de permisos.
CSP Estricto

•Una CSP estricta basada en nonce tiene este aspecto:
•En este CSP:
•Utiliza nonces para controlar qué recursos de JavaScript se permiten cargar.
•Bloquea todas las incrustaciones de objetos
•Bloquea todos los usos del elemento <base> para establecer una URI base.
CSP Estricto (2)

•Un CSP estricto basado en hash es lo mismo, excepto que utiliza hashes en lugar de
nonces:
•Las directivas basadas en nonce son más fáciles de mantener si se pueden generar
respuestas, incluido el contenido, de forma dinámica. De lo contrario, es necesario usar
directivas basadas en hash. El problema con las directivas basadas en hash es que hay que
recalcular y volver a aplicar el hash si se modifica el contenido del script.
CSP Estricto (3)

•La CSP estricta es difícil de implementar cuando se utilizan scripts que no están bajo su
control. Si un script de terceros carga scripts adicionales o utiliza scripts en línea, la
implementación fallará, ya que el script de terceros no transmitirá el nonce ni el hash.
•La palabra clave strict-dynamic se proporciona para ayudar a solucionar este problema. Se
trata de una palabra clave que se puede incluir en una directiva `fetch` y tiene el efecto de
que si un script tiene un nonce o un hash asociado, entonces se le permitirá cargar otros
scripts que no tengan nonces o hashes.
•Es decir, la confianza depositada en un script mediante un nonce o un hash se transmite a
los scripts que el script original carga (y a los scripts que estos cargan, y así
sucesivamente).
CSP – strict-dynamic

•Considere la página HTML. Incluye un script
"main.js", que crea y agrega otro script, "main2.js":
•Se crea el siguiente CSP para este Java Script:
•Este CSP permitirá la carga del script "main.js"
porque su hash coincide con el valor de la CSP. Sin
embargo, su intento de cargar "main2.js" fallará.
•Si añadimos esto 'strict-dynamic'al CSP, entonces se
permitirá que "main.js" cargue "main2.js":
CSP – strict-Dynamic - Ejemplo

•Para facilitar la implementación, CSP puede implementarse en modo de solo informe. La política
no se aplica, pero cualquier infracción se envía al punto final de informes especificado en la
política. Además, se puede usar un encabezado de solo informe para probar una revisión futura de
una política sin implementarla realmente.
•Puedes usar el encabezado HTTP Content-Security-Policy-Report-Only para especificar tu política,
de esta manera:
•Si tanto un Content-Security-Policy-Report-Onlyencabezado como un Content-Security-
Policyencabezado están presentes en la misma respuesta, se respetan ambas políticas. Content-
Security-Policy se aplica la política especificada en los encabezados, mientras que la Content-
Security-Policy-Report-Onlypolítica que genera informes no se aplica.
CSP – Probando en modo informe

•El método recomendado para informar sobre infracciones de CSP es utilizar la API de informes ,
declarando los puntos finales Reporting-Endpoints y especificando uno de ellos como destino del
informe de CSP mediante la directiva Content-Security-Policydel encabezado report-to.
•Un servidor puede informar a los clientes dónde enviar los informes mediante el encabezado de
respuesta HTTP Reporting-Endpoints. Este encabezado define una o más URL de punto final como
una lista separada por comas.
•Por ejemplo, para definir un punto final de informes llamado csp-endpoint que acepta informes en
https://example.com/csp-reports, el encabezado de respuesta del servidor podría tener este
aspecto:
CSP – Probando en modo informe (2)

•Cuando se produce una infracción de CSP, el
navegador envía el informe como un objeto JSON al
punto final especificado mediante una operación
HTTP POST, con un valor Content-Type de
application/reports+json.
•Este es el resultado de este archivo JSON:
CSP – Probando en modo informe (3)

Opciones para mantener HTTPS obligatorio

•En el proceso de actualización de un sitio a HTTPS, a veces el sitio sirve el documento principal a
través de HTTPS, pero sus recursos se sirven a través de HTTP, por ejemplo, utilizando un marcado
como este:
•Esto se denomina contenido mixto , y la presencia de recursos no seguros debilita
considerablemente la protección que ofrece HTTPS. Según el algoritmo de contenido mixto que
implementan los navegadores, si un documento se sirve a través de HTTPS, los recursos no seguros
se clasifican en «contenido actualizable» y «contenido bloqueable». El contenido actualizable se
convierte a HTTPS, y el contenido bloqueable se bloquea, lo que podría provocar que la página
deje de funcionar.
•La solución definitiva para el contenido mixto es que los desarrolladores carguen todos los
recursos a través de HTTPS. Sin embargo, incluso si un sitio web puede servir todo su contenido
mediante HTTPS, puede resultar muy difícil (o incluso prácticamente imposible, en el caso del
contenido archivado) para un desarrollador reescribir todas las URL que el sitio utiliza para cargar
los recursos.
Solicitudes al sitio no seguras

•La directiva upgrade-insecure-requests tiene como objetivo solucionar este problema. Esta
directiva no tiene ningún valor: para configurarla, simplemente incluya el nombre de la directiva:
•Si esta directiva está configurada en un documento, el navegador actualizará automáticamente a
HTTPS cualquier URL HTTP en los siguientes casos:
•Solicitudes para cargar recursos (como imágenes, scripts o fuentes)
•Solicitudes de navegación (como destinos de enlaces) que tienen el mismo origen que el
documento
•Solicitudes de navegación en contextos de navegación anidados, como iframes
•Envíos de formularios
•Sin embargo, las solicitudes de navegación de nivel superior cuyo destino sea un origen diferente
no se actualizarán.
Opciones para mantener HTTPS obligatorio

•Supongamos que el documento en https://example.orgse sirve con una CSP que contiene la
directiva upgrade-insecure-requests, y el documento contiene un marcado como este:
•El navegador actualizará automáticamente ambas solicitudes a HTTPS.
•Supongamos que el documento también contiene esto:
•El navegador actualizará el primer enlace a HTTPS, pero no el segundo, ya que este último navega a
un origen diferente.
Opciones para mantener HTTPS obligatorio -
## Ejemplo

•Las directivas require-trusted-types-for y trusted-types permiten protegerse contra ataques
de secuencias de comandos entre sitios (XSS) del lado del cliente , al garantizar que
cualquier entrada se haya procesado mediante una transformación para garantizar su
seguridad antes de enviarla a una API de plataforma web que, de otro modo, podría
ejecutarla como código.
•Las directivas vse pueden utilizar para aplicar la API de Trusted Types . Esto permite
protegerse contra ataques de secuencias de comandos entre sitios (XSS) del lado del
cliente al exigir que cualquier entrada se procese mediante una función de transformación,
lo que brinda la oportunidad de garantizar su seguridad antes de enviarla a una API de
plataforma web que, de otro modo, podría ejecutarla como código.
Opciones para mantener HTTPS obligatorio –
Requerir tipos confiables

Opciones para mantener HTTPS obligatorio –
Requerir tipos confiables - Ejemplo
•Prohíbe el uso de cadenas con
funciones receptoras de inyección XSS
DOM y requiere que coincidan los
tipos creados por las políticas de
## Trusted Type.

Referencias bibliográficas
- AppInstitute. (2025, octubre). Checklist for PWA Performance Before Deployment. Recuperado de  https://appinstitute.com/checklist-for-pwa-performance-before-deployment/
- Arroyo Bandala, Y. M. (2023). Aplicaciones de web progresivas (PWA) como alternativa a aplicaciones  móviles nativas. Repositorio Institucional, Universidad de Quintana Roo, México.
- CodersLab. (2024, septiembre). Aplicaciones web progresivas: qué son, ventajas y ejemplos. Recuperado de https://coderslab.io/blog/aplicaciones-web-progresivas-que-son-ventajas-y-ejemplos/
- ColaniInfoTech. (2025, junio). Progressive Web App (PWA) Market Trends (2025). Recuperado de  https://colaninfotech.com/blog/progressive-web-app-pwa-market-trends-2025/
- Granthaalayah Publication. (2024). "A Study on Progressive Web Apps: Impact on Web Application Landscape". ShodhKosh - A Journal of Scholarly Studies.
- Herrera, F. (2025, enero). PWA - Aplicaciones Web Progresivas: De cero a experto. DevTalles  Academy. Recuperado de https://fernando-herrera.com/course/pwa-web-progresiva
- IsfdytDigital. (2025, septiembre). El auge de las aplicaciones Web Progresivas (PWA) en 2025. Recuperado de https://isfdytdigital.net.ar/el-auge-de-las-aplicaciones-web-progresivas-pwa-en-2025/
- KeepCoding. (2025, noviembre). PWA Offline 2025: crea apps web que funcionan sin internet.Recuperado de https://keepcoding.io/blog/pwa-offline/
- MyNextDeveloper. (2024, junio). Aplicaciones web progresivas: sitios móviles que parecen aplicaciones nativas. Recuperado de https://mynextdeveloper.com/es/blogs/progressive-web-apps/
- Nikiforakis, N., et al. (2020). "Exacerbating Web Attacks Via Service Workers Caches". En Proceedings of the 14th USENIX Workshop on Offensive Technologies (WOOT '20). USENIX Association.
- Pragma Academy. (s.f.). ¿Qué son aplicaciones web progresivas? Recuperado de https://www.pragma.com.co/academia/lecciones/que-son-aplicaciones-web-progresivas
- Rodríguez, R. A. (2020). Aplicaciones Web Progresivas Enfocadas en el Uso de Tecnologías Emergentes. SEDICI - Repositorio Institucional de la Universidad Nacional de La Plata, Argentina.
- Tamire, W. (2019). Evaluation of Progressive Web Application to develop an integrated mobile solution. Master's Thesis. Aalto University School of Science, Helsinki, Finlandia.
- Sinha, S. (2024). "Progressive Web App: An Adventure into Faster Web Applications". International Journal of Research Publication and Reviews (IJRPR), Vol. 5, No.
- TecnoSoluciones. (2023, agosto). Aplicaciones Web Progresivas para portales y comercio electrónico. Recuperado de https://tecnosoluciones.com/que-son-las-aplicaciones-web-progresivas-y-por-que-son
ideales-para-su-portal-web-o-comercio-electro
- The Ad Firm. (2025, mayo). Essential PWA Features Every Website Needs in 2025. Recuperado de https://www.theadfirm.net/progressive-web-apps-in-2025-essential-features-every-website-needs/
