CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE companies (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    inn character varying(12) NOT NULL,
    email character varying(256) NOT NULL,
    phone character varying(32) NOT NULL,
    name character varying(256) NOT NULL,
    address character varying(512) NOT NULL,
    description character varying(2000),
    created_at timestamp with time zone NOT NULL,
    company_type integer NOT NULL,
    CONSTRAINT "PK_companies" PRIMARY KEY (id)
);

CREATE TABLE employees (
    id uuid NOT NULL,
    phone text NOT NULL,
    employee_number integer NOT NULL,
    surname text NOT NULL,
    name text NOT NULL,
    patronymic text,
    created_at timestamp with time zone NOT NULL,
    company_id uuid NOT NULL,
    CONSTRAINT "PK_employees" PRIMARY KEY (id),
    CONSTRAINT "FK_employees_companies_company_id" FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT
);

CREATE TABLE users (
    id uuid NOT NULL,
    email character varying(256) NOT NULL,
    is_admin boolean NOT NULL,
    password_hash character varying(512) NOT NULL,
    role integer NOT NULL,
    employee_id uuid NOT NULL,
    CONSTRAINT "PK_users" PRIMARY KEY (id),
    CONSTRAINT "FK_users_employees_employee_id" FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_companies_email" ON companies (email);

CREATE UNIQUE INDEX "IX_companies_inn" ON companies (inn);

CREATE INDEX "IX_employees_company_id" ON employees (company_id);

CREATE UNIQUE INDEX "IX_users_email" ON users (email);

CREATE UNIQUE INDEX "IX_users_employee_id" ON users (employee_id);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260524001732_Initial', '10.0.8');

COMMIT;

START TRANSACTION;
CREATE TABLE user_invitations (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_used boolean NOT NULL,
    CONSTRAINT "PK_user_invitations" PRIMARY KEY (id),
    CONSTRAINT "FK_user_invitations_users_user_id" FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX "IX_user_invitations_user_id" ON user_invitations (user_id);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260527222330_EditInvitationTable', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE employees ALTER COLUMN employee_number TYPE text;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260528195251_ChangeEmployeeNumberToString', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE user_invitations ALTER COLUMN is_used SET DEFAULT FALSE;

CREATE TABLE categories (
    id uuid NOT NULL,
    name character varying(256) NOT NULL,
    CONSTRAINT "PK_categories" PRIMARY KEY (id)
);

CREATE TABLE order_change_histories (
    id uuid NOT NULL,
    change_time timestamp with time zone NOT NULL,
    order_status integer NOT NULL,
    order_id uuid NOT NULL,
    CONSTRAINT "PK_order_change_histories" PRIMARY KEY (id)
);

CREATE TABLE orders (
    id uuid NOT NULL,
    order_number integer NOT NULL,
    creation_date timestamp with time zone NOT NULL,
    manager_id uuid NOT NULL,
    dispatcher_id uuid,
    cargo_id uuid,
    CONSTRAINT "PK_orders" PRIMARY KEY (id),
    CONSTRAINT "FK_orders_users_dispatcher_id" FOREIGN KEY (dispatcher_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT "FK_orders_users_manager_id" FOREIGN KEY (manager_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE products (
    id uuid NOT NULL,
    name character varying(256) NOT NULL,
    description character varying(2000),
    price numeric NOT NULL,
    quantity real NOT NULL,
    expiry real NOT NULL,
    units_of_measure integer NOT NULL,
    category_id uuid NOT NULL,
    company_id uuid NOT NULL,
    CONSTRAINT "PK_products" PRIMARY KEY (id),
    CONSTRAINT "FK_products_categories_category_id" FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT "FK_products_companies_company_id" FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT
);

CREATE TABLE order_lines (
    id uuid NOT NULL,
    quantity_of_units integer NOT NULL,
    product_id uuid NOT NULL,
    order_id uuid NOT NULL,
    CONSTRAINT "PK_order_lines" PRIMARY KEY (id),
    CONSTRAINT "FK_order_lines_orders_order_id" FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT "FK_order_lines_products_product_id" FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
);

CREATE INDEX "IX_order_lines_order_id" ON order_lines (order_id);

CREATE INDEX "IX_order_lines_product_id" ON order_lines (product_id);

CREATE INDEX "IX_orders_dispatcher_id" ON orders (dispatcher_id);

CREATE INDEX "IX_orders_manager_id" ON orders (manager_id);

CREATE INDEX "IX_products_category_id" ON products (category_id);

CREATE INDEX "IX_products_company_id" ON products (company_id);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260531122518_AddProductsAndOrders', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE orders ADD delivery_address character varying(255);

ALTER TABLE orders ADD production_address character varying(255);

ALTER TABLE orders ADD status integer NOT NULL DEFAULT 0;

CREATE INDEX "IX_order_change_histories_order_id" ON order_change_histories (order_id);

ALTER TABLE order_change_histories ADD CONSTRAINT "FK_order_change_histories_orders_order_id" FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260531200310_AddOrderAddresses', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE orders ADD payment_type character varying(64);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260531210000_AddOrderPaymentType', '10.0.8');

COMMIT;

START TRANSACTION;
UPDATE orders SET cargo_id = NULL WHERE cargo_id IS NOT NULL;

CREATE TABLE cargos (
    id uuid NOT NULL,
    loading_date timestamp with time zone NOT NULL,
    unloading_date timestamp with time zone NOT NULL,
    delivery_address character varying(512) NOT NULL,
    volume numeric(18,3) NOT NULL,
    weight numeric(18,3) NOT NULL,
    status integer NOT NULL,
    logistic_company_id uuid,
    driver_id uuid,
    CONSTRAINT "PK_cargos" PRIMARY KEY (id),
    CONSTRAINT "FK_cargos_companies_logistic_company_id" FOREIGN KEY (logistic_company_id) REFERENCES companies (id) ON DELETE SET NULL,
    CONSTRAINT "FK_cargos_users_driver_id" FOREIGN KEY (driver_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE cargo_change_histories (
    id uuid NOT NULL,
    change_time timestamp with time zone NOT NULL,
    cargo_status integer NOT NULL,
    cargo_id uuid NOT NULL,
    CONSTRAINT "PK_cargo_change_histories" PRIMARY KEY (id),
    CONSTRAINT "FK_cargo_change_histories_cargos_cargo_id" FOREIGN KEY (cargo_id) REFERENCES cargos (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_orders_cargo_id" ON orders (cargo_id);

CREATE INDEX "IX_cargo_change_histories_cargo_id" ON cargo_change_histories (cargo_id);

CREATE INDEX "IX_cargos_driver_id" ON cargos (driver_id);

CREATE INDEX "IX_cargos_logistic_company_id" ON cargos (logistic_company_id);

CREATE INDEX "IX_cargos_status" ON cargos (status);

ALTER TABLE orders ADD CONSTRAINT "FK_orders_cargos_cargo_id" FOREIGN KEY (cargo_id) REFERENCES cargos (id) ON DELETE SET NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260531230000_AddCargo', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE order_change_histories ADD comment character varying(2000);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260601172045_AddOrderChangeHistoryComment', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE cargos ADD transport_vehicle_id uuid;

CREATE TABLE vehicle_brands (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    name character varying(128) NOT NULL,
    CONSTRAINT "PK_vehicle_brands" PRIMARY KEY (id)
);

CREATE TABLE vehicle_models (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    name character varying(128) NOT NULL,
    brand_id uuid NOT NULL,
    CONSTRAINT "PK_vehicle_models" PRIMARY KEY (id),
    CONSTRAINT "FK_vehicle_models_vehicle_brands_brand_id" FOREIGN KEY (brand_id) REFERENCES vehicle_brands (id) ON DELETE RESTRICT
);

CREATE TABLE transport_vehicles (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    registration_number character varying(32) NOT NULL,
    capacity numeric(10,2) NOT NULL,
    employee_id uuid NOT NULL,
    model_id uuid NOT NULL,
    company_id uuid NOT NULL,
    CONSTRAINT "PK_transport_vehicles" PRIMARY KEY (id),
    CONSTRAINT "FK_transport_vehicles_companies_company_id" FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
    CONSTRAINT "FK_transport_vehicles_employees_employee_id" FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE RESTRICT,
    CONSTRAINT "FK_transport_vehicles_vehicle_models_model_id" FOREIGN KEY (model_id) REFERENCES vehicle_models (id) ON DELETE RESTRICT
);

CREATE INDEX "IX_cargos_transport_vehicle_id" ON cargos (transport_vehicle_id);

CREATE UNIQUE INDEX "IX_transport_vehicles_company_id_registration_number" ON transport_vehicles (company_id, registration_number);

CREATE INDEX "IX_transport_vehicles_employee_id" ON transport_vehicles (employee_id);

CREATE INDEX "IX_transport_vehicles_model_id" ON transport_vehicles (model_id);

CREATE UNIQUE INDEX "IX_vehicle_brands_name" ON vehicle_brands (name);

CREATE UNIQUE INDEX "IX_vehicle_models_brand_id_name" ON vehicle_models (brand_id, name);

ALTER TABLE cargos ADD CONSTRAINT "FK_cargos_transport_vehicles_transport_vehicle_id" FOREIGN KEY (transport_vehicle_id) REFERENCES transport_vehicles (id) ON DELETE SET NULL;

INSERT INTO vehicle_brands (id, name) VALUES
  ('11111111-1111-1111-1111-111111111101', 'КАМАЗ'),
  ('11111111-1111-1111-1111-111111111102', 'МАЗ'),
  ('11111111-1111-1111-1111-111111111103', 'Scania');

INSERT INTO vehicle_models (id, name, brand_id) VALUES
  ('22222222-2222-2222-2222-222222222201', '65115', '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222202', '5337', '11111111-1111-1111-1111-111111111102'),
  ('22222222-2222-2222-2222-222222222203', 'R450', '11111111-1111-1111-1111-111111111103');

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260602113141_AddTransportVehicles', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE orders ADD proposed_delivery_date timestamp with time zone;

ALTER TABLE orders ADD reschedule_reason character varying(2000);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260602120000_AddOrderRescheduleFields', '10.0.8');

COMMIT;

START TRANSACTION;
CREATE INDEX "IX_orders_creation_date" ON orders (creation_date);

CREATE INDEX "IX_orders_status_creation_date" ON orders (status, creation_date);

CREATE INDEX "IX_orders_order_number" ON orders (order_number);

CREATE INDEX "IX_order_change_histories_order_status_change_time" ON order_change_histories (order_status, change_time);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260602125214_AddOrdersDispatcherListIndexes', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE orders ADD shipment_height_m numeric(18,3);

ALTER TABLE orders ADD shipment_length_m numeric(18,3);

ALTER TABLE orders ADD shipment_weight_kg numeric(18,3);

ALTER TABLE orders ADD shipment_width_m numeric(18,3);

ALTER TABLE cargos ADD dimensions character varying(64);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260602140000_AddOrderShipmentDimensions', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE orders ADD deadline_confirmation_expires_at timestamp with time zone;

ALTER TABLE orders ADD deadline_confirmation_phase integer NOT NULL DEFAULT 0;

ALTER TABLE orders ADD deadline_confirmation_requested_at timestamp with time zone;

ALTER TABLE orders ADD requested_delivery_date timestamp with time zone;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260602160000_AddOrderDeadlineConfirmation', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE products ADD file_id uuid;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260602180000_AddProductFileId', '10.0.8');

COMMIT;

START TRANSACTION;
WITH to_number AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY creation_date, id) AS row_num
    FROM orders
    WHERE order_number <= 0 AND status <> 0
),
max_num AS (
    SELECT COALESCE(MAX(order_number), 0) AS value FROM orders WHERE order_number > 0
)
UPDATE orders o
SET order_number = max_num.value + to_number.row_num
FROM to_number, max_num
WHERE o.id = to_number.id;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260602180000_BackfillOrderNumbers', '10.0.8');

COMMIT;

