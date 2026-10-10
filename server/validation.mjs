export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function schemaName(value) {
  if (typeof value !== 'string' || !/^[A-Z][A-Z0-9_]{0,29}$/.test(value)) {
    throw new Error('DB_SCHEMA debe ser un identificador Oracle válido en mayúsculas.');
  }
  return value;
}

export function objectBody(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'El cuerpo de la solicitud debe ser un objeto JSON.');
  }
  return value;
}

function text(value, field, limit, optional = false) {
  if (optional && (value === undefined || value === null)) return '';
  if (typeof value !== 'string') throw new ApiError(400, `${field} no es válido.`);
  const result = value.trim();
  if ((!optional && !result) || result.length > limit || Buffer.byteLength(result, 'utf8') > limit) {
    throw new ApiError(400, `${field} está vacío o supera el largo permitido (${limit}).`);
  }
  return result;
}

export function fullName(value) { return text(value, 'El nombre', 120); }

export function email(value) {
  const result = text(value, 'El correo', 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new ApiError(400, 'Ingresa un correo válido.');
  return result;
}

export function password(value, registering = false) {
  if (typeof value !== 'string' || value.length > 128 || value.length < (registering ? 8 : 1)) {
    throw new ApiError(400, registering ? 'La contraseña debe tener entre 8 y 128 caracteres.' : 'La contraseña no es válida.');
  }
  return value;
}

export function registerData(raw) {
  const body = objectBody(raw);
  if (!['CLIENTE', 'PROPIETARIO'].includes(body.role)) throw new ApiError(400, 'Selecciona Cliente o Propietario.');
  return { fullName: fullName(body.fullName), email: email(body.email), password: password(body.password, true), role: body.role };
}

function money(value, field, maximum, positive = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum ||
      (positive && value === 0) || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
    throw new ApiError(400, `${field} debe ser un monto válido con hasta dos decimales.`);
  }
  return value;
}

export function productData(raw, updating = false) {
  const body = objectBody(raw);
  const imageUrl = text(body.imageUrl, 'La imagen', 2000, true);
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch { throw new ApiError(400, 'La imagen debe ser una dirección HTTP o HTTPS válida.'); }
  }
  if (updating && body.status !== undefined && !['DISPONIBLE', 'INACTIVO'].includes(body.status)) {
    throw new ApiError(400, 'El estado solicitado no es válido.');
  }
  return {
    name: text(body.name, 'El nombre del producto', 120),
    description: text(body.description, 'La descripción', 500, true),
    category: text(body.category, 'La categoría', 80),
    purchaseValue: money(body.purchaseValue, 'El valor de compra', 9999999999.99),
    rentalValue: money(body.rentalValue, 'El valor de arriendo', 99999999.99, true),
    guarantee: money(body.guarantee ?? 0, 'La garantía', 99999999.99),
    imageUrl,
    ...(updating && body.status !== undefined ? { status: body.status } : {})
  };
}

export function productId(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw new ApiError(400, 'El producto no es válido.');
  return Number(value);
}

export function sampleReservationData(raw) {
  const body = objectBody(raw);
  const garmentCode = body.garmentCode;
  if (!['POLERA_BASICA', 'CHALECO_TEJIDO'].includes(garmentCode)) {
    throw new ApiError(400, 'Selecciona una prenda válida.');
  }
  const parseDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if (!parseDate(body.startDate) || !parseDate(body.endDate)) {
    throw new ApiError(400, 'Selecciona fechas válidas.');
  }
  if (body.startDate < new Date().toISOString().slice(0, 10)) {
    throw new ApiError(400, 'La fecha de inicio no puede ser anterior a hoy.');
  }
  if (body.endDate < body.startDate) {
    throw new ApiError(400, 'La fecha de término no puede ser anterior a la fecha de inicio.');
  }
  return { garmentCode, startDate: body.startDate, endDate: body.endDate };
}

export function allowedOrigins(value = 'http://localhost:4200,http://127.0.0.1:4200') {
  const origins = value.split(',').map(item => item.trim()).filter(Boolean);
  if (!origins.length || origins.some(origin => {
    try { const parsed = new URL(origin); return !['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin; }
    catch { return true; }
  })) throw new Error('ALLOWED_ORIGINS debe contener orígenes HTTP/HTTPS exactos separados por coma.');
  return new Set(origins);
}

export function requireOrigin(req, origins) {
  if (typeof req.headers.origin !== 'string' || !origins.has(req.headers.origin)) {
    throw new ApiError(403, 'El origen de la solicitud no está autorizado.');
  }
}
