create table
    terminals (
        id serial primary key,
        mac_address varchar(254) not null,
        ip_address varchar(254),
        host_name varchar(254),
        availability boolean not null,
        status INT DEFAULT 0 not null
    );