-- Bases de datos del monorepo.
--
-- REGLA: una base por servicio. Ningún servicio consulta la base de otro.
-- Este script lo ejecuta Docker la PRIMERA vez que se crea el volumen.
-- Si ya tienes PostgreSQL local, crea solo las bases que necesites con:
--
--   psql -h localhost -U postgres -c "CREATE DATABASE amazonka_auth;"
--
-- (el auth-service de la semana 1 solo necesita amazonka_auth)

CREATE DATABASE amazonka_auth;
CREATE DATABASE amazonka_catalog;
CREATE DATABASE amazonka_cart;
CREATE DATABASE amazonka_order;
CREATE DATABASE amazonka_payment;
CREATE DATABASE amazonka_inventory;
