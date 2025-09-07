// API endpoint for receiving chip telemetry

import { prisma } from "../db";

export async function ingestTelemetry(payload: any) {
  // TODO: validate signature
  // TODO: parse and normalize to canonical model

  return prisma.vehicleInspection.create({
    data: {
      type: payload.type,
      driverId: payload.driverId,
      vehicleId: payload.vehicleId,
      odometerStart: payload.odometerStart,
      odometerEnd: payload.odometerEnd,
      fuelLevel: payload.fuelLevel,
      responses: payload.responses
    }
  });
}
