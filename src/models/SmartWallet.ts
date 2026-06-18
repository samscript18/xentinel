import { Schema, model, models, type InferSchemaType } from "mongoose";

const smartWalletSchema = new Schema(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    performanceScore: { type: Number, default: 0 },
    currentRiskScore: { type: Number, default: 0 },
    previousRiskScore: { type: Number, default: 0 },
    currentRiskRating: { type: String, default: "NR" },
    allocationShift: { type: String, default: "No prior movement snapshot available" },
    recentMove: { type: String, default: "Awaiting next live snapshot" },
    riskChangePercent: { type: Number, default: 0 },
    exposureChangePercent: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    currentExposureUsd: { type: Number, default: 0 },
    previousExposureUsd: { type: Number, default: 0 },
    holdings: {
      type: [
        {
          label: String,
          valueUsd: Number,
          category: String
        }
      ],
      default: []
    },
    lastMovementAt: { type: Date, default: Date.now },
    lastSyncedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export type SmartWalletDocument = InferSchemaType<typeof smartWalletSchema>;

export const SmartWalletModel = models.SmartWallet || model("SmartWallet", smartWalletSchema);
