require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Room = require("../models/Room");
const Review = require("../models/Review");
const RoommatePost = require("../models/RoommatePost");

const IMG = (seed) => `https://picsum.photos/seed/${seed}/800/600`;

async function run() {
  await connectDB();

  console.log("[seed] clearing existing data...");
  await Promise.all([User.deleteMany({}), Room.deleteMany({}), Review.deleteMany({}), RoommatePost.deleteMany({})]);

  const password = await bcrypt.hash("password123", 10);

  console.log("[seed] creating users...");
  const admin = await User.create({
    name: "Platform Admin",
    email: "admin@roomnest.in",
    phone: "9000000000",
    password,
    role: "admin",
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  const owner1 = await User.create({
    name: "Rakesh Sharma",
    email: "rakesh.owner@roomnest.in",
    phone: "9000000001",
    password,
    role: "owner",
    isPhoneVerified: true,
    isEmailVerified: true,
    ownerVerification: { aadhaarOrPan: "ABCDE1234F", status: "verified" },
  });

  const owner2 = await User.create({
    name: "Priya Nair",
    email: "priya.owner@roomnest.in",
    phone: "9000000002",
    password,
    role: "owner",
    isPhoneVerified: true,
    isEmailVerified: true,
    ownerVerification: { aadhaarOrPan: "PQRSX5678K", status: "verified" },
  });

  const student1 = await User.create({
    name: "Aman Kumar",
    email: "aman.student@roomnest.in",
    phone: "9000000003",
    password,
    role: "user",
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  console.log("[seed] creating rooms...");
  const rooms = await Room.insertMany([
    {
      owner: owner1._id,
      title: "Sunrise Boys PG near Delhi University North Campus",
      description:
        "A well-maintained boys PG just 5 minutes' walk from DU North Campus. Home-cooked meals, high-speed WiFi, and 24x7 security.",
      city: "Delhi",
      area: "Kamla Nagar",
      address: "12, Kamla Nagar Main Road, Delhi",
      landmark: "Near Hindu College",
      nearbyCollege: "Delhi University North Campus",
      nearbyMetroStation: "Vishwavidyalaya Metro Station",
      location: { type: "Point", coordinates: [77.2090, 28.6864] },
      rent: 8500,
      deposit: 8500,
      maintenanceCharge: 500,
      roomType: "PG",
      occupancy: "Boys",
      furnishing: "Furnished",
      amenities: { ac: false, attachedBathroom: true, kitchen: true, parking: false, wifi: true, petFriendly: false, powerBackup: true, laundry: true },
      images: [IMG("dupg1"), IMG("dupg2"), IMG("dupg3")],
      rules: ["No smoking", "No loud music after 10 PM", "Visitors allowed till 8 PM"],
      isVerified: true,
      verificationStatus: "approved",
      ratingAverage: 4.3,
      ratingCount: 12,
    },
    {
      owner: owner1._id,
      title: "Budget Single Room for Working Professionals - Gurgaon",
      description:
        "Compact single occupancy room ideal for working professionals near Cyber Hub. Fully furnished with AC.",
      city: "Gurgaon",
      area: "DLF Phase 3",
      address: "Tower B, DLF Phase 3, Gurgaon",
      landmark: "Near Cyber Hub",
      nearbyCompanyHub: "Cyber Hub",
      nearbyMetroStation: "Cyber City Metro Station",
      location: { type: "Point", coordinates: [77.0891, 28.4949] },
      rent: 14000,
      deposit: 28000,
      maintenanceCharge: 1000,
      roomType: "Single Room",
      occupancy: "Co-ed",
      furnishing: "Furnished",
      amenities: { ac: true, attachedBathroom: true, kitchen: true, parking: true, wifi: true, petFriendly: false, powerBackup: true, laundry: false },
      images: [IMG("ggn1"), IMG("ggn2"), IMG("ggn3")],
      rules: ["No pets", "ID proof mandatory at check-in"],
      isVerified: true,
      verificationStatus: "approved",
      ratingAverage: 4.6,
      ratingCount: 8,
    },
    {
      owner: owner2._id,
      title: "Girls PG with WiFi - Koramangala, Bangalore",
      description:
        "Safe and secure girls PG in the heart of Koramangala. Walking distance to tech parks and cafes. Nutritious meals included.",
      city: "Bangalore",
      area: "Koramangala",
      address: "5th Block, Koramangala, Bangalore",
      landmark: "Near Forum Mall",
      nearbyCompanyHub: "Koramangala Tech Park",
      location: { type: "Point", coordinates: [77.6245, 12.9352] },
      rent: 11000,
      deposit: 11000,
      maintenanceCharge: 500,
      roomType: "PG",
      occupancy: "Girls",
      furnishing: "Furnished",
      amenities: { ac: true, attachedBathroom: true, kitchen: false, parking: false, wifi: true, petFriendly: false, powerBackup: true, laundry: true },
      images: [IMG("blrg1"), IMG("blrg2"), IMG("blrg3")],
      rules: ["Curfew at 10:30 PM", "No male visitors inside rooms"],
      isVerified: true,
      verificationStatus: "approved",
      ratingAverage: 4.8,
      ratingCount: 21,
    },
    {
      owner: owner2._id,
      title: "Shared Room for Students - Near VIT Vellore",
      description:
        "Affordable shared room for VIT students. Two beds, study tables, and reliable WiFi for online classes.",
      city: "Vellore",
      area: "Katpadi",
      address: "Near VIT Main Gate, Katpadi, Vellore",
      landmark: "VIT University",
      nearbyCollege: "VIT Vellore",
      nearbyRailwayStation: "Katpadi Railway Station",
      location: { type: "Point", coordinates: [79.1590, 12.9698] },
      rent: 6000,
      deposit: 6000,
      maintenanceCharge: 300,
      roomType: "Shared Room",
      occupancy: "Boys",
      furnishing: "Semi Furnished",
      amenities: { ac: false, attachedBathroom: false, kitchen: true, parking: true, wifi: true, petFriendly: false, powerBackup: false, laundry: false },
      images: [IMG("vit1"), IMG("vit2"), IMG("vit3")],
      rules: ["Quiet hours 11 PM - 7 AM"],
      isVerified: true,
      verificationStatus: "approved",
      ratingAverage: 4.1,
      ratingCount: 15,
    },
    {
      owner: owner1._id,
      title: "Family 2BHK Flat - Andheri West, Mumbai",
      description:
        "Spacious 2BHK flat suitable for small families, fully furnished with modern kitchen and parking.",
      city: "Mumbai",
      area: "Andheri West",
      address: "Link Road, Andheri West, Mumbai",
      landmark: "Near Infinity Mall",
      nearbyMetroStation: "Andheri Metro Station",
      location: { type: "Point", coordinates: [72.8296, 19.1364] },
      rent: 35000,
      deposit: 100000,
      maintenanceCharge: 2500,
      roomType: "Flat",
      occupancy: "Family",
      furnishing: "Furnished",
      amenities: { ac: true, attachedBathroom: true, kitchen: true, parking: true, wifi: true, petFriendly: true, powerBackup: true, laundry: true },
      images: [IMG("mum1"), IMG("mum2"), IMG("mum3")],
      rules: ["Family tenants only", "No sub-letting"],
      isVerified: true,
      verificationStatus: "approved",
      ratingAverage: 4.7,
      ratingCount: 6,
    },
    {
      owner: owner2._id,
      title: "Hostel Bed for Interns - HITEC City, Hyderabad",
      description:
        "Budget hostel bed for interns near HITEC City. Dormitory style with lockers, WiFi and common kitchen.",
      city: "Hyderabad",
      area: "HITEC City",
      address: "Cyber Towers Road, HITEC City, Hyderabad",
      landmark: "Near Cyber Towers",
      nearbyCompanyHub: "HITEC City IT Park",
      nearbyMetroStation: "Hitech City Metro Station",
      location: { type: "Point", coordinates: [78.3809, 17.4483] },
      rent: 5500,
      deposit: 5000,
      maintenanceCharge: 300,
      roomType: "Hostel",
      occupancy: "Co-ed",
      furnishing: "Semi Furnished",
      amenities: { ac: false, attachedBathroom: false, kitchen: true, parking: false, wifi: true, petFriendly: false, powerBackup: true, laundry: true },
      images: [IMG("hyd1"), IMG("hyd2"), IMG("hyd3")],
      rules: ["6-month minimum stay preferred"],
      isVerified: false,
      verificationStatus: "pending",
      ratingAverage: 0,
      ratingCount: 0,
    },
  ]);

  console.log("[seed] creating a sample review...");
  await Review.create({
    room: rooms[0]._id,
    user: student1._id,
    ratings: { cleanliness: 4, safety: 5, ownerBehaviour: 5, internet: 4, waterSupply: 4, electricity: 4 },
    overallRating: 4.3,
    comment: "Great location and the owner is very responsive. Highly recommend for DU students.",
  });

  console.log("[seed] creating roommate posts...");
  await RoommatePost.insertMany([
    {
      user: student1._id,
      city: "Delhi",
      area: "Kamla Nagar",
      budgetMin: 6000,
      budgetMax: 9000,
      genderPreference: "Any",
      occupation: "Student",
      lookingFor: "1 flatmate for a 2-share room near DU North Campus",
      aboutMe: "Second-year DU student, quiet and tidy, looking to split rent from next month.",
      habits: { smoking: false, pets: false, foodPreference: "Veg" },
    },
    {
      user: owner1._id,
      city: "Gurgaon",
      area: "DLF Phase 3",
      budgetMin: 12000,
      budgetMax: 16000,
      genderPreference: "Male",
      occupation: "Working Professional",
      lookingFor: "Flatmate for a 2BHK near Cyber Hub, non-smoker preferred",
      aboutMe: "Work in tech, mostly WFH 2 days a week, easy-going.",
      habits: { smoking: false, pets: false, foodPreference: "Either" },
    },
  ]);

  console.log("[seed] done.");
  console.log("----------------------------------------------------");
  console.log("Login credentials (password for all: password123)");
  console.log(`Admin:   ${admin.email}`);
  console.log(`Owner 1: ${owner1.email}`);
  console.log(`Owner 2: ${owner2.email}`);
  console.log(`Student: ${student1.email}`);
  console.log("----------------------------------------------------");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
