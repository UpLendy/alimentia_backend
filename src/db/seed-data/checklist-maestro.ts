// Copiado 1:1 de "Alimentia Checklist Maestro.xlsx" (hoja "Checklist Maestro").
// priority: Alta -> "alta", Media -> "media", Baja -> "baja".
// Esto es el catálogo de referencia de TODO lo que Alimentia debe cubrir a
// futuro; el estado real de avance de cada cliente vive en
// company_checklist_status, no aquí (esta tabla es un catálogo, no vuelve a
// cambiar salvo que el checklist maestro cambie).

export interface ChecklistSeedRow {
  category: string;
  item: string;
  appliesTo: string;
  normReference: string;
  priority: "alta" | "media" | "baja";
  sortOrder: number;
}

export const checklistMaestroSeed: ChecklistSeedRow[] = [
  { sortOrder: 1, category: "Cumplimiento Normativo (Res. 2674)", item: "Limpieza y desinfección", appliesTo: "Todos", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 2, category: "Cumplimiento Normativo (Res. 2674)", item: "Control de plagas", appliesTo: "Todos", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 3, category: "Cumplimiento Normativo (Res. 2674)", item: "Manejo de residuos sólidos y líquidos", appliesTo: "Todos", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 4, category: "Cumplimiento Normativo (Res. 2674)", item: "Abastecimiento de agua potable", appliesTo: "Todos", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 5, category: "Cumplimiento Normativo (Res. 2674)", item: "Edificaciones e instalaciones", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 6", priority: "alta" },
  { sortOrder: 6, category: "Cumplimiento Normativo (Res. 2674)", item: "Equipos y utensilios", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 8-9", priority: "media" },
  { sortOrder: 7, category: "Cumplimiento Normativo (Res. 2674)", item: "Programa de calibración de equipos", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 25", priority: "media" },
  { sortOrder: 8, category: "Cumplimiento Normativo (Res. 2674)", item: "Personal manipulador — examen médico anual", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 11", priority: "alta" },
  { sortOrder: 9, category: "Cumplimiento Normativo (Res. 2674)", item: "Personal manipulador — plan de capacitación continuo (mín. 10h/año)", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 12", priority: "alta" },
  { sortOrder: 10, category: "Cumplimiento Normativo (Res. 2674)", item: "Prácticas higiénicas y medidas de protección", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 14", priority: "media" },
  { sortOrder: 11, category: "Cumplimiento Normativo (Res. 2674)", item: "Control de materias primas y proveedores", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 16", priority: "alta" },
  { sortOrder: 12, category: "Cumplimiento Normativo (Res. 2674)", item: "Requisitos higiénicos de fabricación / contaminación cruzada", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 26", priority: "media" },
  { sortOrder: 13, category: "Cumplimiento Normativo (Res. 2674)", item: "Almacenamiento", appliesTo: "Todos", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 14, category: "Cumplimiento Normativo (Res. 2674)", item: "Transporte", appliesTo: "Todos", normReference: "Res. 2674/2013", priority: "media" },
  { sortOrder: 15, category: "Cumplimiento Normativo (Res. 2674)", item: "Distribución y comercialización", appliesTo: "Todos", normReference: "Res. 2674/2013", priority: "media" },
  { sortOrder: 16, category: "Cumplimiento Normativo (Res. 2674)", item: "Registro / Notificación sanitaria INVIMA — estado y vigencia", appliesTo: "Todos", normReference: "Res. 2674/2013", priority: "alta" },

  { sortOrder: 17, category: "Monitoreo y Alarmas", item: "Alarma vencimiento certificado médico", appliesTo: "Todos", normReference: "—", priority: "alta" },
  { sortOrder: 18, category: "Monitoreo y Alarmas", item: "Alarma vencimiento capacitación / carné", appliesTo: "Todos", normReference: "—", priority: "alta" },
  { sortOrder: 19, category: "Monitoreo y Alarmas", item: "Alarma calibración de equipos pendiente", appliesTo: "Todos", normReference: "—", priority: "media" },
  { sortOrder: 20, category: "Monitoreo y Alarmas", item: "Alarma fumigación / control de plagas vencido", appliesTo: "Todos", normReference: "—", priority: "alta" },
  { sortOrder: 21, category: "Monitoreo y Alarmas", item: "Alarma análisis de agua sin renovar", appliesTo: "Todos", normReference: "—", priority: "media" },
  { sortOrder: 22, category: "Monitoreo y Alarmas", item: "Monitoreo de temperatura en tiempo real (sensores IoT)", appliesTo: "Cárnicos, Bodega, Restaurante", normReference: "Benchmark: FoodDocs", priority: "alta" },
  { sortOrder: 23, category: "Monitoreo y Alarmas", item: "Notificación push / WhatsApp antes del vencimiento", appliesTo: "Todos", normReference: "—", priority: "alta" },

  { sortOrder: 24, category: "Trazabilidad y Recall", item: "Registro por lote (materia prima a producto terminado)", appliesTo: "Cárnicos, Bodega", normReference: "Benchmark: FoodDocs", priority: "alta" },
  { sortOrder: 25, category: "Trazabilidad y Recall", item: "Cálculo automático de fechas de vencimiento y lotes", appliesTo: "Cárnicos, Bodega", normReference: "Benchmark: FoodDocs", priority: "media" },
  { sortOrder: 26, category: "Trazabilidad y Recall", item: "Plan de retiro de producto (recall)", appliesTo: "Cárnicos, Bodega", normReference: "Benchmark: FoodDocs", priority: "alta" },
  { sortOrder: 27, category: "Trazabilidad y Recall", item: "Gestión de alérgenos y etiquetado", appliesTo: "Todos", normReference: "Benchmark: ComplianceMate", priority: "media" },

  { sortOrder: 28, category: "Proveedores", item: "Gestión de certificaciones y documentación de proveedores", appliesTo: "Todos", normReference: "Benchmark: ComplianceMate", priority: "alta" },
  { sortOrder: 29, category: "Proveedores", item: "Evaluación / scorecard de proveedores", appliesTo: "Todos", normReference: "—", priority: "media" },
  { sortOrder: 30, category: "Proveedores", item: "Registro de recepción con foto, lote y condiciones", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 16", priority: "media" },

  { sortOrder: 31, category: "No Conformidades y Documentos", item: "No conformidades y acciones correctivas (CAPA)", appliesTo: "Todos", normReference: "Benchmark: FoodDocs", priority: "alta" },
  { sortOrder: 32, category: "No Conformidades y Documentos", item: "Gestión de incidentes", appliesTo: "Todos", normReference: "Benchmark: ComplianceMate", priority: "media" },
  { sortOrder: 33, category: "No Conformidades y Documentos", item: "Control de versiones de documentos con flujo de aprobación", appliesTo: "Todos", normReference: "—", priority: "media" },
  { sortOrder: 34, category: "No Conformidades y Documentos", item: "Firma electrónica con auditoría de usuario y fecha", appliesTo: "Todos", normReference: "—", priority: "alta" },

  { sortOrder: 35, category: "Tableros y Reportes", item: "Tablero ejecutivo % cumplimiento desagregado por programa", appliesTo: "Todos", normReference: "Ya existe (global, falta desagregar)", priority: "alta" },
  { sortOrder: 36, category: "Tableros y Reportes", item: "Mapas de calor y tendencias por sede", appliesTo: "Multi-sede", normReference: "Benchmark: FoodDocs", priority: "media" },
  { sortOrder: 37, category: "Tableros y Reportes", item: "Reporte exportable en PDF estilo acta de inspección", appliesTo: "Todos", normReference: "Modelo: Secretaría de Salud Bogotá", priority: "alta" },
  { sortOrder: 38, category: "Tableros y Reportes", item: "Exportación en CSV", appliesTo: "Todos", normReference: "—", priority: "baja" },

  { sortOrder: 39, category: "Escalabilidad / Multi-sede", item: "Panel centralizado multi-sede / franquicias", appliesTo: "Cadenas", normReference: "Benchmark: appticc, FoodDocs", priority: "alta" },
  { sortOrder: 40, category: "Escalabilidad / Multi-sede", item: "Roles y permisos diferenciados", appliesTo: "Todos", normReference: "—", priority: "alta" },
  { sortOrder: 41, category: "Escalabilidad / Multi-sede", item: "Plantillas estandarizadas para apertura de sede nueva", appliesTo: "Cadenas", normReference: "—", priority: "media" },
  { sortOrder: 42, category: "Escalabilidad / Multi-sede", item: "Modo white-label para aliados / consultores", appliesTo: "B2B2B", normReference: "—", priority: "baja" },

  { sortOrder: 43, category: "Capacitación", item: "Seguimiento de capacitaciones con evaluación", appliesTo: "Todos", normReference: "Res. 2674/2013 Art. 12", priority: "alta" },
  { sortOrder: 44, category: "Capacitación", item: "Recordatorios de recertificación anual", appliesTo: "Todos", normReference: "—", priority: "alta" },
  { sortOrder: 45, category: "Capacitación", item: "Vínculo manipulador – carné – estado de cumplimiento", appliesTo: "Todos", normReference: "—", priority: "media" },

  { sortOrder: 46, category: "Infraestructura y Legal", item: "Backups automáticos en la nube", appliesTo: "Todos", normReference: "—", priority: "alta" },
  { sortOrder: 47, category: "Infraestructura y Legal", item: "Modo offline con sincronización posterior", appliesTo: "Todos", normReference: "—", priority: "media" },
  { sortOrder: 48, category: "Infraestructura y Legal", item: "Cumplimiento Ley 1581/2012 (habeas data)", appliesTo: "Todos", normReference: "Ley 1581/2012", priority: "alta" },
  { sortOrder: 49, category: "Infraestructura y Legal", item: "App móvil con notificaciones push", appliesTo: "Todos", normReference: "—", priority: "alta" },

  { sortOrder: 50, category: "Avanzado", item: "API abierta para sensores IoT", appliesTo: "Cárnicos, Bodega", normReference: "Benchmark: FoodDocs", priority: "baja" },
  { sortOrder: 51, category: "Avanzado", item: "Generación asistida de manuales / HACCP", appliesTo: "Todos", normReference: "Benchmark: FoodDocs", priority: "baja" },
  { sortOrder: 52, category: "Avanzado", item: "Benchmarking entre sedes de un mismo cliente", appliesTo: "Cadenas", normReference: "—", priority: "baja" },

  { sortOrder: 53, category: "Perfiles por Tipo de Negocio", item: "Perfil Cárnicos — checklist específico", appliesTo: "Cárnicos", normReference: "Decreto 1500/2007", priority: "alta" },
  { sortOrder: 54, category: "Perfiles por Tipo de Negocio", item: "Perfil Bodega/Almacenamiento — checklist específico", appliesTo: "Bodega", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 55, category: "Perfiles por Tipo de Negocio", item: "Perfil Puntos Ambulantes — checklist específico", appliesTo: "Ambulantes", normReference: "Res. 604/1993", priority: "alta" },
  { sortOrder: 56, category: "Perfiles por Tipo de Negocio", item: "Perfil Restaurante/General — checklist estándar", appliesTo: "Restaurante", normReference: "Res. 2674/2013", priority: "media" },
  { sortOrder: 57, category: "Perfiles por Tipo de Negocio", item: "Selector de perfil en onboarding (activa el checklist correcto por tipo de negocio)", appliesTo: "Todos", normReference: "—", priority: "alta" },
];

// Copiado de la hoja "Perfiles por Negocio": requisitos específicos que se
// suman al checklist general (Res. 2674) según el perfil de negocio elegido.
export const perfilesPorNegocioSeed: ChecklistSeedRow[] = [
  { sortOrder: 100, category: "Perfil Cárnicos", item: "Soporte de que la carne proviene de planta de beneficio autorizada e inspeccionada por INVIMA", appliesTo: "Cárnicos", normReference: "Decreto 1500/2007", priority: "alta" },
  { sortOrder: 101, category: "Perfil Cárnicos", item: "Indicadores y sistema de registro de cadena de frío (temperatura)", appliesTo: "Cárnicos", normReference: "Norma distrital (Bogotá) sobre expendio de carne", priority: "alta" },
  { sortOrder: 102, category: "Perfil Cárnicos", item: "Capacidad de refrigeración suficiente para el volumen comercializado", appliesTo: "Cárnicos", normReference: "Norma distrital (Bogotá) sobre expendio de carne", priority: "alta" },
  { sortOrder: 103, category: "Perfil Cárnicos", item: "Temperaturas específicas por especie (bovino, etc.) con alarma de rango", appliesTo: "Cárnicos", normReference: "Norma distrital (Bogotá) sobre expendio de carne", priority: "alta" },
  { sortOrder: 104, category: "Perfil Cárnicos", item: "Almacenamiento separado de carne y derivados cárnicos", appliesTo: "Cárnicos", normReference: "Norma distrital (Bogotá) sobre expendio de carne", priority: "alta" },
  { sortOrder: 105, category: "Perfil Cárnicos", item: "Termómetros calibrados y en buen estado", appliesTo: "Cárnicos", normReference: "Norma distrital (Bogotá) sobre expendio de carne", priority: "alta" },
  { sortOrder: 106, category: "Perfil Cárnicos", item: "Utensilios en buen estado; prohibido uso de madera u otros materiales no sanitarios", appliesTo: "Cárnicos", normReference: "Norma distrital (Bogotá) sobre expendio de carne", priority: "alta" },
  { sortOrder: 107, category: "Perfil Cárnicos", item: "Vehículos de transporte de carne con autorización sanitaria propia", appliesTo: "Cárnicos", normReference: "Decreto 1500/2007", priority: "alta" },
  { sortOrder: 108, category: "Perfil Cárnicos", item: "Si hace desposte/desprese en el mismo sitio: autorización sanitaria ante INVIMA", appliesTo: "Cárnicos", normReference: "Decreto 1500/2007", priority: "alta" },

  { sortOrder: 110, category: "Perfil Bodega / Almacenamiento", item: "Condiciones de almacenamiento por tipo de alimento (temperatura y humedad)", appliesTo: "Bodega", normReference: "Res. 2674/2013 — Capítulo Almacenamiento", priority: "alta" },
  { sortOrder: 111, category: "Perfil Bodega / Almacenamiento", item: "Control de rotación de inventario (FIFO/FEFO)", appliesTo: "Bodega", normReference: "Buenas prácticas de almacenamiento", priority: "alta" },
  { sortOrder: 112, category: "Perfil Bodega / Almacenamiento", item: "Separación física de productos químicos y alimentos", appliesTo: "Bodega", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 113, category: "Perfil Bodega / Almacenamiento", item: "Control de plagas específico de bodega", appliesTo: "Bodega", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 114, category: "Perfil Bodega / Almacenamiento", item: "Registro de temperatura y humedad de la bodega", appliesTo: "Bodega", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 115, category: "Perfil Bodega / Almacenamiento", item: "Trazabilidad de lotes almacenados", appliesTo: "Bodega", normReference: "Res. 2674/2013", priority: "alta" },
  { sortOrder: 116, category: "Perfil Bodega / Almacenamiento", item: "Inspección de vehículos en cargue y descargue", appliesTo: "Bodega", normReference: "Res. 2674/2013 — Transporte", priority: "alta" },

  { sortOrder: 120, category: "Perfil Puntos Ambulantes", item: "Puesto de venta construido en material sólido, resistente y sanitario", appliesTo: "Ambulantes", normReference: "Res. 604/1993 Art. 13", priority: "alta" },
  { sortOrder: 121, category: "Perfil Puntos Ambulantes", item: "Permiso sanitario de funcionamiento ante la dirección de salud local/distrital", appliesTo: "Ambulantes", normReference: "Res. 604/1993 Art. 39-40", priority: "alta" },
  { sortOrder: 122, category: "Perfil Puntos Ambulantes", item: "Carné de manipulador (vía taller de capacitación)", appliesTo: "Ambulantes", normReference: "Res. 604/1993", priority: "alta" },
  { sortOrder: 123, category: "Perfil Puntos Ambulantes", item: "Abastecimiento de agua potable mínimo (≥1 litro/ración servida)", appliesTo: "Ambulantes", normReference: "Res. 604/1993 Art. 20", priority: "alta" },
  { sortOrder: 124, category: "Perfil Puntos Ambulantes", item: "Recipiente de basura tapado, alejado del área de manipulación", appliesTo: "Ambulantes", normReference: "Res. 604/1993 Art. 22", priority: "alta" },
  { sortOrder: 125, category: "Perfil Puntos Ambulantes", item: "Insumos e ingredientes de proveedores autorizados", appliesTo: "Ambulantes", normReference: "Res. 604/1993 Art. 24", priority: "alta" },
  { sortOrder: 126, category: "Perfil Puntos Ambulantes", item: "Transporte del alimento en recipientes cerrados y protegidos", appliesTo: "Ambulantes", normReference: "Res. 604/1993 Art. 38", priority: "alta" },
  { sortOrder: 127, category: "Perfil Puntos Ambulantes", item: "Prohibición de animales en el puesto de venta", appliesTo: "Ambulantes", normReference: "Res. 604/1993 Art. 18", priority: "alta" },
  { sortOrder: 128, category: "Perfil Puntos Ambulantes", item: "Registro de ubicación / riesgo de reubicación por zona sanitaria", appliesTo: "Ambulantes", normReference: "Res. 604/1993", priority: "alta" },

  { sortOrder: 130, category: "Perfil Restaurante / General", item: "Checklist estándar completo de Res. 2674 (saneamiento + BPM)", appliesTo: "Restaurante", normReference: "Res. 2674/2013", priority: "alta" },
];
