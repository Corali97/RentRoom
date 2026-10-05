-- RentRoom: extension aditiva para la API de usuarios y productos.
-- Ejecutar en XEPDB1 con CURRENT_SCHEMA=RENTROOM_S5_EVIDENCE.
-- No elimina filas ni cambia claves, roles o contrasenas existentes.
-- DDL confirma implicitamente: guardar una copia de la estructura antes de ejecutar.
SET SERVEROUTPUT ON
WHENEVER OSERROR EXIT FAILURE ROLLBACK
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
DECLARE
  propietario VARCHAR2(128) := SYS_CONTEXT('USERENV','CURRENT_SCHEMA');
  prefijo VARCHAR2(140);
  cantidad NUMBER;
  tabla_sesiones NUMBER;
  FUNCTION normalizar(texto VARCHAR2) RETURN VARCHAR2 IS
  BEGIN RETURN REGEXP_REPLACE(UPPER(texto), '[[:space:]"()]', ''); END;
  PROCEDURE fallo(texto VARCHAR2) IS
  BEGIN RAISE_APPLICATION_ERROR(-20011, texto); END;
  PROCEDURE verificar_columna(tabla VARCHAR2, campo VARCHAR2, tipo VARCHAR2,
    longitud NUMBER DEFAULT NULL, precision_num NUMBER DEFAULT NULL,
    escala NUMBER DEFAULT NULL, opcional BOOLEAN DEFAULT FALSE) IS
    c all_tab_columns%ROWTYPE;
  BEGIN
    BEGIN SELECT * INTO c FROM all_tab_columns
      WHERE owner=propietario AND table_name=tabla AND column_name=campo;
    EXCEPTION WHEN NO_DATA_FOUND THEN
      IF opcional THEN RETURN; END IF;
      fallo('Falta la columna '||tabla||'.'||campo); RETURN;
    END;
    IF c.data_type<>tipo OR (longitud IS NOT NULL AND c.char_length<>longitud)
      OR (precision_num IS NOT NULL AND NVL(c.data_precision,-1)<>precision_num)
      OR (escala IS NOT NULL AND NVL(c.data_scale,-1)<>escala) THEN
      fallo('Tipo incompatible: '||tabla||'.'||campo);
    END IF;
  END;
  PROCEDURE verificar_check(tabla VARCHAR2, nombre VARCHAR2, expresion VARCHAR2) IS
    c all_constraints%ROWTYPE;
  BEGIN
    BEGIN SELECT * INTO c FROM all_constraints WHERE owner=propietario AND constraint_name=nombre;
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN; END;
    IF c.table_name<>tabla OR c.constraint_type<>'C' OR c.status<>'ENABLED'
      OR c.validated<>'VALIDATED' OR NVL(normalizar(c.search_condition_vc),'?')<>normalizar(expresion) THEN
      fallo('Restriccion existente incompatible: '||nombre);
    END IF;
  END;
  PROCEDURE verificar_indice(nombre VARCHAR2, tabla VARCHAR2, unico VARCHAR2, expresion VARCHAR2) IS
    i all_indexes%ROWTYPE; n NUMBER; actual VARCHAR2(32767);
  BEGIN
    BEGIN SELECT * INTO i FROM all_indexes WHERE owner=propietario AND index_name=nombre;
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN; END;
    SELECT COUNT(*) INTO n FROM all_ind_columns WHERE index_owner=propietario AND index_name=nombre;
    IF i.table_owner<>propietario OR i.table_name<>tabla OR i.uniqueness<>unico OR i.status<>'VALID' OR n<>1 THEN
      fallo('Indice existente incompatible: '||nombre);
    END IF;
    IF nombre='UQ_USUARIO_CORREO_NORMAL' THEN
      BEGIN SELECT column_expression INTO actual FROM all_ind_expressions
        WHERE index_owner=propietario AND index_name=nombre AND column_position=1;
      EXCEPTION WHEN NO_DATA_FOUND THEN fallo('Falta expresion del indice '||nombre); END;
    ELSE
      SELECT column_name INTO actual FROM all_ind_columns
        WHERE index_owner=propietario AND index_name=nombre AND column_position=1;
    END IF;
    IF NVL(normalizar(actual),'?')<>normalizar(expresion) THEN fallo('Expresion incompatible: '||nombre); END IF;
  END;
  PROCEDURE columna(tabla VARCHAR2, campo VARCHAR2, definicion VARCHAR2) IS n NUMBER;
  BEGIN
    SELECT COUNT(*) INTO n FROM all_tab_columns
      WHERE owner=propietario AND table_name=tabla AND column_name=campo;
    IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE '||prefijo||tabla||' ADD ('||campo||' '||definicion||')'; END IF;
  END;
  PROCEDURE restriccion(tabla VARCHAR2, nombre VARCHAR2, expresion VARCHAR2) IS n NUMBER;
  BEGIN
    SELECT COUNT(*) INTO n FROM all_constraints WHERE owner=propietario AND constraint_name=nombre;
    IF n=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE '||prefijo||tabla||' ADD CONSTRAINT '||nombre||' CHECK ('||expresion||')'; END IF;
  END;
BEGIN
  IF propietario<>'RENTROOM_S5_EVIDENCE' OR SYS_CONTEXT('USERENV','CON_NAME')<>'XEPDB1' THEN
    RAISE_APPLICATION_ERROR(-20010,'Seleccionar XEPDB1 y CURRENT_SCHEMA=RENTROOM_S5_EVIDENCE.');
  END IF;
  prefijo:=DBMS_ASSERT.SCHEMA_NAME(propietario)||'.';
  -- Todas las comprobaciones de objetos existentes preceden al primer DDL.
  verificar_columna('USUARIO','ID_USUARIO','NUMBER');
  verificar_columna('USUARIO','NOMBRE_COMPLETO','VARCHAR2',120);
  verificar_columna('USUARIO','CORREO','VARCHAR2',150);
  verificar_columna('USUARIO','CLAVE_HASH','VARCHAR2',255);
  verificar_columna('USUARIO','FECHA_REGISTRO','DATE');
  verificar_columna('USUARIO','ESTADO','VARCHAR2',20);
  verificar_columna('PRODUCTO','ID_PRODUCTO','NUMBER');
  verificar_columna('PRODUCTO','ID_PROPIETARIO','NUMBER');
  verificar_columna('PRODUCTO','NOMBRE','VARCHAR2',120);
  verificar_columna('PRODUCTO','DESCRIPCION','VARCHAR2',500);
  verificar_columna('PRODUCTO','CATEGORIA','VARCHAR2',80);
  verificar_columna('PRODUCTO','PRECIO_DIA','NUMBER',NULL,10,2);
  verificar_columna('PRODUCTO','GARANTIA','NUMBER',NULL,10,2);
  verificar_columna('PRODUCTO','ESTADO','VARCHAR2',20);
  verificar_columna('RESERVA','ID_RESERVA','NUMBER');
  verificar_columna('RESERVA','ID_PRODUCTO','NUMBER');
  verificar_columna('USUARIO','ROL','VARCHAR2',20,NULL,NULL,TRUE);
  verificar_columna('PRODUCTO','VALOR_COMPRA','NUMBER',NULL,12,2,TRUE);
  verificar_columna('PRODUCTO','IMAGEN_URL','VARCHAR2',2000,NULL,NULL,TRUE);
  verificar_check('USUARIO','CK_USUARIO_ROL','ROL IN (''CLIENTE'',''PROPIETARIO'')');
  verificar_check('PRODUCTO','CK_PRODUCTO_COMPRA','VALOR_COMPRA >= 0');
  verificar_check('SESION_API','CK_SESION_EXPIRA','EXPIRA_EN > FECHA_CREACION');
  verificar_indice('UQ_USUARIO_CORREO_NORMAL','USUARIO','UNIQUE','LOWER(TRIM(CORREO))');
  verificar_indice('IX_SESION_USUARIO','SESION_API','NONUNIQUE','ID_USUARIO');
  EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM (SELECT LOWER(TRIM(CORREO)) FROM '||prefijo||
    'USUARIO GROUP BY LOWER(TRIM(CORREO)) HAVING COUNT(*)>1)' INTO cantidad;
  IF cantidad>0 THEN fallo('Existen correos duplicados al normalizarlos. No se modificaron los datos.'); END IF;
  SELECT COUNT(*) INTO tabla_sesiones FROM all_tables WHERE owner=propietario AND table_name='SESION_API';
  IF tabla_sesiones>0 THEN
    verificar_columna('SESION_API','TOKEN_HASH','VARCHAR2',64);
    verificar_columna('SESION_API','ID_USUARIO','NUMBER');
    verificar_columna('SESION_API','FECHA_CREACION','TIMESTAMP(6)');
    verificar_columna('SESION_API','EXPIRA_EN','TIMESTAMP(6)');
    SELECT COUNT(*) INTO cantidad FROM all_tab_columns WHERE owner=propietario AND table_name='SESION_API'
      AND column_name IN ('TOKEN_HASH','ID_USUARIO','FECHA_CREACION','EXPIRA_EN') AND nullable='N';
    IF cantidad<>4 THEN fallo('SESION_API admite valores nulos incompatibles.'); END IF;
    SELECT COUNT(*) INTO cantidad FROM all_constraints c JOIN all_cons_columns cc
      ON cc.owner=c.owner AND cc.constraint_name=c.constraint_name
      WHERE c.owner=propietario AND c.table_name='SESION_API' AND c.constraint_type='P'
      AND c.status='ENABLED' AND c.validated='VALIDATED' AND cc.column_name='TOKEN_HASH'
      AND (SELECT COUNT(*) FROM all_cons_columns x WHERE x.owner=c.owner AND x.constraint_name=c.constraint_name)=1;
    IF cantidad<>1 THEN fallo('SESION_API requiere TOKEN_HASH como clave primaria.'); END IF;
    SELECT COUNT(*) INTO cantidad FROM all_constraints c JOIN all_cons_columns cc
      ON cc.owner=c.owner AND cc.constraint_name=c.constraint_name
      JOIN all_constraints r ON r.owner=c.r_owner AND r.constraint_name=c.r_constraint_name
      JOIN all_cons_columns rc ON rc.owner=r.owner AND rc.constraint_name=r.constraint_name AND rc.position=cc.position
      WHERE c.owner=propietario AND c.table_name='SESION_API' AND c.constraint_name='FK_SESION_USUARIO'
      AND c.constraint_type='R' AND c.status='ENABLED' AND c.validated='VALIDATED'
      AND cc.column_name='ID_USUARIO' AND r.owner=propietario AND r.table_name='USUARIO' AND rc.column_name='ID_USUARIO'
      AND (SELECT COUNT(*) FROM all_cons_columns x WHERE x.owner=c.owner AND x.constraint_name=c.constraint_name)=1;
    IF cantidad<>1 THEN fallo('SESION_API requiere la referencia a USUARIO.ID_USUARIO.'); END IF;
  END IF;
  columna('USUARIO','ROL','VARCHAR2(20)');
  columna('PRODUCTO','VALOR_COMPRA','NUMBER(12,2)');
  columna('PRODUCTO','IMAGEN_URL','VARCHAR2(2000)');
  restriccion('USUARIO','CK_USUARIO_ROL','ROL IN (''CLIENTE'',''PROPIETARIO'')');
  restriccion('PRODUCTO','CK_PRODUCTO_COMPRA','VALOR_COMPRA >= 0');
  SELECT COUNT(*) INTO cantidad FROM all_indexes WHERE owner=propietario AND index_name='UQ_USUARIO_CORREO_NORMAL';
  IF cantidad=0 THEN
    -- Si hubiera duplicados normalizados se detiene; no se fusionan cuentas.
    EXECUTE IMMEDIATE 'CREATE UNIQUE INDEX '||prefijo||'UQ_USUARIO_CORREO_NORMAL ON '||prefijo||'USUARIO(LOWER(TRIM(CORREO)))';
  END IF;
  IF tabla_sesiones=0 THEN
    EXECUTE IMMEDIATE 'CREATE TABLE '||prefijo||'SESION_API (
      TOKEN_HASH VARCHAR2(64) PRIMARY KEY,
      ID_USUARIO NUMBER NOT NULL,
      FECHA_CREACION TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
      EXPIRA_EN TIMESTAMP NOT NULL,
      CONSTRAINT FK_SESION_USUARIO FOREIGN KEY (ID_USUARIO) REFERENCES '||prefijo||'USUARIO(ID_USUARIO),
      CONSTRAINT CK_SESION_EXPIRA CHECK (EXPIRA_EN > FECHA_CREACION))';
  ELSE
    restriccion('SESION_API','CK_SESION_EXPIRA','EXPIRA_EN > FECHA_CREACION');
  END IF;
  SELECT COUNT(*) INTO cantidad FROM all_indexes WHERE owner=propietario AND index_name='IX_SESION_USUARIO';
  IF cantidad=0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX '||prefijo||'IX_SESION_USUARIO ON '||prefijo||'SESION_API(ID_USUARIO)';
  END IF;
  DBMS_OUTPUT.PUT_LINE('Estructura S8 preparada en '||propietario||'. Datos anteriores conservados.');
END;
/
