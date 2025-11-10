CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    stock_quantity DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE operations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cost DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    total_cost DECIMAL(10, 2) DEFAULT 0,
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_operations_name ON operations(name);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_deadline ON orders(deadline);

INSERT INTO materials (name, unit, price_per_unit, stock_quantity) VALUES
('Сталь листовая', 'кг', 150.00, 500.00),
('Алюминий', 'кг', 280.00, 200.00),
('Краска акриловая', 'л', 450.00, 50.00);

INSERT INTO operations (name, description, cost, duration_minutes) VALUES
('Резка металла', 'Лазерная резка листового металла', 500.00, 30),
('Сварка', 'Сварка металлических деталей', 800.00, 45),
('Покраска', 'Нанесение защитного покрытия', 600.00, 60);

INSERT INTO orders (customer_name, description, status, total_cost, deadline) VALUES
('ООО "Строймонтаж"', 'Изготовление металлоконструкций', 'pending', 15000.00, '2025-12-01'),
('ИП Иванов', 'Ремонт оборудования', 'in_progress', 8500.00, '2025-11-20'),
('ЗАО "ТехПром"', 'Производство деталей', 'completed', 25000.00, '2025-11-05');