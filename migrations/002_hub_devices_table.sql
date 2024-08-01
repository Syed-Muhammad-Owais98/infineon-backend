create table
    hub_devices (
        id serial primary key,
        device_name varchar(254) not null,
        availability boolean not null,
        hub_name varchar(254),
        hub_ip varchar(254)
    );