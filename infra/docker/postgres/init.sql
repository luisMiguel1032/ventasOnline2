-- Bases de datos del monorepo.
--
-- REGLA: una base por servicio. Ningún servicio consulta la base de otro.
-- Este script lo ejecuta Docker la PRIMERA vez que se crea el volumen.
-- Si ya tienes PostgreSQL local, crea solo las bases que necesites con:
--
--   psql -h localhost -U postgres -c "CREATE DATABASE arbol_venta_auth;"
--
-- (el auth-service de la semana 1 solo necesita arbol_venta_auth)

CREATE DATABASE arbol_venta_auth;
CREATE DATABASE arbol_venta_catalog;
CREATE DATABASE arbol_venta_cart;
CREATE DATABASE arbol_venta_order;
CREATE DATABASE arbol_venta_payment;
CREATE DATABASE arbol_venta_inventory;
