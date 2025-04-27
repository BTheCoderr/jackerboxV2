-- Insert test users
INSERT INTO "User" (id, email, name, password, isadmin, emailverified, phoneverified, phone, idverified, idverificationstatus, idverificationdate, bio)
VALUES 
  ('admin1', 'admin@test.com', 'Admin User', '$2a$10$abcdefghijklmnopqrstuvwxyz', true, CURRENT_TIMESTAMP, true, '5551234567', true, 'approved', CURRENT_TIMESTAMP, NULL),
  ('owner1', 'owner1@test.com', 'Sarah Johnson', '$2a$10$abcdefghijklmnopqrstuvwxyz', false, CURRENT_TIMESTAMP, true, '5552345678', true, 'approved', CURRENT_TIMESTAMP - INTERVAL '30 days', 'Professional photographer with high-end equipment available for rent.'),
  ('owner2', 'owner2@test.com', 'Michael Chen', '$2a$10$abcdefghijklmnopqrstuvwxyz', false, CURRENT_TIMESTAMP, true, '5553456789', true, 'approved', CURRENT_TIMESTAMP - INTERVAL '15 days', 'Audio engineer with professional sound equipment.'),
  ('owner3', 'owner3@test.com', 'Emily Rodriguez', '$2a$10$abcdefghijklmnopqrstuvwxyz', false, CURRENT_TIMESTAMP, true, '5554567890', false, 'pending', NULL, 'Videographer with a collection of cameras and accessories.'),
  ('renter1', 'renter1@test.com', 'David Wilson', '$2a$10$abcdefghijklmnopqrstuvwxyz', false, CURRENT_TIMESTAMP, true, '5555678901', true, 'approved', CURRENT_TIMESTAMP - INTERVAL '10 days', 'Freelance filmmaker looking for equipment for short projects.'),
  ('renter2', 'renter2@test.com', 'Jessica Lee', '$2a$10$abcdefghijklmnopqrstuvwxyz', false, CURRENT_TIMESTAMP, false, NULL, false, NULL, NULL, 'Photography student looking to try different equipment.');

-- Insert equipment
INSERT INTO "Equipment" (id, title, description, condition, category, subcategory, tagsjson, location, dailyrate, weeklyrate, securitydeposit, isavailable, imagesjson, moderationstatus, ownerid, createdat, updatedat)
VALUES 
  ('cam1', 'Sony Alpha a7 III Mirrorless Camera', 'Professional full-frame mirrorless camera with 24.2MP sensor, 4K video, and excellent low-light performance. Includes 28-70mm lens, 2 batteries, charger, and carrying case.', 'Excellent', 'Photography', 'Cameras', '["mirrorless", "full-frame", "sony", "4k"]', 'San Francisco, CA', 75, 450, 1000, true, '["\/images\/placeholder.svg", "\/images\/placeholder.svg"]', 'APPROVED', 'owner1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cam2', 'Canon EOS 5D Mark IV DSLR Camera', 'Professional DSLR with 30.4MP full-frame sensor, 4K video recording, and weather-sealed body. Includes 24-105mm f/4L lens, extra battery, and memory card.', 'Good', 'Photography', 'Cameras', '["dslr", "full-frame", "canon", "4k"]', 'San Francisco, CA', 65, 390, 800, true, '["\/images\/placeholder.svg", "\/images\/placeholder.svg"]', 'APPROVED', 'owner1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mix1', 'Allen & Heath SQ-6 Digital Mixer', 'Professional 48-channel digital mixer with 24 mic/line inputs, 16 XLR outputs, and intuitive touchscreen interface. Perfect for live sound and studio recording.', 'Excellent', 'Audio', 'Mixers', '["mixer", "digital", "professional", "studio"]', 'San Francisco, CA', 100, 600, 1500, true, '["\/images\/placeholder.svg"]', 'APPROVED', 'owner2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert some rentals
INSERT INTO "Rental" (id, startdate, enddate, status, totalamount, equipmentid, renterid, createdat, updatedat)
VALUES 
  ('rent1', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '4 days', 'PENDING', 225, 'cam1', 'renter1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('rent2', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 'COMPLETED', 390, 'cam2', 'renter2', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Insert some reviews
INSERT INTO "Review" (id, rating, comment, createdat, updatedat, authorid, receiverid, equipmentid, rentalid)
VALUES 
  ('rev1', 5, 'Excellent camera, perfect condition and great communication from the owner.', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 'renter2', 'owner1', 'cam2', 'rent2'),
  ('rev2', 4, 'Very professional renter, took good care of the equipment.', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 'owner1', 'renter2', 'cam2', 'rent2');

-- Insert some messages
INSERT INTO "Message" (id, content, createdat, senderid, receiverid, readat)
VALUES 
  ('msg1', 'Hi, I''m interested in renting your camera. Is it available next weekend?', CURRENT_TIMESTAMP - INTERVAL '2 days', 'renter1', 'owner1', CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('msg2', 'Yes, it''s available! When exactly do you need it?', CURRENT_TIMESTAMP - INTERVAL '1 day', 'owner1', 'renter1', CURRENT_TIMESTAMP - INTERVAL '12 hours'); 