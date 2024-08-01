-- Insert sample data into the "hub_devices" table
INSERT INTO
    hub_devices (device_name, availability, hub_name, hub_ip)
VALUES
    ('Device 1', true, 'Hub 1', '192.168.1.1'),
    ('Device 2', false, 'Hub 2', '192.168.1.2'),
    ('Device 3', true, 'Hub 3', '192.168.1.3');

-- Insert sample data into the "terminals" table
INSERT INTO
    terminals (
        mac_address,
        ip_address,
        host_name,
        availability,
        status
    )
VALUES
    (
        'AA:BB:CC:DD:EE:01',
        '192.168.2.1',
        'Terminal 1',
        true,
        1
    ),
    (
        'AA:BB:CC:DD:EE:02',
        '192.168.2.2',
        'Terminal 2',
        true,
        0
    ),
    (
        'AA:BB:CC:DD:EE:03',
        '192.168.2.3',
        'Terminal 3',
        false,
        0
    );

--Insert sample data into users
INSERT INTO
    users (name, email)
VALUES
    ('user1', 'user1Test@test.com'),
    ('user2', 'user2test@test.com'),
    ('user3', 'user3test@test.com');

--Insert sample data into bookings
INSERT INTO
    bookings (
        user_id,
        terminal_id,
        status,
        start_date,
        end_date
    )
VALUES
    (
        1,
        1,
        1,
        '2023-04-27T17:48:54.659Z',
        '2023-04-27T19:48:54.659Z'
    ),
    (
        2,
        2,
        0,
        '2023-04-28T14:30:00.000Z',
        '2023-04-28T16:45:00.000Z'
    ),
    (
        1,
        3,
        1,
        '2023-04-29T08:00:00.000Z',
        '2023-04-29T09:30:00.000Z'
    ),
    (
        3,
        1,
        0,
        '2023-04-30T11:15:00.000Z',
        '2023-04-30T13:00:00.000Z'
    );