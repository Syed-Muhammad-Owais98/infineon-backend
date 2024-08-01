CREATE TABLE
    bookings (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        terminal_id INT NOT NULL,
        status INT DEFAULT 0,
        start_date TIMESTAMPTZ DEFAULT NULL,
        end_date TIMESTAMPTZ DEFAULT NULL,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id),
        CONSTRAINT fk_terminal FOREIGN KEY (terminal_id) REFERENCES terminals (id)
    );