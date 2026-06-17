import { Schema, model, models, type InferSchemaType } from "mongoose";

const positionSchema = new Schema(
  {
    protocol: { type: String, required: true },
    asset: { type: String, required: true },
    chain: { type: String, required: true },
    valueUsd: { type: Number, required: true },
    allocationPercent: { type: Number, required: true },
    rating: { type: String, required: true },
    intrinsicRisk: { type: Number, required: true },
    systemicRisk: { type: Number, required: true }
  },
  { _id: false }
);

const walletAnalysisSchema = new Schema(
  {
    walletAddress: { type: String, required: true, index: true },
    overallRiskScore: { type: Number, required: true },
    intrinsicRisk: { type: Number, required: true },
    systemicRisk: { type: Number, required: true },
    rating: { type: String, required: true },
    trend: { type: String, required: true },
    positions: { type: [positionSchema], default: [] },
    analyzedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

export type WalletAnalysisDocument = InferSchemaType<typeof walletAnalysisSchema>;

export const WalletAnalysisModel =
  models.WalletAnalysis || model("WalletAnalysis", walletAnalysisSchema);
