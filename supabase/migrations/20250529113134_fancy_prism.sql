-- Database schema for PickPoint package management system

-- Create database
CREATE DATABASE IF NOT EXISTS pickpoint;
USE pickpoint;

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  address TEXT,
  default_price DECIMAL(10, 2) DEFAULT 0.00,
  pricing_model ENUM('simple', 'advanced') DEFAULT 'simple',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL,
  location_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- Prices table for advanced pricing
CREATE TABLE IF NOT EXISTS prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT NOT NULL,
  size_id VARCHAR(20) NOT NULL, -- 'small', 'medium', 'large'
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE KEY (location_id, size_id)
);

-- Recipients table
CREATE TABLE IF NOT EXISTS recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(100) NULL UNIQUE,
  unit_apartment VARCHAR(50) NULL,
  location_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_number VARCHAR(100) NOT NULL UNIQUE,
  recipient_id INT NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_phone VARCHAR(20) NULL,
  carrier_name VARCHAR(50) NULL,
  package_description TEXT NULL,
  package_image VARCHAR(255) NULL,
  qr_code_url VARCHAR(255) NULL,
  location_id INT NOT NULL,
  received_by_user_id INT NOT NULL,
  received_datetime TIMESTAMP NOT NULL,
  pickup_code VARCHAR(10) NOT NULL UNIQUE,
  status ENUM('stored', 'picked_up', 'destroyed') NOT NULL DEFAULT 'stored',
  price_charged DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(20) NULL,
  picked_up_datetime TIMESTAMP NULL,
  picked_up_by_user_id INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  FOREIGN KEY (received_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (picked_up_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_name VARCHAR(50) NOT NULL UNIQUE,
  template_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notification logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  package_id INT NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  sent_status ENUM('success', 'failed') NOT NULL,
  gateway_response TEXT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, full_name, role, location_id)
VALUES ('admin', '$2a$10$Y.nZDg7edCKFP.YzRi/wQe7oR3tUZa5PgxWoXJT74hLtDLeXBgmXG', 'Administrator', 'admin', NULL);

-- Insert sample notification templates
INSERT INTO notification_templates (template_name, template_content)
VALUES 
  ('paket_tiba', 'Yth. [NamaPenerima], paket dengan no. resi [NoResi] telah diterima di [NamaLokasi] pada [TanggalTerima] [JamTerima]. Silakan ambil dengan kode [KodePengambilan]. Biaya: Rp [HargaPaket]. Terima kasih.'),
  ('paket_diambil', 'Yth. [NamaPenerima], paket dengan no. resi [NoResi] telah berhasil diambil pada [TanggalTerima] [JamTerima]. Terima kasih telah menggunakan layanan PickPoint.');