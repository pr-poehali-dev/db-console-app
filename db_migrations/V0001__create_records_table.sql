CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_records_category ON records(category);
CREATE INDEX idx_records_status ON records(status);

INSERT INTO records (title, description, category, status) VALUES
('Первая запись', 'Пример записи в базе данных', 'Документы', 'active'),
('Вторая запись', 'Ещё один пример для демонстрации', 'Проекты', 'active'),
('Третья запись', 'Тестовая запись для проверки', 'Задачи', 'completed');