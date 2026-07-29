const Room = require("../models/Room");

// GET /api/rooms
// Supports: city, area, q (text search across title/area/city/college), minRent, maxRent,
// roomType, occupancy, furnishing, amenities (comma list e.g. wifi,ac,parking),
// lat/lng/radiusKm for nearby search, sort, page, limit
async function getRooms(req, res, next) {
  try {
    const {
      city,
      area,
      q,
      minRent,
      maxRent,
      roomType,
      occupancy,
      furnishing,
      amenities,
      verifiedOnly,
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
    if (occupancy) filter.occupancy = occupancy;
    if (furnishing) filter.furnishing = furnishing;
    if (verifiedOnly === "true") filter.isVerified = true;

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

    if (q) {
      filter.$text = { $search: q };
    }

    let query = Room.find(filter).populate("owner", "name avatarUrl ownerVerification");

    if (lat && lng) {
      const radius = (Number(radiusKm) || 5) / 6378.1; // radians
      filter.location = {
        $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], radius] },
      };
      query = Room.find(filter).populate("owner", "name avatarUrl ownerVerification");
    }

    const sortMap = {
      priceLowToHigh: { rent: 1 },
      priceHighToLow: { rent: -1 },
      newest: { createdAt: -1 },
      rating: { ratingAverage: -1 },
    };
    query = query.sort(sortMap[sort] || { createdAt: -1 });

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Number(limit) || 12, 50);
    const skip = (pageNum - 1) * limitNum;

    const [rooms, total] = await Promise.all([
      query.skip(skip).limit(limitNum),
      Room.countDocuments(filter),
    ]);

    res.json({
      rooms,
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

// POST /api/rooms  (owner only)
async function createRoom(req, res, next) {
  try {
    const room = await Room.create({ ...req.body, owner: req.user._id });
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
  getNearbyPlaces,
  getRentInsight,
};
