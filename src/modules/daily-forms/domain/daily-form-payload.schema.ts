import { Type as t, type TSchema } from "@sinclair/typebox";

// Un TypeBox schema por cada uno de los 10 formatos diarios definidos en el
// front (src/app/formatos/*). Es una regla de dominio (qué payload es válido
// para cada tipo de formato), no solo validación HTTP — por eso vive aquí y
// la aplica application/create-daily-form.use-case.ts antes de persistir, en
// vez de la ruta.

const temperatura = t.Object({
  responsable: t.String(),
  equipos: t.Array(
    t.Object({
      name: t.String(),
      time: t.String(),
      temp: t.Number(),
    }),
    { minItems: 1 },
  ),
});

const plagas = t.Object({
  areas: t.Array(t.Object({ area: t.String(), evidencia: t.Boolean() }), { minItems: 1 }),
});

const agua = t.Object({
  puntoMuestreo: t.String(),
  responsable: t.String(),
  color: t.Union([t.Literal("normal"), t.Literal("anormal")]),
  olor: t.Union([t.Literal("normal"), t.Literal("anormal")]),
  sabor: t.Union([t.Literal("normal"), t.Literal("anormal")]),
  ph: t.Optional(t.Number()),
  cloroResidualPpm: t.Optional(t.Number()),
});

const cantidadResiduo = t.Object({ cantidad: t.Number(), unidad: t.Union([t.Literal("bolsas"), t.Literal("kg")]) });
const residuos = t.Object({
  turno: t.Union([t.Literal("manana"), t.Literal("tarde"), t.Literal("noche")]),
  organicos: cantidadResiduo,
  aprovechables: cantidadResiduo,
  noAprovechables: cantidadResiduo,
  aceiteUsadoLitros: t.Optional(t.Number()),
  encargado: t.String(),
});

const materiasPrimas = t.Object({
  proveedor: t.String(),
  facturaRemision: t.Optional(t.String()),
  responsable: t.String(),
  productos: t.Array(
    t.Object({
      producto: t.String(),
      loteOVencimiento: t.Optional(t.String()),
      cantidad: t.String(),
      temperatura: t.Optional(t.Number()),
      empaqueOk: t.Boolean(),
      estado: t.Union([t.Literal("ok"), t.Literal("rechazado")]),
    }),
    { minItems: 1 },
  ),
});

// Los 3 estados reemplazan el checkbox binario anterior (feedback de
// revisión BPM: "cumple" no es lo mismo que "no aplica", ej. barba/bigote en
// empleadas o maquillaje en empleados).
const cumpleNoCumpleNoAplica = t.Union([t.Literal("cumple"), t.Literal("no_cumple"), t.Literal("no_aplica")]);

const higiene = t.Object({
  auditor: t.String(),
  empleados: t.Array(
    t.Object({
      employeeId: t.Optional(t.String({ format: "uuid" })),
      nombre: t.String(),
      uniformeLimpio: cumpleNoCumpleNoAplica,
      unasLimpias: cumpleNoCumpleNoAplica,
      sinJoyas: cumpleNoCumpleNoAplica,
      saludOk: cumpleNoCumpleNoAplica,
      cabelloRecogido: cumpleNoCumpleNoAplica,
      sinBarbaOBigote: cumpleNoCumpleNoAplica,
      lavadoManos: cumpleNoCumpleNoAplica,
      sinMaquillaje: cumpleNoCumpleNoAplica,
      usoTapabocas: cumpleNoCumpleNoAplica,
      observaciones: t.Optional(t.String()),
    }),
  ),
});

const almacenamiento = t.Object({
  bodega: t.String(),
  checks: t.Array(t.Object({ item: t.String(), cumple: t.Boolean() }), { minItems: 1 }),
  hallazgos: t.Optional(t.String()),
});

const transporte = t.Object({
  placa: t.String(),
  conductor: t.String(),
  limpiezaInterior: t.Boolean(),
  ausenciaOlores: t.Boolean(),
  temperaturaFurgon: t.Optional(t.Number()),
});

const instalaciones = t.Object({
  areaEvaluada: t.String(),
  items: t.Array(
    t.Object({
      area: t.String(),
      estado: t.Union([t.Literal("B"), t.Literal("R"), t.Literal("M")]),
      observacion: t.Optional(t.String()),
    }),
    { minItems: 1 },
  ),
});

const equipos = t.Object({
  responsable: t.String(),
  equipos: t.Array(
    t.Object({
      equipo: t.String(),
      limpio: t.Boolean(),
      buenEstado: t.Boolean(),
      requiereMantenimiento: t.Boolean(),
      productoLimpieza: t.Optional(t.String()),
    }),
    { minItems: 1 },
  ),
});

export const DAILY_FORM_TYPES = [
  "temperatura",
  "plagas",
  "agua",
  "residuos",
  "materias_primas",
  "higiene",
  "almacenamiento",
  "transporte",
  "instalaciones",
  "equipos",
] as const;

export type DailyFormType = (typeof DAILY_FORM_TYPES)[number];

export function isDailyFormType(value: string): value is DailyFormType {
  return (DAILY_FORM_TYPES as readonly string[]).includes(value);
}

export const dailyFormPayloadSchemas: Record<DailyFormType, TSchema> = {
  temperatura,
  plagas,
  agua,
  residuos,
  materias_primas: materiasPrimas,
  higiene,
  almacenamiento,
  transporte,
  instalaciones,
  equipos,
};
