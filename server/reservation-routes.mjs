import oracledb from 'oracledb';
import { ApiError, productId } from './validation.mjs';

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0,10) === value;
}
function mapOracleError(error) {
  const n = error?.errorNum;
  if (!Number.isInteger(n) || n < 20101 || n > 20210) throw error;
  const conflict = [20102,20104,20106,20109,20204,20205,20206,20208,20210].includes(n);
  const forbidden = [20103,20108,20203].includes(n);
  const missing = [20105,20107,20110,20209].includes(n);
  throw new ApiError(conflict ? 409 : forbidden ? 403 : missing ? 404 : 400,
    error.message?.split('\n')[0] ?? 'No se pudo completar el arriendo.');
}
const asReservation = row => ({
  id:row.ID_RESERVA,productId:row.ID_PRODUCTO,productName:row.PRODUCTO,
  startDate:row.INICIO,endDate:row.FIN,status:row.ESTADO
});

/** Returns null for unrelated routes; authenticated actions always use the cookie session. */
export async function reservationDispatch({method,pathname,req,connectionWork,currentUser,query,table,schema,readJson}) {
  const reservationPath = /^\/api\/reservations\/([^/]+)\/(cancel|history)$/.exec(pathname);
  const ownerPath = /^\/api\/owner\/reservations\/([^/]+)\/(confirm|tracking)$/.exec(pathname);
  const availabilityPath = /^\/api\/products\/([^/]+)\/availability$/.exec(pathname);
  const relevant = (method === 'GET' && ['/api/reservations','/api/owner/reservations'].includes(pathname)) ||
    (method === 'GET' && availabilityPath) ||
    (method === 'POST' && pathname === '/api/reservations') ||
    (reservationPath && ['GET','POST'].includes(method)) ||
    (ownerPath && method === 'POST');
  if (!relevant) return null;

  const withUser = fn => connectionWork(async connection => {
    const user = await currentUser(connection,req);
    return fn(connection,user);
  });
  try {
    if (method === 'GET' && pathname === '/api/reservations') {
      return withUser(async (c,u) => {
        if (u.role !== 'CLIENTE') throw new ApiError(403,'Solo clientes pueden consultar sus reservas.');
        const r = await query(c,
          'SELECT R.ID_RESERVA,R.ID_PRODUCTO,P.NOMBRE AS PRODUCTO,' +
          "TO_CHAR(R.FECHA_INICIO,'YYYY-MM-DD') AS INICIO,TO_CHAR(R.FECHA_FIN,'YYYY-MM-DD') AS FIN,R.ESTADO " +
          'FROM ' + table('RESERVA') + ' R JOIN ' + table('PRODUCTO') + ' P ON P.ID_PRODUCTO=R.ID_PRODUCTO ' +
          'WHERE R.ID_ARRENDATARIO=:id ORDER BY R.ID_RESERVA DESC',{id:u.id});
        return {body:{reservations:r.rows.map(asReservation)}};
      });
    }
    if (method === 'GET' && pathname === '/api/owner/reservations') {
      return withUser(async (c,u) => {
        if (u.role !== 'PROPIETARIO') throw new ApiError(403,'Solo propietarios pueden consultar solicitudes.');
        const r = await query(c,
          'SELECT R.ID_RESERVA,R.ID_PRODUCTO,P.NOMBRE AS PRODUCTO,' +
          "TO_CHAR(R.FECHA_INICIO,'YYYY-MM-DD') AS INICIO,TO_CHAR(R.FECHA_FIN,'YYYY-MM-DD') AS FIN,R.ESTADO " +
          'FROM ' + table('RESERVA') + ' R JOIN ' + table('PRODUCTO') + ' P ON P.ID_PRODUCTO=R.ID_PRODUCTO ' +
          'WHERE P.ID_PROPIETARIO=:id ORDER BY R.ID_RESERVA DESC',{id:u.id});
        return {body:{reservations:r.rows.map(asReservation)}};
      });
    }
    if (method === 'GET' && availabilityPath) {
      const id=productId(availabilityPath[1]);
      return connectionWork(async c => {
        const product=await query(c,'SELECT ESTADO FROM '+table('PRODUCTO')+
          " WHERE ID_PRODUCTO=:id AND ESTADO='DISPONIBLE'",{id});
        if (!product.rows.length) throw new ApiError(404,'Producto no disponible.');
        const r=await query(c,
          "SELECT TO_CHAR(FECHA_INICIO,'YYYY-MM-DD') AS INICIO,TO_CHAR(FECHA_FIN,'YYYY-MM-DD') AS FIN FROM " +
          table('RESERVA')+" WHERE ID_PRODUCTO=:id AND ESTADO IN ('PENDIENTE','CONFIRMADA') ORDER BY FECHA_INICIO",{id});
        return {body:{occupied:r.rows.map(x=>({startDate:x.INICIO,endDate:x.FIN}))}};
      });
    }
    if (method === 'POST' && pathname === '/api/reservations') {
      const body=await readJson(req);
      const id=productId(String(body.productId));
      if (!validDate(body.startDate)||!validDate(body.endDate)||body.startDate>body.endDate) {
        throw new ApiError(400,'Selecciona fechas válidas y ordenadas.');
      }
      return withUser(async (c,u) => {
        if (u.role!=='CLIENTE') throw new ApiError(403,'Solo clientes pueden reservar.');
        const result=await query(c,
          'BEGIN '+schema+'.SP_CREAR_RESERVA(:productId,:clientId,'+
          "TO_DATE(:startDate,'YYYY-MM-DD'),TO_DATE(:endDate,'YYYY-MM-DD'),:reservationId); END;",
          {productId:id,clientId:u.id,startDate:body.startDate,endDate:body.endDate,
           reservationId:{dir:oracledb.BIND_OUT,type:oracledb.NUMBER}});
        await c.commit();
        return {status:201,body:{id:result.outBinds.reservationId[0],message:'Reserva solicitada.'}};
      });
    }
    if (method === 'POST' && reservationPath && reservationPath[2]==='cancel') {
      const id=productId(reservationPath[1]);
      return withUser(async (c,u) => {
        if (u.role!=='CLIENTE') throw new ApiError(403,'Solo el cliente puede cancelar.');
        await query(c,'BEGIN '+schema+'.SP_CANCELAR_RESERVA(:id,:userId); END;',{id,userId:u.id});
        await c.commit();
        return {body:{message:'Reserva cancelada.'}};
      });
    }
    if (method === 'POST' && ownerPath && ownerPath[2]==='confirm') {
      const id=productId(ownerPath[1]);
      return withUser(async (c,u) => {
        if (u.role!=='PROPIETARIO') throw new ApiError(403,'Solo el propietario puede confirmar.');
        await query(c,'BEGIN '+schema+'.SP_CONFIRMAR_RESERVA(:id,:ownerId); END;',{id,ownerId:u.id});
        await c.commit();
        return {body:{message:'Reserva confirmada.'}};
      });
    }
    if (method === 'POST' && ownerPath && ownerPath[2]==='tracking') {
      const id=productId(ownerPath[1]),body=await readJson(req);
      if (!['ENTREGAR','DEVOLVER','DANO','LIBERAR_GARANTIA','RETENER_GARANTIA'].includes(body.action)||
          (body.detail!==undefined&&(typeof body.detail!=='string'||body.detail.length>500))) {
        throw new ApiError(400,'Acción o descripción inválida.');
      }
      return withUser(async (c,u) => {
        if (u.role!=='PROPIETARIO') throw new ApiError(403,'Solo el propietario registra entregas.');
        await query(c,'BEGIN '+schema+'.SP_GESTIONAR_ARRIENDO(:id,:ownerId,:action,:detail); END;',
          {id,ownerId:u.id,action:body.action,detail:body.detail??null});
        await c.commit();
        return {body:{message:'Seguimiento actualizado.'}};
      });
    }
    if (method === 'GET' && reservationPath && reservationPath[2]==='history') {
      const id=productId(reservationPath[1]);
      return withUser(async (c,u) => {
        const access=await query(c,
          'SELECT R.ID_RESERVA FROM '+table('RESERVA')+' R JOIN '+table('PRODUCTO')+
          ' P ON P.ID_PRODUCTO=R.ID_PRODUCTO WHERE R.ID_RESERVA=:id '+
          'AND (R.ID_ARRENDATARIO=:uid OR P.ID_PROPIETARIO=:uid)',{id,uid:u.id});
        if (!access.rows.length) throw new ApiError(404,'Reserva ajena o inexistente.');
        const events=await query(c,
          "SELECT ACCION,DETALLE,TO_CHAR(FECHA_EVENTO,'YYYY-MM-DD HH24:MI') AS FECHA FROM "+
          table('HISTORIAL_ARRIENDO')+' WHERE ID_RESERVA=:id ORDER BY ID_EVENTO',{id});
        const tracking=await query(c,
          'SELECT ESTADO_GARANTIA,OBSERVACION_DANOS FROM '+table('SEGUIMIENTO_ARRIENDO')+
          ' WHERE ID_RESERVA=:id',{id});
        return {body:{
          events:events.rows.map(x=>({action:x.ACCION,detail:x.DETALLE,date:x.FECHA})),
          guaranteeStatus:tracking.rows[0]?.ESTADO_GARANTIA??'PENDIENTE',
          damageNotes:tracking.rows[0]?.OBSERVACION_DANOS??''
        }};
      });
    }
    return null;
  } catch(error) { mapOracleError(error); }
}
