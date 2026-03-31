"use server";

import { db } from "@/lib/prisma";

/**
 * Get mechanics by service category (e.g. "engine", "brakes")
 */
export async function getMechanicsByService(serviceCategory) {
  try {
    const mechanics = await db.user.findMany({
      where: {
        role: "MECHANIC",
        profileComplete: true,
        // All trained mechanics available
      },
      orderBy: [
        { experience: "desc" },
        { credits: "desc" },
        { name: "asc" },
      ],
      take: 20,
    });

    return { mechanics };
  } catch (error) {
    console.error("Failed to fetch mechanics:", error);
    return { mechanics: [] };
  }
}

/**
 * Get services by category (oil, brakes, AC, etc.)
 */
export async function getServicesByCategory(category) {
  try {
    const services = await db.service.findMany({
      where: {
        category: {
          contains: category || "",
          mode: "insensitive",
        },
      },
      orderBy: { basePrice: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        duration: true,
        category: true,
      },
    });

    return { services };
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return { services: [] };
  }
}

/**
 * Get popular services (most booked)
 */
export async function getPopularServices() {
  try {
    const popular = await db.booking.groupBy({
      by: ["serviceId"],
      where: {
        status: "COMPLETED",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    });

    const serviceIds = popular.map(p => p.serviceId);
    const services = await db.service.findMany({
      where: { id: { in: serviceIds } },
      include: {
        _count: {
          select: { bookings: { where: { status: "COMPLETED" } } },
        },
      },
    });

    return { services };
  } catch (error) {
    console.error("Failed to fetch popular services:", error);
    return { services: [] };
  }
}

/**
 * Search services by name
 */
export async function searchServices(query) {
  try {
    if (!query || query.length < 2) {
      return { services: [] };
    }

    const services = await db.service.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { basePrice: "asc" },
    });

    return { services };
  } catch (error) {
    console.error("Search failed:", error);
    return { services: [] };
  }
}

/**
 * Get available mechanics count by service
 */
export async function getServiceAvailability(serviceId) {
  try {
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { availableMechanics: 0, nextSlot: null };
    }

    // Count mechanics with recent bookings for this service
    const recentMechanics = await db.booking.groupBy({
      by: ["mechanicId"],
      where: {
        serviceId,
        status: "COMPLETED",
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
      },
    });

    return {
      availableMechanics: recentMechanics.length,
      service,
      avgDuration: service.duration,
    };
  } catch (error) {
    console.error("Availability failed:", error);
    return { availableMechanics: 0 };
  }
}