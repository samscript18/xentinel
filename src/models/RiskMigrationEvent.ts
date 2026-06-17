import { Schema, model, models, type InferSchemaType } from "mongoose";

const riskMigrationEventSchema = new Schema(
  {
    protocol: { type: String, required: true, index: true },
    oldRating: { type: String, required: true },
    newRating: { type: String, required: true },
    confidence: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    signal: { type: String, default: "" },
    severity: { type: String, default: "medium" }
  },
  {
    timestamps: true
  }
);

export type RiskMigrationEventDocument = InferSchemaType<typeof riskMigrationEventSchema>;

export const RiskMigrationEventModel =
  models.RiskMigrationEvent || model("RiskMigrationEvent", riskMigrationEventSchema);
