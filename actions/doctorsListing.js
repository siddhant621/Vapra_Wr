"use server";

import { db } from "@/lib/prisma";

/**
 * Get all trained mechanics (no verification needed)
 */
export async function getMechanicsBySpecialty(specialty) {
  try {
    const mechanics = await db.user.findMany({
      where: {
        role: "MECHANIC",
        // No verificationStatus filter - all trained mechanics
      },
      select: {
        id: true,
        name: true,
        email: true,
        experience: true,
        credits: true,
        createdAt: true,
      },
      orderBy: [
        { experience: "desc" },
        { credits: "desc" },
        { name: "asc" },
      ],
    });

    return { mechanics };
  } catch (error) {
    console.error("Failed to fetch mechanics:", error);
    return { mechanics: [], error: "Failed to fetch mechanics" };
  }
}

/**
 * Get all mechanics with basic filters
 */
export async function getAllMechanics(filters = {}) {
  try {
    const { 
      experienceMin, 
      location,
      limit = 20 
    } = filters;

    const where = {
      role: "MECHANIC",
      // No verificationStatus - all offline trained mechanics
    };

    if (experienceMin) {
      where.experience = { gte: parseInt(experienceMin) };
    }

    const mechanics = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        experience: true,
        credits: true,
        createdAt: true,
      },
      orderBy: [
        { experience: "desc" },
        { credits: "desc" },
        { name: "asc" },
      ],
      take: parseInt(limit),
    });

    return { mechanics };
  } catch (error) {
    console.error("Failed to fetch all mechanics:", error);
    return { mechanics: [], error: "Failed to fetch mechanics" };
  }
}

/**
 * Get top mechanics by performance
 */
export async function getPopularMechanics() {
  try {
    const mechanics = await db.user.findMany({
      where: {
        role: "MECHANIC",
        experience: { gte: 1 }, // Minimum 1 year training
      },
      select: {
        id: true,
        name: true,
        experience: true,
        credits: true,
      },
      orderBy: { credits: "desc" },
      take: 8,
    });

    return { mechanics };
  } catch (error) {
    console.error("Failed to fetch popular mechanics:", error);
    return { mechanics: [] };
  }
}

/**
 * Search mechanics by name
 */
export async function searchMechanics(query) {
  try {
    if (!query || query.length < 2) {
      return { mechanics: [] };
    }

    const mechanics = await db.user.findMany({
      where: {
        role: "MECHANIC",
        name: {
          contains: query.toLowerCase(),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        experience: true,
      },
      take: 10,
    });

    return { mechanics };
  } catch (error) {
    console.error("Search failed:", error);
    return { mechanics: [] };
  }
}

/**
 * Get mechanic profile with stats
 */
export async function getMechanicProfile(mechanicId) {
  try {
    const mechanic = await db.user.findUnique({
      where: { 
        id: mechanicId,
        role: "MECHANIC",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        experience: true,
        credits: true,
        createdAt: true,
      },
    });

    if (!mechanic) {
      return { mechanic: null };
    }

    const recentBookings = await db.booking.findMany({
      where: { mechanicId: mechanic.id, status: "COMPLETED" },
      include: { 
        customer: { select: { name: true } },
        service: { select: { name: true, basePrice: true } }
      },
      orderBy: { scheduledAt: "desc" },
      take: 5,
    });

    return { 
      mechanic,
      stats: {
        totalBookings: recentBookings.length,
        avgServicePrice: Math.round(
          recentBookings.reduce((sum, b) => sum + b.service.basePrice, 0) / 
          (recentBookings.length || 1)
        ),
      },
      recentBookings,
    };
  } catch (error) {
    console.error("Profile fetch failed:", error);
    return { mechanic: null };
  }
}