-- Table for residents (students and faculty)
CREATE TABLE resident (
    resident_id VARCHAR(20) PRIMARY KEY,
    resident_name VARCHAR(100) NOT NULL,
    home_address JSONB NOT NULL, -- Stores address as JSON
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
		photo BYTEA
);

-- Table for organizational units
CREATE TABLE org_unit (
    unit_name VARCHAR(100) PRIMARY KEY,
    unit_type VARCHAR(50) NOT NULL
);

-- Table for linking residents and organizational units (res_org)
CREATE TABLE res_org (
    resident_id VARCHAR(20) NOT NULL,
    unit_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (resident_id, unit_name),
    FOREIGN KEY (resident_id) REFERENCES resident(resident_id),
    FOREIGN KEY (unit_name) REFERENCES org_unit(unit_name)
);

-- Table for students
CREATE TABLE student (
    resident_id VARCHAR(20) PRIMARY KEY,
    college_address VARCHAR(255),
    FOREIGN KEY (resident_id) REFERENCES resident(resident_id)
);

-- Table for faculty
CREATE TABLE faculty (
    resident_id VARCHAR(20) PRIMARY KEY,
    college_address VARCHAR(255),
    FOREIGN KEY (resident_id) REFERENCES resident(resident_id)
);

-- Table for visitors
CREATE TABLE visitor (
    visitor_id SERIAL PRIMARY KEY,
    visitor_name VARCHAR(100) NOT NULL,
    from_address JSONB NOT NULL, -- Stores visitor's address
    expected_stay INTERVAL NOT NULL
);

-- Table for linking residents and visitors (res_visitors)
CREATE TABLE res_visitors (
    resident_id VARCHAR(20) NOT NULL,
    visitor_id INT NOT NULL,
    PRIMARY KEY (resident_id, visitor_id),
    FOREIGN KEY (resident_id) REFERENCES resident(resident_id),
    FOREIGN KEY (visitor_id) REFERENCES visitor(visitor_id)
);

-- Table for access logs
CREATE TABLE access (
    access_id SERIAL PRIMARY KEY,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP
);

-- Table for linking residents and access logs (res_accesses)
CREATE TABLE res_accesses (
    resident_id VARCHAR(20) NOT NULL,
    access_id INT NOT NULL,
    PRIMARY KEY (resident_id, access_id),
    FOREIGN KEY (resident_id) REFERENCES resident(resident_id),
    FOREIGN KEY (access_id) REFERENCES access(access_id)
);

-- Table for linking visitors and access logs (visitor_accesses)
CREATE TABLE visitor_accesses (
    visitor_id INT NOT NULL,
    access_id INT NOT NULL,
    password VARCHAR(50), -- For OTP or other authentication mechanisms
    PRIMARY KEY (visitor_id, access_id),
    FOREIGN KEY (visitor_id) REFERENCES visitor(visitor_id),
    FOREIGN KEY (access_id) REFERENCES access(access_id)
);

-- Table for vehicles
CREATE TABLE vehicle (
    vehicle_number VARCHAR(20) PRIMARY KEY,
    vehicle_type VARCHAR(50),
    access_id INT NOT NULL,
    FOREIGN KEY (access_id) REFERENCES access(access_id)
);

-- Creating index on resident_id
CREATE INDEX ResidentId on resident(resident_id);

-- Creating index on resident_name
CREATE INDEX ResidentName on resident(resident_name);
