require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Room = require("../models/Room");
const Review = require("../models/Review");
const RoommatePost = require("../models/RoommatePost");

// Real, curated photo sets with:
// 1. Exterior front building facade / entrance gate
// 2. Interior bedroom with student beds
// 3. Study table & chair setup
// 4. Clean attached bathroom / geyser
// 5. Hygienic student dining / mess hall
const REAL_PHOTOS = {
  gecBoys: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80", // Multi-story Student PG Building Exterior Front
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80", // 2-Sharing Student Bedroom
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80", // Dedicated Study Desk & Lamp
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80", // Clean Attached Bathroom & Geyser
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80", // Student Mess & Dining
  ],
  gecGirls: [
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1000&q=80", // Secure Gated Student Residency Building
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80", // Girls Student Bedroom with Storage
    "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=1000&q=80", // Study Workspace
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1000&q=80", // Attached Clean Bathroom
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80", // Hygienic Mess Hall
  ],
  kumarbaghLodge: [
    "https://images.unsplash.com/photo-1555636222-cae831e670b3?auto=format&fit=crop&w=1000&q=80", // Kumarbagh Lodge Building Front Look
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80", // Bedroom Interior
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80", // Study Table
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80", // Clean Washroom
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80", // Dining Area
  ],
  bettiahPG: [
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1000&q=80", // Bettiah Town Residency Front View
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1000&q=80", // Student Room & Wardrobe
    "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=1000&q=80", // Dedicated Study Desk
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1000&q=80", // Attached Bathroom
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80", // Mess & Dining Area
  ],
  chanpatiaPG: [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80", // Urban Student Lodge Facade
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80", // Student Bedroom
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80", // Study Desk
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80", // Washroom
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80", // Dining Area
  ],
  narkatiaganjPG: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80", // Student Lodge Building Exterior
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80", // Student Beds
    "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=1000&q=80", // Study Workspace
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1000&q=80", // Clean Washroom
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80", // Dining Area
  ],
  duBoys: [
    "https://images.unsplash.com/photo-1555636222-cae831e670b3?auto=format&fit=crop&w=1000&q=80", // DU Kamla Nagar Student Building
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80", // Student Bedroom
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80", // Study Desk
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80", // Washroom
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80", // Dining
  ],
  cuhpPG: [
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1000&q=80", // Mountain View Student Residency
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1000&q=80", // Bedroom
    "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=1000&q=80", // Study Desk
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1000&q=80", // Washroom
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80", // Dining
  ],
};

async function run() {
  await connectDB();

  console.log("[seed] clearing existing data...");
  await Promise.all([User.deleteMany({}), Room.deleteMany({}), Review.deleteMany({}), RoommatePost.deleteMany({})]);

  const password = await bcrypt.hash("password123", 10);

  console.log("[seed] creating verified owners and student accounts for GEC West Champaran...");
  const admin = await User.create({
    name: "Platform Admin",
    email: "admin@roomnest.in",
    phone: "9811001100",
    password,
    role: "admin",
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  // Local verified landlords around Kumarbagh & Bettiah
  const ownerKumarbagh = await User.create({
    name: "Mukesh Kumar Tiwari",
    email: "mukesh.kumarbagh@roomnest.in",
    phone: "9431201122",
    password,
    role: "owner",
    isPhoneVerified: true,
    isEmailVerified: true,
    ownerVerification: { aadhaarOrPan: "ABCDM1234T", status: "verified" },
  });

  const ownerBettiah = await User.create({
    name: "Sanjay Kumar Verma",
    email: "sanjay.bettiah@roomnest.in",
    phone: "9835012345",
    password,
    role: "owner",
    isPhoneVerified: true,
    isEmailVerified: true,
    ownerVerification: { aadhaarOrPan: "PQRSV5678B", status: "verified" },
  });

  const ownerGirlsPG = await User.create({
    name: "Shanti Devi (Warden)",
    email: "shanti.warden@roomnest.in",
    phone: "9122334455",
    password,
    role: "owner",
    isPhoneVerified: true,
    isEmailVerified: true,
    ownerVerification: { aadhaarOrPan: "XYZSD9988K", status: "verified" },
  });

  // Students of GEC West Champaran
  const studentGEC = await User.create({
    name: "Rahul Verma (GEC CSE 2nd Year)",
    email: "rahul.gec@roomnest.in",
    phone: "9708123456",
    password,
    role: "user",
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  const studentGirls = await User.create({
    name: "Pooja Kumari (GEC Civil 1st Year)",
    email: "pooja.gec@roomnest.in",
    phone: "9934567890",
    password,
    role: "user",
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  console.log("[seed] populating GEC West Champaran & surrounding localities (Kumarbagh, Bettiah, Chanpatia, Narkatiaganj)...");
  const rooms = await Room.insertMany([
    // 1. Kumarbagh - Right outside GEC West Champaran Main Gate
    {
      owner: ownerKumarbagh._id,
      title: "Aryabhatta Engineers Boys PG & Mess — 300m to GEC West Champaran Gate",
      description:
        "Specifically established for GEC West Champaran engineering students. Just 300 meters (4 minutes walk) from the GEC main academic gate in Kumarbagh. Includes 3 nutritious home-cooked meals (Roti, Dal, Sabzi, Rice), high-speed 100 Mbps Wi-Fi, heavy-duty study table with lamp, 24x7 inverter power backup, geyser for winter, RO drinking water, and formal rental agreement.",
      campus: "GEC West Champaran (Kumarbagh)",
      distanceToCampusKm: 0.3,
      walkingTimeMinutes: 4,
      cyclingTimeMinutes: 1,
      transitTimeMinutes: 2,
      city: "Bettiah",
      area: "Kumarbagh",
      address: "Main College Road, Near GEC Kumarbagh Gate 1, West Champaran, Bihar - 845455",
      landmark: "300m from GEC West Champaran Main Gate & Kumarbagh Chowk",
      nearbyCollege: "GEC West Champaran (Kumarbagh)",
      nearbyRailwayStation: "Kumarbagh Railway Station (700m)",
      location: { type: "Point", coordinates: [84.4530, 26.8375] }, // Kumarbagh GEC coordinates
      rent: 4500,
      deposit: 4500,
      maintenanceCharge: 0,
      electricityCharge: "Included",
      waterCharge: "Included",
      foodIncluded: true,
      foodType: "Both",
      foodChargeMonthly: 0,
      isZeroBrokerage: true,
      rentAgreementAvailable: true,
      roomType: "PG",
      sharingType: "2-Sharing",
      occupancy: "Boys",
      furnishing: "Furnished",
      totalBeds: 24,
      availableBeds: 4,
      immediateMoveIn: true,
      amenities: {
        wifi: true,
        ac: false,
        attachedBathroom: true,
        kitchen: false,
        parking: true,
        petFriendly: false,
        powerBackup: true,
        laundry: true,
        studyTable: true,
        roWater: true,
        cctv: true,
        housekeeping: true,
        refrigerator: true,
        geyser: true,
      },
      images: REAL_PHOTOS.gecBoys,
      curfewTime: "10:00 PM",
      noticePeriod: "1 Month",
      rules: [
        "Curfew at 10:00 PM (gate locked)",
        "3 meals a day provided (Special Sunday feast)",
        "Quiet study hours strictly maintained between 10 PM and 6 AM",
        "Formal rent agreement provided on move-in for college submit",
      ],
      contactPerson: "Mukesh Kumar Tiwari (Owner on premises)",
      contactPhone: "9431201122",
      whatsappNumber: "9431201122",
      callingHours: "7:30 AM - 9:00 PM",
      isVerified: true,
      verificationStatus: "approved",
      verificationBadges: ["GEC Campus Verified", "Physical Inspection Done", "Rent Agreement Provided", "Zero Brokerage"],
      verifiedDate: new Date("2026-09-01"),
      inspectedBy: "RoomNest West Champaran Campus Team",
      ratingAverage: 4.8,
      ratingCount: 32,
      ratingsBreakdown: {
        cleanliness: 4.8,
        safety: 4.9,
        ownerBehaviour: 4.8,
        foodQuality: 4.7,
        internetSpeed: 4.9,
        distanceAccuracy: 5.0,
      },
    },

    // 2. Kumarbagh - Girls PG near GEC West Champaran
    {
      owner: ownerGirlsPG._id,
      title: "Maa Saraswati Girls Residency & Mess — 600m to GEC West Champaran",
      description:
        "Dedicated safe accommodation for female students studying at GEC West Champaran. 24x7 female warden on site, CCTV surveillance, gated campus, hygienic 3-time home meals, hot water geyser, dedicated study tables, and biometric entry. Located in a quiet, safe residential lane near Kumarbagh Chowk.",
      campus: "GEC West Champaran (Kumarbagh)",
      distanceToCampusKm: 0.6,
      walkingTimeMinutes: 7,
      cyclingTimeMinutes: 2,
      transitTimeMinutes: 3,
      city: "Bettiah",
      area: "Kumarbagh",
      address: "Station Road, Near Kumarbagh Chowk, West Champaran, Bihar - 845455",
      landmark: "Near Kumarbagh Post Office & 600m to GEC Campus",
      nearbyCollege: "GEC West Champaran (Kumarbagh)",
      nearbyRailwayStation: "Kumarbagh Railway Station (500m)",
      location: { type: "Point", coordinates: [84.4550, 26.8390] },
      rent: 4800,
      deposit: 4800,
      maintenanceCharge: 0,
      electricityCharge: "Included",
      waterCharge: "Included",
      foodIncluded: true,
      foodType: "Veg",
      foodChargeMonthly: 0,
      isZeroBrokerage: true,
      rentAgreementAvailable: true,
      roomType: "PG",
      sharingType: "2-Sharing",
      occupancy: "Girls",
      furnishing: "Furnished",
      totalBeds: 20,
      availableBeds: 3,
      immediateMoveIn: true,
      amenities: {
        wifi: true,
        ac: false,
        attachedBathroom: true,
        kitchen: false,
        parking: true,
        petFriendly: false,
        powerBackup: true,
        laundry: true,
        studyTable: true,
        roWater: true,
        cctv: true,
        housekeeping: true,
        refrigerator: true,
        geyser: true,
      },
      images: REAL_PHOTOS.gecGirls,
      curfewTime: "9:30 PM",
      noticePeriod: "1 Month",
      rules: [
        "24x7 female warden on premises",
        "Entry closed at 9:30 PM",
        "Attendance marked daily",
        "Parents can stay in guest room upon prior intimation",
      ],
      contactPerson: "Shanti Devi (Resident Warden)",
      contactPhone: "9122334455",
      whatsappNumber: "9122334455",
      callingHours: "8:00 AM - 8:00 PM",
      isVerified: true,
      verificationStatus: "approved",
      verificationBadges: ["GEC Campus Verified", "Female Warden on Site", "Rent Agreement Provided", "Zero Brokerage"],
      verifiedDate: new Date("2026-09-05"),
      inspectedBy: "RoomNest Safety Audit",
      ratingAverage: 4.9,
      ratingCount: 26,
      ratingsBreakdown: {
        cleanliness: 5.0,
        safety: 5.0,
        ownerBehaviour: 4.8,
        foodQuality: 4.8,
        internetSpeed: 4.7,
        distanceAccuracy: 5.0,
      },
    },

    // 3. Kumarbagh Station Road - Budget Engineering Student Rooms
    {
      owner: ownerKumarbagh._id,
      title: "Engineers Elite Lodge — Kumarbagh Station Road",
      description:
        "Affordable shared accommodation for GEC students. 800m from college gate. Large airy rooms with individual study tables, high-speed Wi-Fi, 24x7 running water, solar water heating, and bike parking. Zero brokerage and student agreement included.",
      campus: "GEC West Champaran (Kumarbagh)",
      distanceToCampusKm: 0.8,
      walkingTimeMinutes: 10,
      cyclingTimeMinutes: 3,
      transitTimeMinutes: 4,
      city: "Bettiah",
      area: "Kumarbagh",
      address: "Station Road, Kumarbagh Bazar, West Champaran - 845455",
      landmark: "Near Kumarbagh Station Platform 1",
      nearbyCollege: "GEC West Champaran (Kumarbagh)",
      nearbyRailwayStation: "Kumarbagh Station (200m)",
      location: { type: "Point", coordinates: [84.4570, 26.8410] },
      rent: 3200,
      deposit: 3200,
      maintenanceCharge: 150,
      electricityCharge: "Included",
      waterCharge: "Included",
      foodIncluded: false,
      foodType: "None",
      foodChargeMonthly: 2000,
      isZeroBrokerage: true,
      rentAgreementAvailable: true,
      roomType: "Shared Room",
      sharingType: "2-Sharing",
      occupancy: "Boys",
      furnishing: "Furnished",
      totalBeds: 16,
      availableBeds: 3,
      immediateMoveIn: true,
      amenities: {
        wifi: true,
        ac: false,
        attachedBathroom: false,
        kitchen: true,
        parking: true,
        petFriendly: false,
        powerBackup: true,
        laundry: true,
        studyTable: true,
        roWater: true,
        cctv: true,
        housekeeping: true,
        refrigerator: false,
        geyser: true,
      },
      images: REAL_PHOTOS.kumarbaghLodge,
      curfewTime: "10:30 PM",
      noticePeriod: "1 Month",
      rules: [
        "Quiet atmosphere for exam and GATE preparation",
        "Shared self-cooking kitchen on terrace",
        "Formal rent agreement for all students",
      ],
      contactPerson: "Mukesh Kumar Tiwari",
      contactPhone: "9431201122",
      whatsappNumber: "9431201122",
      callingHours: "8:00 AM - 8:30 PM",
      isVerified: true,
      verificationStatus: "approved",
      verificationBadges: ["GEC Campus Verified", "Budget Friendly", "Rent Agreement Provided", "Zero Brokerage"],
      verifiedDate: new Date("2026-09-08"),
      inspectedBy: "RoomNest Audit",
      ratingAverage: 4.6,
      ratingCount: 18,
      ratingsBreakdown: {
        cleanliness: 4.5,
        safety: 4.7,
        ownerBehaviour: 4.7,
        foodQuality: 4.1,
        internetSpeed: 4.8,
        distanceAccuracy: 4.9,
      },
    },

    // 4. Bettiah Town (Supriya Road / Lal Bazar) - Connected to GEC Kumarbagh
    {
      owner: ownerBettiah._id,
      title: "Bettiah Town Student Residency — Supriya Cinema Road, Bettiah",
      description:
        "Premium student PG in Bettiah town with direct 15-minute connectivity to GEC West Champaran (Kumarbagh) via auto and e-rickshaw. Ideal for students who prefer town amenities, libraries, coaching, and market access while commuting to GEC daily. 3 hot meals included, AC and non-AC rooms, Wi-Fi, and 24x7 inverter backup.",
      campus: "GEC West Champaran (Kumarbagh)",
      distanceToCampusKm: 8.5,
      walkingTimeMinutes: 90,
      cyclingTimeMinutes: 25,
      transitTimeMinutes: 15,
      city: "Bettiah",
      area: "Supriya Road",
      address: "Near Supriya Cinema, Lal Bazar Main Road, Bettiah, West Champaran - 845438",
      landmark: "Near Supriya Cinema & Bettiah Bus Stand",
      nearbyCollege: "GEC West Champaran (Kumarbagh) / MJK College Bettiah",
      nearbyRailwayStation: "Bettiah Railway Station (1.2 km)",
      location: { type: "Point", coordinates: [84.5020, 26.8020] }, // Bettiah Town coordinates
      rent: 4800,
      deposit: 4800,
      maintenanceCharge: 0,
      electricityCharge: "By Sub-meter",
      waterCharge: "Included",
      foodIncluded: true,
      foodType: "Both",
      foodChargeMonthly: 0,
      isZeroBrokerage: true,
      rentAgreementAvailable: true,
      roomType: "PG",
      sharingType: "2-Sharing",
      occupancy: "Boys",
      furnishing: "Furnished",
      totalBeds: 24,
      availableBeds: 5,
      immediateMoveIn: true,
      amenities: {
        wifi: true,
        ac: true,
        attachedBathroom: true,
        kitchen: false,
        parking: true,
        petFriendly: false,
        powerBackup: true,
        laundry: true,
        studyTable: true,
        roWater: true,
        cctv: true,
        housekeeping: true,
        refrigerator: true,
        geyser: true,
      },
      images: REAL_PHOTOS.bettiahPG,
      curfewTime: "10:30 PM",
      noticePeriod: "1 Month",
      rules: [
        "Direct shared auto available outside gate to GEC Kumarbagh (₹15 fare)",
        "3 meals included",
        "Rent agreement provided for scholarship/address proof",
      ],
      contactPerson: "Sanjay Kumar Verma",
      contactPhone: "9835012345",
      whatsappNumber: "9835012345",
      callingHours: "8:30 AM - 9:00 PM",
      isVerified: true,
      verificationStatus: "approved",
      verificationBadges: ["Campus Verified", "Town Center", "Meals Included", "Zero Brokerage"],
      verifiedDate: new Date("2026-09-02"),
      inspectedBy: "RoomNest Bettiah Team",
      ratingAverage: 4.7,
      ratingCount: 22,
      ratingsBreakdown: {
        cleanliness: 4.8,
        safety: 4.8,
        ownerBehaviour: 4.6,
        foodQuality: 4.7,
        internetSpeed: 4.8,
        distanceAccuracy: 4.8,
      },
    },

    // 5. Chanpatia - Startup Zone & Bazar
    {
      owner: ownerBettiah._id,
      title: "Chanpatia Scholar Hub & Rooms — Near Startup Zone & Station",
      description:
        "Clean and quiet student rooms in Chanpatia, just 11 km north of GEC Kumarbagh on NH-727. Quick 18-minute commute to college via train or bus. Excellent study environment, high-speed Wi-Fi, study desk, and affordable living with zero brokerage.",
      campus: "GEC West Champaran (Kumarbagh)",
      distanceToCampusKm: 11.5,
      walkingTimeMinutes: 120,
      cyclingTimeMinutes: 35,
      transitTimeMinutes: 18,
      city: "Bettiah",
      area: "Chanpatia",
      address: "Station Road, Near Chanpatia Bazar, West Champaran - 845449",
      landmark: "Near Chanpatia Startup Zone & Railway Station",
      nearbyCollege: "GEC West Champaran (Kumarbagh)",
      nearbyRailwayStation: "Chanpatia Railway Station (400m)",
      location: { type: "Point", coordinates: [84.5060, 26.9380] }, // Chanpatia coordinates
      rent: 3400,
      deposit: 3400,
      maintenanceCharge: 100,
      electricityCharge: "Included",
      waterCharge: "Included",
      foodIncluded: false,
      foodType: "None",
      foodChargeMonthly: 1800,
      isZeroBrokerage: true,
      rentAgreementAvailable: true,
      roomType: "Single Room",
      sharingType: "Single Room",
      occupancy: "Co-ed",
      furnishing: "Furnished",
      totalBeds: 10,
      availableBeds: 2,
      immediateMoveIn: true,
      amenities: {
        wifi: true,
        ac: false,
        attachedBathroom: true,
        kitchen: true,
        parking: true,
        petFriendly: false,
        powerBackup: true,
        laundry: true,
        studyTable: true,
        roWater: true,
        cctv: true,
        housekeeping: true,
        refrigerator: false,
        geyser: true,
      },
      images: REAL_PHOTOS.chanpatiaPG,
      curfewTime: "No Curfew",
      noticePeriod: "1 Month",
      rules: [
        "18 mins train/auto commute to Kumarbagh GEC",
        "Private study room with independent key",
        "Rent agreement provided",
      ],
      contactPerson: "Sanjay Kumar Verma",
      contactPhone: "9835012345",
      whatsappNumber: "9835012345",
      callingHours: "8:00 AM - 8:30 PM",
      isVerified: true,
      verificationStatus: "approved",
      verificationBadges: ["Campus Verified", "Independent Room", "Rent Agreement Provided", "Zero Brokerage"],
      verifiedDate: new Date("2026-09-06"),
      inspectedBy: "RoomNest Audit",
      ratingAverage: 4.6,
      ratingCount: 14,
      ratingsBreakdown: {
        cleanliness: 4.6,
        safety: 4.7,
        ownerBehaviour: 4.8,
        foodQuality: 4.2,
        internetSpeed: 4.7,
        distanceAccuracy: 4.9,
      },
    },

    // 6. Narkatiaganj - Major Hub near GEC Champaran
    {
      owner: ownerKumarbagh._id,
      title: "Narkatiaganj Junction Student Lodge — Main Road Narkatiaganj",
      description:
        "Comfortable student lodge near Narkatiaganj Railway Station. Direct 25-minute train connectivity to Kumarbagh Station for GEC students. Clean rooms, high-speed Wi-Fi, study table, RO drinking water, and zero brokerage with formal agreement.",
      campus: "GEC West Champaran (Kumarbagh)",
      distanceToCampusKm: 28.0,
      walkingTimeMinutes: 300,
      cyclingTimeMinutes: 90,
      transitTimeMinutes: 25,
      city: "Narkatiaganj",
      area: "Narkatiaganj",
      address: "Station Road, Near Narkatiaganj Junction, West Champaran - 845455",
      landmark: "Opposite Railway Colony, Narkatiaganj",
      nearbyCollege: "GEC West Champaran (Kumarbagh) / Narkatiaganj College",
      nearbyRailwayStation: "Narkatiaganj Junction (300m)",
      location: { type: "Point", coordinates: [84.4700, 27.1000] }, // Narkatiaganj coordinates
      rent: 3000,
      deposit: 3000,
      maintenanceCharge: 0,
      electricityCharge: "Included",
      waterCharge: "Included",
      foodIncluded: false,
      foodType: "None",
      foodChargeMonthly: 1800,
      isZeroBrokerage: true,
      rentAgreementAvailable: true,
      roomType: "Shared Room",
      sharingType: "2-Sharing",
      occupancy: "Boys",
      furnishing: "Semi Furnished",
      totalBeds: 16,
      availableBeds: 4,
      immediateMoveIn: true,
      amenities: {
        wifi: true,
        ac: false,
        attachedBathroom: false,
        kitchen: false,
        parking: true,
        petFriendly: false,
        powerBackup: true,
        laundry: true,
        studyTable: true,
        roWater: true,
        cctv: true,
        housekeeping: true,
        refrigerator: false,
        geyser: true,
      },
      images: REAL_PHOTOS.narkatiaganjPG,
      curfewTime: "10:30 PM",
      noticePeriod: "1 Month",
      rules: [
        "Direct local train to Kumarbagh Station (25 min ride)",
        "Quiet and clean premises",
        "Rent agreement provided",
      ],
      contactPerson: "Mukesh Kumar Tiwari",
      contactPhone: "9431201122",
      whatsappNumber: "9431201122",
      callingHours: "8:00 AM - 8:00 PM",
      isVerified: true,
      verificationStatus: "approved",
      verificationBadges: ["Campus Verified", "Junction Connectivity", "Zero Brokerage", "Rent Agreement Provided"],
      verifiedDate: new Date("2026-09-07"),
      inspectedBy: "RoomNest Audit",
      ratingAverage: 4.5,
      ratingCount: 12,
      ratingsBreakdown: {
        cleanliness: 4.5,
        safety: 4.6,
        ownerBehaviour: 4.7,
        foodQuality: 4.0,
        internetSpeed: 4.6,
        distanceAccuracy: 4.8,
      },
    },

    // 7. Delhi University North Campus
    {
      owner: ownerKumarbagh._id,
      title: "Royal North Heritage Boys PG — Kamla Nagar DU",
      description:
        "Premium student PG 400m from Hindu and Hansraj College gates in DU North Campus. 3 meals included, high-speed Wi-Fi, study table, and power backup.",
      campus: "Delhi University North Campus",
      distanceToCampusKm: 0.4,
      walkingTimeMinutes: 5,
      cyclingTimeMinutes: 2,
      transitTimeMinutes: 4,
      city: "Delhi",
      area: "Kamla Nagar",
      address: "14/2, Bungalow Road, Kamla Nagar, Delhi",
      landmark: "Near Hansraj College",
      nearbyCollege: "Delhi University North Campus",
      location: { type: "Point", coordinates: [77.2085, 28.6859] },
      rent: 8500,
      deposit: 8500,
      maintenanceCharge: 0,
      electricityCharge: "By Sub-meter",
      waterCharge: "Included",
      foodIncluded: true,
      foodType: "Veg",
      foodChargeMonthly: 0,
      isZeroBrokerage: true,
      rentAgreementAvailable: true,
      roomType: "PG",
      sharingType: "2-Sharing",
      occupancy: "Boys",
      furnishing: "Furnished",
      totalBeds: 24,
      availableBeds: 2,
      immediateMoveIn: true,
      amenities: {
        wifi: true,
        ac: true,
        attachedBathroom: true,
        kitchen: false,
        parking: true,
        petFriendly: false,
        powerBackup: true,
        laundry: true,
        studyTable: true,
        roWater: true,
        cctv: true,
        housekeeping: true,
        refrigerator: true,
        geyser: true,
      },
      images: REAL_PHOTOS.duBoys,
      curfewTime: "10:30 PM",
      noticePeriod: "1 Month",
      rules: ["Quiet hours 11 PM to 7 AM", "Rent agreement provided"],
      contactPerson: "Rameshwar Goel",
      contactPhone: "9810234567",
      whatsappNumber: "9810234567",
      callingHours: "8:00 AM - 9:00 PM",
      isVerified: true,
      verificationStatus: "approved",
      verificationBadges: ["Campus Verified", "3 Meals", "Zero Brokerage"],
      verifiedDate: new Date("2026-08-15"),
      ratingAverage: 4.7,
      ratingCount: 28,
      ratingsBreakdown: { cleanliness: 4.8, safety: 4.9, ownerBehaviour: 4.6, foodQuality: 4.5, internetSpeed: 4.9, distanceAccuracy: 5.0 },
    },

    // 8. Central University of Himachal Pradesh (CUHP)
    {
      owner: ownerGirlsPG._id,
      title: "Dhauladhar Student PG & Mess — 500m to CUHP Dharamshala Campus",
      description:
        "Quiet, hygienic student PG situated 500m from the Central University of Himachal Pradesh (CUHP) Dharamshala Academic Block. Features scenic mountain views, 3 home-cooked meals, geyser for cold winters, 100 Mbps Wi-Fi, and formal rent agreements.",
      campus: "Central University of Himachal Pradesh (CUHP)",
      distanceToCampusKm: 0.5,
      walkingTimeMinutes: 6,
      cyclingTimeMinutes: 2,
      transitTimeMinutes: 4,
      city: "Dharamshala",
      area: "Chilghari",
      address: "Chilghari Road, Near CUHP Temporary Academic Block, Dharamshala, HP",
      landmark: "500m from CUHP Dharamshala Campus",
      nearbyCollege: "Central University of Himachal Pradesh (CUHP)",
      location: { type: "Point", coordinates: [76.1585, 32.2235] },
      rent: 5500,
      deposit: 5500,
      maintenanceCharge: 0,
      electricityCharge: "Included",
      waterCharge: "Included",
      foodIncluded: true,
      foodType: "Veg",
      foodChargeMonthly: 0,
      isZeroBrokerage: true,
      rentAgreementAvailable: true,
      roomType: "PG",
      sharingType: "2-Sharing",
      occupancy: "Co-ed",
      furnishing: "Furnished",
      totalBeds: 18,
      availableBeds: 3,
      immediateMoveIn: true,
      amenities: {
        wifi: true,
        ac: false,
        attachedBathroom: true,
        kitchen: false,
        parking: true,
        petFriendly: false,
        powerBackup: true,
        laundry: true,
        studyTable: true,
        roWater: true,
        cctv: true,
        housekeeping: true,
        refrigerator: true,
        geyser: true,
      },
      images: REAL_PHOTOS.cuhpPG,
      curfewTime: "10:00 PM",
      noticePeriod: "1 Month",
      rules: ["Quiet study environment", "3 meals included", "Formal rent agreement provided"],
      contactPerson: "Shanti Devi",
      contactPhone: "9122334455",
      whatsappNumber: "9122334455",
      callingHours: "8:00 AM - 8:30 PM",
      isVerified: true,
      verificationStatus: "approved",
      verificationBadges: ["Campus Verified", "Rent Agreement Provided", "Zero Brokerage"],
      verifiedDate: new Date("2026-09-04"),
      ratingAverage: 4.9,
      ratingCount: 20,
      ratingsBreakdown: { cleanliness: 4.9, safety: 5.0, ownerBehaviour: 4.9, foodQuality: 4.8, internetSpeed: 4.8, distanceAccuracy: 5.0 },
    },
  ]);

  console.log("[seed] creating authentic student peer reviews for GEC West Champaran...");
  await Review.insertMany([
    {
      room: rooms[0]._id,
      user: studentGEC._id,
      ratings: { cleanliness: 5, safety: 5, ownerBehaviour: 5, internet: 5, waterSupply: 5, electricity: 5 },
      overallRating: 5.0,
      comment:
        "I am a 2nd-year CSE student at GEC West Champaran. This PG is literally 4 minutes walk from the GEC gate. The food is fresh home-cooked Bihari khana (roti, dal, bhat, bhujia). Mukesh bhaiya is very helpful and the Wi-Fi speed is great for coding and lectures.",
    },
    {
      room: rooms[1]._id,
      user: studentGirls._id,
      ratings: { cleanliness: 5, safety: 5, ownerBehaviour: 5, internet: 5, waterSupply: 5, electricity: 5 },
      overallRating: 4.9,
      comment:
        "Extremely safe for girls studying at GEC Kumarbagh. Shanti aunty (warden) takes care of everything like family. The room is neat, geyser works 24/7 in winter, and college gate is just a 7-minute walk. Highly recommended!",
    },
    {
      room: rooms[3]._id,
      user: studentGEC._id,
      ratings: { cleanliness: 5, safety: 5, ownerBehaviour: 4, internet: 5, waterSupply: 4, electricity: 5 },
      overallRating: 4.7,
      comment:
        "Staying in Bettiah town near Supriya cinema is very convenient. E-rickshaws directly take ₹15 to GEC Kumarbagh campus in 15 minutes. Great market and library nearby.",
    },
  ]);

  console.log("[seed] creating roommate posts for GEC West Champaran & Bettiah...");
  await RoommatePost.insertMany([
    {
      user: studentGEC._id,
      city: "Bettiah",
      area: "Kumarbagh",
      budgetMin: 2500,
      budgetMax: 4500,
      genderPreference: "Male",
      occupation: "Student",
      lookingFor: "Roommate for 2-sharing room 300m from GEC West Champaran Kumarbagh",
      aboutMe: "2nd year CSE student at GEC West Champaran. Serious about academics and coding, non-smoker, clean habits.",
      habits: { smoking: false, pets: false, foodPreference: "Either" },
    },
    {
      user: studentGirls._id,
      city: "Bettiah",
      area: "Kumarbagh",
      budgetMin: 3000,
      budgetMax: 5000,
      genderPreference: "Female",
      occupation: "Student",
      lookingFor: "Flatmate for student room near GEC Kumarbagh Chowk",
      aboutMe: "1st year Civil student at GEC. Friendly, tidy, quiet study habits.",
      habits: { smoking: false, pets: false, foodPreference: "Veg" },
    },
  ]);

  console.log("[seed] database seeded successfully with GEC West Champaran, Kumarbagh, Bettiah, Chanpatia, and Narkatiaganj data!");
  console.log("----------------------------------------------------");
  console.log("Login credentials (password for all: password123)");
  console.log(`Admin:   ${admin.email}`);
  console.log(`Owner 1: ${ownerKumarbagh.email}`);
  console.log(`Owner 2: ${ownerBettiah.email}`);
  console.log(`Owner 3: ${ownerGirlsPG.email}`);
  console.log(`Student 1: ${studentGEC.email}`);
  console.log(`Student 2: ${studentGirls.email}`);
  console.log("----------------------------------------------------");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
