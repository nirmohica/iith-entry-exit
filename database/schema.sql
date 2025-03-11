-- Table for organizational units (e.g., departments)
CREATE TABLE org_unit (
    unit_name VARCHAR(100) PRIMARY KEY,
    unit_type VARCHAR(50) NOT NULL
);

-- Table for residents (students and faculty)
CREATE TABLE resident (
    resident_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    home_address JSONB NOT NULL, -- Stores address as JSON (address_line_1, address_line_2, city, zip, state)
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    unit_name VARCHAR(100),
    FOREIGN KEY (unit_name) REFERENCES org_unit(unit_name)
);

-- Table for students
CREATE TABLE student (
    resident_id INT PRIMARY KEY,
    college_address VARCHAR(255),
    FOREIGN KEY (resident_id) REFERENCES resident(resident_id)
);

-- Table for faculty
CREATE TABLE faculty (
    resident_id INT PRIMARY KEY,
    college_address VARCHAR(255),
    FOREIGN KEY (resident_id) REFERENCES resident(resident_id)
);

-- Table for visitors
CREATE TABLE visitor (
    visitor_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    from_address JSONB NOT NULL, -- Stores visitor's address
    expected_stay INTERVAL NOT NULL,
    related_resident_id INT NOT NULL,
    FOREIGN KEY (related_resident_id) REFERENCES resident(resident_id)
);

-- Table for visitor groups (to group multiple visitors under one resident)
CREATE TABLE visitor_group (
    group_id SERIAL PRIMARY KEY,
    related_resident_id INT NOT NULL,
    FOREIGN KEY (related_resident_id) REFERENCES resident(resident_id)
);

-- Table for access logs
CREATE TABLE access (
    access_id SERIAL PRIMARY KEY,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP,
    resident_id INT,
    visitor_group_id INT,
    FOREIGN KEY (resident_id) REFERENCES resident(resident_id),
    FOREIGN KEY (visitor_group_id) REFERENCES visitor_group(group_id)
);

-- Table for vehicles
CREATE TABLE vehicle (
    vehicle_number VARCHAR(20) PRIMARY KEY,
    vehicle_type VARCHAR(50),
    access_id INT NOT NULL,
    FOREIGN KEY (access_id) REFERENCES access(access_id)
);

-- Table for OTP management
CREATE TABLE visitor_otp (
    otp_id SERIAL PRIMARY KEY,
    otp_code VARCHAR(6) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    visitor_group_id INT NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (visitor_group_id) REFERENCES visitor_group(group_id)
);
