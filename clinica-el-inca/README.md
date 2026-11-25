# Club de Leones El Inca — piloto local MERN
Aplicación independiente dentro del repositorio existente. No modifica el sistema original. Solo datos ficticios: sin autenticación, permisos clínicos ni seguridad de producción. No exponer a internet.
## Mac
Instalar Node 22+, Python 3.10+, Docker Desktop. Para OCR: brew install tesseract tesseract-lang.
Desde esta carpeta:
```sh
docker compose up -d
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm install
npm run api
```
En otra terminal, misma carpeta: npm run dev. Abrir http://localhost:5173.
## Flujo
Plantillas PDF: cargar un PDF en Admisiones, revisar campos detectados o agregarlos manualmente con coordenadas en puntos PDF, asignar claves compartidas identity y name (obligatorias para publicar), phone, birth_date, etc. Publicar. Abrir Admisiones, seleccionar plantilla y llenar datos; guardar crea paciente y PDF. Derivar. Cargar y publicar plantilla de la especialidad, reutilizar claves compartidas; seleccionar paciente, completar campos adicionales, guardar y abrir PDF para imprimir. Historial separado por documento.
OCR local es heurístico, detecta etiquetas con dos puntos; no garantiza detectar todas las casillas. La revisión manual es imprescindible. Los PDFs sin campos se rellenan por coordenadas sobre el original. Solo campos de texto en este piloto. Las plantillas publicadas son inmutables; cargar otra versión para cambios. MongoDB guarda esquemas dinámicos y valores compartidos, sin crear una colección por PDF.
## Marca
Nombre y dirección consultados en https://www.findhealthclinics.org/EC/Quito/1083954615042258/Club-de-Leones-El-Inca . Facebook no accesible directamente. Colocar el logo autorizado en public/logo.png. Departamentos iniciales son ejemplos configurables.
## Producción (pendiente)
Autenticación, autorización por departamento, auditoría, cifrado, validación de archivos, copias verificadas, política de conservación y revisión LOPDP. No usar configuraciones ni credenciales del proyecto anterior. AWS Lightsail y S3 son opciones para piloto, dimensionar MongoDB y OCR; no desplegado.
## Actualización: un formulario por departamento
Al arrancar se selecciona el formulario publicado más reciente por departamento si todavía no hay uno activo. Publicar una nueva plantilla cambia el formulario activo; los documentos anteriores se conservan. Las claves compartidas se sugieren en el editor. La selección de paciente abre automáticamente el formulario activo. Reiniciar API y frontend después de actualizar. No borrar data/ ni el volumen MongoDB.
