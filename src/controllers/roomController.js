const Room = require("../models/Room");

// GET /api/rooms
// Supports: city, area, campus, maxDistance, q, minRent, maxRent,
// roomType, sharingType, occupancy, furnishing, amenities, foodIncluded,
// lat/lng/radiusKm for nearby search, sort, page, limit
async function getRooms(req, res, next) {
  try {
    const {
      city,
      area,
      campus,
      maxDistance,
      q,
      minRent,
      maxRent,
      roomType,
      sharingType,
      occupancy,
      furnishing,
      amenities,
      foodIncluded,
      verifiedOnly,
      curfew,
      immediateOnly,
      lat,
      lng,
      radiusKm,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { isActive: true, verificationStatus: "approved" };

    if (city) filter.city = new RegExp(`^${city}$`, "i");
    if (area) filter.area = new RegExp(area, "i");
    if (roomType) filter.roomType = roomType;
    if (sharingType) filter.sharingType = sharingType;
    if (occupancy) filter.occupancy = occupancy;
    if (furnishing) filter.furnishing = furnishing;
    if (verifiedOnly === "true") filter.isVerified = true;
    if (foodIncluded === "true") filter.foodIncluded = true;
    if (immediateOnly === "true") filter.immediateMoveIn = true;
    if (curfew === "noCurfew") filter.curfewTime = /no curfew/i;
    if (req.query.rentAgreement === "true") filter.rentAgreementAvailable = true;

    // Universal Area, City, Campus, or Text Search
    const searchLocation = campus || area || q || req.query.location;
    if (searchLocation) {
      const safeText = String(searchLocation).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const textRegex = new RegExp(safeText, "i");
      const words = String(searchLocation)
        .replace(/[^\w\s]/g, "")
        .trim()
        .split(/\s+/)
        .filter((w) => w.length >= 3);

      const orConditions = [
        { area: textRegex },
        { city: textRegex },
        { campus: textRegex },
        { nearbyCollege: textRegex },
        { title: textRegex },
        { landmark: textRegex },
        { address: textRegex },
      ];

      words.forEach((w) => {
        const wRegex = new RegExp(w, "i");
        orConditions.push(
          { area: wRegex },
          { city: wRegex },
          { campus: wRegex },
          { nearbyCollege: wRegex },
          { title: wRegex },
          { landmark: wRegex }
        );
      });
      filter.$or = orConditions;
    }

    if (maxDistance) {
      filter.distanceToCampusKm = { $lte: Number(maxDistance) };
    }

    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = Number(minRent);
      if (maxRent) filter.rent.$lte = Number(maxRent);
    }

    if (amenities) {
      const list = amenities.split(",").map((a) => a.trim()).filter(Boolean);
      list.forEach((a) => {
        filter[`amenities.${a}`] = true;
      });
    }

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

    let query = Room.find(filter).populate("owner", "name avatarUrl phone ownerVerification");

    if (lat && lng) {
      const radius = (Number(radiusKm) || 10) / 6378.1; // Default to 10 km radius per user requirement
      filter.location = {
        $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], radius] },
      };
      query = Room.find(filter).populate("owner", "name avatarUrl phone ownerVerification");
    }

    const sortMap = {
      priceLowToHigh: { rent: 1 },
      priceHighToLow: { rent: -1 },
      distanceLowToHigh: { distanceToCampusKm: 1 },
      newest: { createdAt: -1 },
      rating: { ratingAverage: -1 },
    };
    query = query.sort(sortMap[sort] || { distanceToCampusKm: 1, createdAt: -1 });

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Number(limit) || 12, 50);
    const skip = (pageNum - 1) * limitNum;

    const [rawRooms, total] = await Promise.all([
      query.skip(skip).limit(limitNum),
      Room.countDocuments(filter),
    ]);

    // Attach exact live GPS distance from user
    const rooms = rawRooms.map((r) => {
      const obj = r.toObject();
      if (lat && lng && obj.location?.coordinates?.length === 2) {
        const [rLng, rLat] = obj.location.coordinates;
        if (rLat !== 0 || rLng !== 0) {
          obj.distanceFromUserKm = calculateDistanceKm(Number(lat), Number(lng), rLat, rLng);
        }
      }
      return obj;
    });

    if (lat && lng && (sort === "nearest" || !sort)) {
      rooms.sort((a, b) => (a.distanceFromUserKm || 999) - (b.distanceFromUserKm || 999));
    }

    res.json({
      rooms,
      userLocation: lat && lng ? { lat: Number(lat), lng: Number(lng), radiusKm: Number(radiusKm) || 10 } : null,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/:id
async function getRoomById(req, res, next) {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate("owner", "name avatarUrl phone ownerVerification createdAt");

    if (!room) return res.status(404).json({ message: "Room not found." });
    res.json({ room });
  } catch (err) {
    next(err);
  }
}

// POST /api/rooms  (owner only - requires admin audit to go live)
async function createRoom(req, res, next) {
  try {
    const payload = { ...req.body };
    delete payload.isVerified;
    delete payload.verificationStatus;
    delete payload.verificationBadges;

    const room = await Room.create({
      ...payload,
      owner: req.user._id,
      verificationStatus: "pending", // Always pending until Admin approves in /admin/dashboard
      isVerified: false,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("admin:new_room_submitted", {
        roomId: room._id,
        title: room.title,
        owner: req.user.name,
      });
    }

    res.status(201).json({ room });
  } catch (err) {
    next(err);
  }
}

// PUT /api/rooms/:id (owner of listing, or admin)
async function updateRoom(req, res, next) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found." });

    const isOwnerOfRoom = room.owner.toString() === req.user._id.toString();
    if (!isOwnerOfRoom && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only edit your own listings." });
    }

    Object.assign(room, req.body);
    // Any substantive edit should re-enter the approval queue
    if (req.user.role !== "admin") {
      room.verificationStatus = "pending";
      room.isVerified = false;
    }
    await room.save();
    res.json({ room });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/rooms/:id/availability (beds or active toggle)
async function updateRoomAvailability(req, res, next) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found." });

    const isOwnerOfRoom = room.owner.toString() === req.user._id.toString();
    if (!isOwnerOfRoom && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only edit your own listings." });
    }

    if (req.body.availableBeds !== undefined) {
      room.availableBeds = Math.max(0, Number(req.body.availableBeds));
    }
    if (req.body.isActive !== undefined) {
      room.isActive = Boolean(req.body.isActive);
    }
    await room.save();
    res.json({ room });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/rooms/:id
async function deleteRoom(req, res, next) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found." });

    const isOwnerOfRoom = room.owner.toString() === req.user._id.toString();
    if (!isOwnerOfRoom && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete your own listings." });
    }

    await room.deleteOne();
    res.json({ message: "Listing deleted." });
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/owner/mine
async function getMyRooms(req, res, next) {
  try {
    const rooms = await Room.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ rooms });
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/:id/nearby-places (stub - wire to Google Places / OSM Overpass API)
async function getNearbyPlaces(req, res, next) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found." });

    // Placeholder structure; replace with a live Places API call using room.location
    res.json({
      message: "Connect a Places API (Google Places or OSM Overpass) using the room's coordinates.",
      coordinates: room.location.coordinates,
      categories: [
        "Railway Station", "Metro Station", "Bus Stand", "Colleges", "Hospitals",
        "Medical Stores", "Grocery Shops", "ATMs", "Banks", "Gym", "Restaurants", "Police Station",
      ],
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/:id/rent-insight
// Compares this room's rent against verified listings of the same type in the
// same city, computed live from real data (not a fabricated score).
async function getRentInsight(req, res, next) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found." });

    const peers = await Room.find({
      city: room.city,
      roomType: room.roomType,
      isActive: true,
      verificationStatus: "approved",
      _id: { $ne: room._id },
    }).select("rent");

    if (peers.length === 0) {
      return res.json({
        hasData: false,
        message: "Not enough verified listings of this type in this city yet to compare.",
      });
    }

    const rents = peers.map((p) => p.rent).sort((a, b) => a - b);
    const avg = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
    const min = rents[0];
    const max = rents[rents.length - 1];
    const percentDiff = Math.round(((room.rent - avg) / avg) * 100);

    res.json({
      hasData: true,
      sampleSize: rents.length,
      areaAverage: avg,
      areaMin: min,
      areaMax: max,
      thisRoomRent: room.rent,
      percentDiff,
      verdict: percentDiff <= -5 ? "below_average" : percentDiff >= 5 ? "above_average" : "typical",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getMyRooms,
  updateRoomAvailability,
  getNearbyPlaces,
  getRentInsight,
};
