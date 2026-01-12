import { RateSheet, Transaction } from './types';

export const RATE_SHEETS: RateSheet = {
  "Walk-ins": [
    { type: "PET Clear", price: 3.10 },
    { type: "PET Green", price: 2.00 },
    { type: "PET Brown", price: 1.8 },
    { type: "HDPE", price: 2.00 },
    { type: "Tins", price: 0.8 },
    { type: "Cans", price: 16.50 },
    { type: "C-plastic", price: 2.00 },
    { type: "M-plastic", price: 1.00 },
    { type: "W-paper", price: 1.0 },
    { type: "K4", price: 0.2 },
    { type: "TetraPak", price: 0.2 },
    { type: "PP", price: 0.2 },
    { type: "Glass bottles", price: 0.2 }
  ],
  "CCT": [
    { type: "PET Clear", price: 2.6 },
    { type: "PET Green", price: 1.5 },
    { type: "PET Brown", price: 1.3 },
    { type: "K4", price: 0.5 },
    { type: "C-Plastic", price: 1.5 },
    { type: "M-Plastic", price: 1.3 },
    { type: "Cans", price: 15.5 },
    { type: "HDPE", price: 1.3 },
    { type: "C-oil", price: 1.0 }
  ],
  "ECT": [
    { type: "PET Clear", price: 2.00 },
    { type: "PET Green", price: 1.50 },
    { type: "PET Brown", price: 1.30 },
    { type: "C-oil", price: 1.00 },
    { type: "HDPE", price: 1.30 },
    { type: "Cans", price: 15.50 },
    { type: "C-Plastic", price: 1.50 },
    { type: "M-Plastic", price: 1.30 },
    { type: "K4", price: 0.20 }
  ]
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];